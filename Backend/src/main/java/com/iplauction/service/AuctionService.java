package com.iplauction.service;

import com.iplauction.exception.AuctionException;
import com.iplauction.model.dto.BidUpdateResponse;
import com.iplauction.model.dto.LeaderboardResponse;
import com.iplauction.model.dto.PlayerSoldResponse;
import com.iplauction.model.dto.WsEnvelope;
import com.iplauction.model.dto.WsEventType;
import com.iplauction.model.entity.AuctionRoom;
import com.iplauction.model.entity.Bid;
import com.iplauction.model.entity.Player;
import com.iplauction.model.entity.RoomStatus;
import com.iplauction.model.entity.SoldPlayer;
import com.iplauction.model.entity.Team;
import com.iplauction.repository.AuctionRoomRepository;
import com.iplauction.repository.BidRepository;
import com.iplauction.repository.PlayerRepository;
import com.iplauction.repository.SoldPlayerRepository;
import com.iplauction.repository.TeamRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuctionService {
  private static final int[] BOT_INCREMENTS = {10, 20, 50};
  private static final int SALE_BANNER_SECONDS = 5;

  private final AuctionRoomRepository roomRepository;
  private final TeamRepository teamRepository;
  private final PlayerRepository playerRepository;
  private final SoldPlayerRepository soldPlayerRepository;
  private final BidRepository bidRepository;
  private final TimerService timerService;
  private final RoomService roomService;
  private final SimpMessagingTemplate messagingTemplate;

  private final Map<String, Object> roomLocks = new ConcurrentHashMap<>();
  private final ScheduledExecutorService delayedExecutor = Executors.newSingleThreadScheduledExecutor();

  @Transactional
  public void startAuction(String roomCode, String sessionId) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));

    Team host =
        teamRepository
            .findById(room.getHostTeamId())
            .orElseThrow(() -> new AuctionException("Host team not found"));
    if (host.getSessionId() == null || !host.getSessionId().equals(sessionId)) {
      throw new AuctionException("Only host can start the auction");
    }

    List<Team> teams = teamRepository.findByRoomCode(roomCode);
    if (teams.size() < 2) {
      throw new AuctionException("Need at least 2 teams to start auction");
    }
    if (room.getStatus() != RoomStatus.LOBBY && room.getStatus() != RoomStatus.ENDED) {
      throw new AuctionException("Auction already started");
    }

    List<Player> allPlayers = playerRepository.findAll();
    if (allPlayers.isEmpty()) {
      throw new AuctionException("No players found in database");
    }

    List<String> ids = new ArrayList<>(allPlayers.stream().map(Player::getId).toList());
    Collections.shuffle(ids);
    room.setPlayerOrder(RoomService.toPlayerOrder(ids));

    room.setCurrentPlayerIndex(0);
    Player p = playerRepository.findById(ids.get(0)).orElseThrow();
    room.setCurrentBid(p.getBasePrice());
    room.setCurrentBidderId(null);
    room.setTimerSeconds(10);
    room.setStatus(RoomStatus.ACTIVE);
    roomRepository.save(room);

    resetPassed(roomCode);

    broadcast(roomCode, WsEventType.AUCTION_STARTED, roomService.buildRoomState(room));
    broadcast(roomCode, WsEventType.NEW_PLAYER, roomService.buildRoomState(room));
    timerService.startOrReset(roomCode, 10);
    scheduleBotBidIfNeeded(roomCode);
  }

  @Transactional
  public void placeBid(String roomCode, String teamId, int incrementAmount) {
    synchronized (lock(roomCode)) {
      AuctionRoom room =
          roomRepository
              .findByRoomCode(roomCode)
              .orElseThrow(() -> new AuctionException("Room not found"));
      if (room.getStatus() != RoomStatus.ACTIVE) {
        throw new AuctionException("Auction not active");
      }

      Team team = teamRepository.findById(teamId).orElseThrow(() -> new AuctionException("Team not found"));
      if (!team.getRoom().getId().equals(room.getId())) {
        throw new AuctionException("Team not in this room");
      }
      if (teamId.equals(room.getCurrentBidderId())) {
        throw new AuctionException("You are already the highest bidder");
      }

      Player currentPlayer = roomService.resolveCurrentPlayer(room);
      if (currentPlayer == null) {
        throw new AuctionException("No current player");
      }

      int newBid = room.getCurrentBid() + incrementAmount;
      if (newBid <= room.getCurrentBid()) {
        throw new AuctionException("Invalid bid increment");
      }
      if (newBid > team.getPurse()) {
        throw new AuctionException("Insufficient purse");
      }

      room.setCurrentBid(newBid);
      room.setCurrentBidderId(teamId);
      room.setTimerSeconds(10);
      roomRepository.save(room);

      resetPassed(roomCode);

      Bid bid =
          Bid.builder()
              .id(UUID.randomUUID().toString())
              .room(room)
              .player(currentPlayer)
              .team(team)
              .amount(newBid)
              .build();
      bidRepository.save(bid);

      timerService.startOrReset(roomCode, 10);

      var payload =
          BidUpdateResponse.builder()
              .roomCode(roomCode)
              .teamId(team.getId())
              .teamName(team.getName())
              .currentBid(newBid)
              .timerSeconds(10)
              .build();
      broadcast(roomCode, WsEventType.BID_PLACED, payload);
      broadcast(roomCode, WsEventType.ROOM_STATE, roomService.buildRoomState(room));
    }
  }

  @Transactional
  public void pass(String roomCode, String teamId) {
    synchronized (lock(roomCode)) {
      AuctionRoom room =
          roomRepository
              .findByRoomCode(roomCode)
              .orElseThrow(() -> new AuctionException("Room not found"));
      if (room.getStatus() != RoomStatus.ACTIVE) {
        throw new AuctionException("Auction not active");
      }
      Team team = teamRepository.findById(teamId).orElseThrow(() -> new AuctionException("Team not found"));
      if (!team.getRoom().getId().equals(room.getId())) {
        throw new AuctionException("Team not in this room");
      }

      team.setHasPassed(true);
      teamRepository.save(team);

      // If all non-highest-bidder teams have passed, force sell immediately.
      List<Team> teams = teamRepository.findByRoomCode(roomCode);
      boolean allPassed =
          teams.stream()
              .filter(t -> !t.getId().equals(room.getCurrentBidderId()))
              .allMatch(Team::isHasPassed);
      broadcast(roomCode, WsEventType.ROOM_STATE, roomService.buildRoomState(room));
      if (allPassed) {
        timerService.cancel(roomCode);
        sellCurrentPlayer(roomCode);
      }
    }
  }

  @Transactional
  public void sellCurrentPlayer(String roomCode) {
    synchronized (lock(roomCode)) {
      AuctionRoom room =
          roomRepository
              .findByRoomCode(roomCode)
              .orElse(null);
      if (room == null) return;
      if (room.getStatus() != RoomStatus.ACTIVE) return;

      Player currentPlayer = roomService.resolveCurrentPlayer(room);
      if (currentPlayer == null) {
        endAuction(roomCode);
        return;
      }

      String bidderId = room.getCurrentBidderId();
      if (bidderId != null) {
        Team winner = teamRepository.findById(bidderId).orElseThrow();
        if (room.getCurrentBid() > winner.getPurse()) {
          // Should not happen due to validation, but protect anyway.
          bidderId = null;
        } else {
          winner.setPurse(winner.getPurse() - room.getCurrentBid());
          teamRepository.save(winner);

          SoldPlayer sold =
              SoldPlayer.builder()
                  .id(UUID.randomUUID().toString())
                  .room(room)
                  .player(currentPlayer)
                  .team(winner)
                  .soldPrice(room.getCurrentBid())
                  .build();
          soldPlayerRepository.save(sold);

          var payload =
              PlayerSoldResponse.builder()
                  .roomCode(roomCode)
                  .player(RoomService.toPlayerCard(currentPlayer))
                  .sold(true)
                  .teamId(winner.getId())
                  .teamName(winner.getName())
                  .soldPrice(room.getCurrentBid())
                  .build();
          broadcast(roomCode, WsEventType.PLAYER_SOLD, payload);
          broadcast(roomCode, WsEventType.ROOM_STATE, roomService.buildRoomState(room));
        }
      }

      if (bidderId == null) {
        var payload =
            PlayerSoldResponse.builder()
                .roomCode(roomCode)
                .player(RoomService.toPlayerCard(currentPlayer))
                .sold(false)
                .soldPrice(room.getCurrentBid())
                .build();
        broadcast(roomCode, WsEventType.PLAYER_UNSOLD, payload);
        broadcast(roomCode, WsEventType.ROOM_STATE, roomService.buildRoomState(room));
      }

      room.setStatus(RoomStatus.SOLD);
      roomRepository.save(room);

      delayedExecutor.schedule(() -> nextPlayer(roomCode), SALE_BANNER_SECONDS, TimeUnit.SECONDS);
    }
  }

  @Transactional
  public void nextPlayer(String roomCode) {
    synchronized (lock(roomCode)) {
      AuctionRoom room =
          roomRepository
              .findByRoomCode(roomCode)
              .orElse(null);
      if (room == null) return;

      List<String> ids = RoomService.parsePlayerOrder(room.getPlayerOrder());
      int nextIndex = room.getCurrentPlayerIndex() + 1;
      if (ids.isEmpty() || nextIndex >= ids.size()) {
        endAuction(roomCode);
        return;
      }

      room.setCurrentPlayerIndex(nextIndex);
      Player nextPlayer = playerRepository.findById(ids.get(nextIndex)).orElseThrow();
      room.setCurrentBid(nextPlayer.getBasePrice());
      room.setCurrentBidderId(null);
      room.setTimerSeconds(10);
      room.setStatus(RoomStatus.ACTIVE);
      roomRepository.save(room);
      resetPassed(roomCode);

      broadcast(roomCode, WsEventType.NEXT_PLAYER, roomService.buildRoomState(room));
      broadcast(roomCode, WsEventType.NEW_PLAYER, roomService.buildRoomState(room));
      timerService.startOrReset(roomCode, 10);
    }
  }

  @Transactional
  public void endAuction(String roomCode) {
    AuctionRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
    if (room == null) return;

    timerService.cancel(roomCode);
    room.setStatus(RoomStatus.ENDED);
    roomRepository.save(room);

    LeaderboardResponse leaderboard = computeLeaderboard(roomCode);
    broadcast(roomCode, WsEventType.AUCTION_ENDED, leaderboard);
    broadcast(roomCode, WsEventType.ROOM_STATE, roomService.buildRoomState(room));
  }

  @Transactional(readOnly = true)
  public LeaderboardResponse computeLeaderboard(String roomCode) {
    List<Team> teams = teamRepository.findByRoomCode(roomCode);
    List<SoldPlayer> sold = soldPlayerRepository.findByRoomCode(roomCode);

    Map<String, List<SoldPlayer>> byTeam = new HashMap<>();
    for (SoldPlayer sp : sold) {
      byTeam.computeIfAbsent(sp.getTeam().getId(), k -> new ArrayList<>()).add(sp);
    }

    List<LeaderboardResponse.Entry> entries =
        teams.stream()
            .map(
                t -> {
                  List<SoldPlayer> squad = byTeam.getOrDefault(t.getId(), List.of());
                  int squadRating = squad.stream().mapToInt(sp -> sp.getPlayer().getRating()).sum();
                  int playersCount = squad.size();
                  int remaining = t.getPurse();
                  int score = squadRating + (remaining / 100) + (playersCount * 5);
                  return LeaderboardResponse.Entry.builder()
                      .teamId(t.getId())
                      .teamName(t.getName())
                      .playersCount(playersCount)
                      .squadRating(squadRating)
                      .remainingPurse(remaining)
                      .score(score)
                      .build();
                })
            .sorted(Comparator.comparingInt(LeaderboardResponse.Entry::getScore).reversed())
            .toList();

    return LeaderboardResponse.builder().roomCode(roomCode).entries(entries).build();
  }

  @Transactional
  public void closeRoomAsHostDisconnect(String roomCode) {
    roomService.closeRoom(roomCode, "Host disconnected");
  }

  @Transactional
  public void forceEndAuction(String roomCode, String sessionId) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));
    Team host =
        teamRepository
            .findById(room.getHostTeamId())
            .orElseThrow(() -> new AuctionException("Host team not found"));
    if (host.getSessionId() == null || !host.getSessionId().equals(sessionId)) {
      throw new AuctionException("Only host can open results");
    }
    endAuction(roomCode);
  }

  private void resetPassed(String roomCode) {
    List<Team> teams = teamRepository.findByRoomCode(roomCode);
    for (Team t : teams) {
      if (t.isHasPassed()) {
        t.setHasPassed(false);
      }
    }
    teamRepository.saveAll(teams);
  }

  private Object lock(String roomCode) {
    return roomLocks.computeIfAbsent(roomCode, rc -> new Object());
  }

  private void broadcast(String roomCode, WsEventType type, Object payload) {
    messagingTemplate.convertAndSend(
        "/topic/room." + roomCode,
        WsEnvelope.<Object>builder().type(type).payload(payload).build());
  }

  private void scheduleBotBidIfNeeded(String roomCode) {
    delayedExecutor.schedule(
        () -> {
          try {
            maybeBotBidNow(roomCode);
          } catch (Exception ignored) {
          }
        },
        ThreadLocalRandom.current().nextInt(2000, 4001),
        TimeUnit.MILLISECONDS);
  }

  @Transactional
  protected void maybeBotBidNow(String roomCode) {
    synchronized (lock(roomCode)) {
      boolean keepRunning = false;
      try {
        AuctionRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
        if (room == null || room.getStatus() != RoomStatus.ACTIVE) return;
        keepRunning = true;
        if (room.getTimerSeconds() <= 1) return;

        Player currentPlayer = roomService.resolveCurrentPlayer(room);
        if (currentPlayer == null) return;

        List<Team> bots =
            teamRepository.findByRoomCode(roomCode).stream()
                .filter(t -> t.isBot() || (!t.isHost() && t.getSessionId() == null))
                .filter(t -> !t.getId().equals(room.getCurrentBidderId()))
                .toList();
        if (bots.isEmpty()) return;

        Collections.shuffle(bots);
        int competitors = Math.min(Math.max(2, ThreadLocalRandom.current().nextInt(2, 4)), bots.size());

        int bidsPlaced = 0;
        for (Team bot : bots) {
          if (bidsPlaced >= competitors) break;

          double aggression = aggressionFor(bot.getId());
          int currentBid = room.getCurrentBid();
          int minRequired = currentBid + 10;
          if (bot.getPurse() < minRequired) continue;

          // Hard cap by player value: once too expensive (>5x base), most bots stop.
          if (currentBid > currentPlayer.getBasePrice() * 5 && ThreadLocalRandom.current().nextDouble() > 0.2) {
            continue;
          }

          // Purse protection: if next bid would exceed 70% purse, likely pass.
          double projectedRatio = (double) minRequired / (double) bot.getPurse();
          if (projectedRatio > 0.7 && ThreadLocalRandom.current().nextDouble() < 0.75) {
            continue;
          }

          // Aggressive bots bid more often.
          double bidChance = 0.20 + (aggression * 0.70);
          if (ThreadLocalRandom.current().nextDouble() > bidChance) continue;

          List<Integer> possible = new ArrayList<>();
          for (int inc : BOT_INCREMENTS) {
            if (currentBid + inc <= bot.getPurse()) {
              possible.add(inc);
            }
          }
          if (possible.isEmpty()) continue;

          int increment = chooseIncrement(possible, aggression);
          placeBid(roomCode, bot.getId(), increment);
          bidsPlaced += 1;
        }

        if (bidsPlaced == 0) {
          List<Team> affordable =
              bots.stream().filter(t -> t.getPurse() >= room.getCurrentBid() + 10).toList();
          if (!affordable.isEmpty()) {
            Team forced = affordable.get(ThreadLocalRandom.current().nextInt(affordable.size()));
            placeBid(roomCode, forced.getId(), 10);
          }
        }
      } finally {
        if (keepRunning) {
          scheduleBotBidIfNeeded(roomCode);
        }
      }
    }
  }

  private final Map<String, Double> botAggressionMap = new ConcurrentHashMap<>();

  private double aggressionFor(String teamId) {
    return botAggressionMap.computeIfAbsent(teamId, id -> ThreadLocalRandom.current().nextDouble(0.3, 0.81));
  }

  private int chooseIncrement(List<Integer> possible, double aggression) {
    if (possible.size() == 1) return possible.get(0);
    if (aggression >= 0.65 && possible.contains(50) && ThreadLocalRandom.current().nextDouble() < 0.55) {
      return 50;
    }
    if (aggression >= 0.5 && possible.contains(20) && ThreadLocalRandom.current().nextDouble() < 0.5) {
      return 20;
    }
    return possible.get(ThreadLocalRandom.current().nextInt(possible.size()));
  }
}

