package com.iplauction.service;

import com.iplauction.exception.AuctionException;
import com.iplauction.model.dto.PlayerCardResponse;
import com.iplauction.model.dto.RoomStateResponse;
import com.iplauction.model.dto.WsEnvelope;
import com.iplauction.model.dto.WsEventType;
import com.iplauction.model.entity.AuctionRoom;
import com.iplauction.model.entity.Player;
import com.iplauction.model.entity.RoomStatus;
import com.iplauction.model.entity.Team;
import com.iplauction.repository.AuctionRoomRepository;
import com.iplauction.repository.PlayerRepository;
import com.iplauction.repository.TeamRepository;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomService {

  private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RNG = new SecureRandom();
  private static final List<String> IPL_TEAMS =
      List.of(
          "CSK", "MI", "RCB", "KKR", "SRH", "RR", "DC", "PBKS", "GT", "LSG");

  private final AuctionRoomRepository roomRepository;
  private final TeamRepository teamRepository;
  private final PlayerRepository playerRepository;
  private final SimpMessagingTemplate messagingTemplate;
  private final TimerService timerService;

  @Transactional
  public Team createRoom(String teamName, String sessionId) {
    String code = generateRoomCode();
    AuctionRoom room =
        AuctionRoom.builder()
            .id(UUID.randomUUID().toString())
            .roomCode(code)
            .status(RoomStatus.LOBBY)
            .currentPlayerIndex(-1)
            .currentBid(0)
            .timerSeconds(10)
            .build();
    roomRepository.save(room);

    Team host =
        Team.builder()
            .id(UUID.randomUUID().toString())
            .room(room)
            .name(teamName)
            .isHost(true)
            .hasPassed(false)
            .purse(12000)
            .sessionId(sessionId)
            .build();
    teamRepository.save(host);

    room.setHostTeamId(host.getId());
    roomRepository.save(room);

    broadcast(code, WsEventType.ROOM_CREATED, buildRoomState(room));
    return host;
  }

  @Transactional
  public Team joinRoom(String roomCode, String teamName, String existingTeamId, String sessionId) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));

    if (room.getStatus() != RoomStatus.LOBBY) {
      throw new AuctionException("Room is not accepting joins. Auction already started.");
    }

    if (existingTeamId != null && !existingTeamId.isBlank()) {
      Team team =
          teamRepository
              .findById(existingTeamId)
              .orElseThrow(() -> new AuctionException("Team not found for reconnection"));
      if (!team.getRoom().getId().equals(room.getId())) {
        throw new AuctionException("Team does not belong to this room");
      }
      team.setSessionId(sessionId);
      teamRepository.save(team);
      // Send full state to room (and client can filter by reconnection)
      broadcast(roomCode, WsEventType.ROOM_STATE, buildRoomState(room));
      return team;
    }

    if (teamName == null || teamName.isBlank()) {
      throw new AuctionException("teamName is required");
    }
    validateUniqueTeamName(roomCode, teamName);

    Team team =
        Team.builder()
            .id(UUID.randomUUID().toString())
            .room(room)
            .name(teamName)
            .isHost(false)
            .hasPassed(false)
            .isBot(false)
            .purse(12000)
            .sessionId(sessionId)
            .build();
    teamRepository.save(team);

    broadcast(roomCode, WsEventType.USER_JOINED, buildRoomState(room));
    return team;
  }

  @Transactional
  public void leaveRoom(String roomCode, String teamId) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));
    Team team = teamRepository.findById(teamId).orElseThrow(() -> new AuctionException("Team not found"));

    if (team.isHost()) {
      closeRoom(roomCode, "Host left the room");
      return;
    }

    teamRepository.delete(team);
    broadcast(roomCode, WsEventType.ROOM_STATE, buildRoomState(room));

    // If auction is active and teams drop below 2, end auction (simple rule)
    List<Team> teams = teamRepository.findByRoomCode(roomCode);
    if (room.getStatus() == RoomStatus.ACTIVE && teams.size() < 2) {
      closeRoom(roomCode, "Not enough teams to continue");
    }
  }

  @Transactional
  public void closeRoom(String roomCode, String reason) {
    AuctionRoom room =
        roomRepository.findByRoomCode(roomCode).orElse(null);
    if (room == null) return;

    timerService.shutdownRoom(roomCode);
    broadcast(roomCode, WsEventType.ROOM_CLOSED, reason);
    roomRepository.delete(room);
  }

  @Transactional
  public Team addBotToRoom(String roomCode, String hostSessionId, String requestedName) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));
    if (room.getStatus() != RoomStatus.LOBBY) {
      throw new AuctionException("Bots can only be added in lobby");
    }

    Team host =
        teamRepository
            .findById(room.getHostTeamId())
            .orElseThrow(() -> new AuctionException("Host team not found"));
    if (hostSessionId == null || !hostSessionId.equals(host.getSessionId())) {
      throw new AuctionException("Only host can add bots");
    }

    String botName = requestedName;
    if (botName == null || botName.isBlank()) {
      botName = suggestAvailableTeamName(roomCode);
    }
    validateUniqueTeamName(roomCode, botName);

    Team bot =
        Team.builder()
            .id(UUID.randomUUID().toString())
            .room(room)
            .name(botName)
            .isHost(false)
            .isBot(true)
            .hasPassed(false)
            .purse(12000)
            .sessionId(null)
            .build();
    teamRepository.save(bot);
    broadcast(roomCode, WsEventType.USER_JOINED, buildRoomState(room));
    return bot;
  }

  @Transactional(readOnly = true)
  public RoomStateResponse buildRoomStateByCode(String roomCode) {
    AuctionRoom room =
        roomRepository
            .findByRoomCode(roomCode)
            .orElseThrow(() -> new AuctionException("Room not found"));
    return buildRoomState(room);
  }

  @Transactional(readOnly = true)
  public RoomStateResponse buildRoomState(AuctionRoom room) {
    String roomCode = room.getRoomCode();
    List<Team> teams =
        teamRepository.findByRoomCode(roomCode).stream()
            .sorted(Comparator.comparing(Team::isHost).reversed().thenComparing(Team::getName))
            .toList();

    Player currentPlayer = resolveCurrentPlayer(room);
    String bidderName = null;
    if (room.getCurrentBidderId() != null) {
      bidderName =
          teams.stream()
              .filter(t -> t.getId().equals(room.getCurrentBidderId()))
              .map(Team::getName)
              .findFirst()
              .orElse(null);
    }

    return RoomStateResponse.builder()
        .roomId(room.getId())
        .roomCode(roomCode)
        .status(room.getStatus().name())
        .hostTeamId(room.getHostTeamId())
        .currentPlayerIndex(room.getCurrentPlayerIndex())
        .currentPlayer(currentPlayer == null ? null : toPlayerCard(currentPlayer))
        .currentBid(room.getCurrentBid())
        .currentBidderId(room.getCurrentBidderId())
        .currentBidderName(bidderName)
        .timerSeconds(room.getTimerSeconds())
        .teams(
            teams.stream()
                .map(
                    t ->
                        RoomStateResponse.TeamState.builder()
                            .id(t.getId())
                            .name(t.getName())
                            .purse(t.getPurse())
                            .host(t.isHost())
                            .passed(t.isHasPassed())
                            .build())
                .collect(Collectors.toList()))
        .build();
  }

  @Transactional(readOnly = true)
  public Player resolveCurrentPlayer(AuctionRoom room) {
    if (room.getCurrentPlayerIndex() < 0) return null;
    List<String> ids = parsePlayerOrder(room.getPlayerOrder());
    if (ids.isEmpty() || room.getCurrentPlayerIndex() >= ids.size()) return null;
    String playerId = ids.get(room.getCurrentPlayerIndex());
    return playerRepository.findById(playerId).orElse(null);
  }

  public static List<String> parsePlayerOrder(String playerOrder) {
    if (playerOrder == null || playerOrder.isBlank()) return List.of();
    return List.of(playerOrder.split(",")).stream().map(String::trim).filter(s -> !s.isBlank()).toList();
  }

  public static String toPlayerOrder(List<String> playerIds) {
    return String.join(",", playerIds);
  }

  public static PlayerCardResponse toPlayerCard(Player p) {
    String role =
        switch (p.getRole()) {
          case Batsman -> "Batsman";
          case Bowler -> "Bowler";
          case AllRounder -> "All-Rounder";
          case WicketKeeper -> "Wicket-Keeper";
        };
    return PlayerCardResponse.builder()
        .id(p.getId())
        .name(p.getName())
        .role(role)
        .nationality(p.getNationality())
        .basePrice(p.getBasePrice())
        .rating(p.getRating())
        .build();
  }

  private void broadcast(String roomCode, WsEventType type, Object payload) {
    messagingTemplate.convertAndSend(
        "/topic/room." + roomCode,
        WsEnvelope.<Object>builder().type(type).payload(payload).build());
  }

  private void validateUniqueTeamName(String roomCode, String teamName) {
    String normalized = teamName.trim().toLowerCase(Locale.ROOT);
    boolean exists =
        teamRepository.findByRoomCode(roomCode).stream()
            .map(t -> t.getName() == null ? "" : t.getName().trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);
    if (exists) {
      throw new AuctionException("Team name already taken in this room");
    }
  }

  private String suggestAvailableTeamName(String roomCode) {
    Set<String> used =
        teamRepository.findByRoomCode(roomCode).stream()
            .map(t -> t.getName() == null ? "" : t.getName().trim().toUpperCase(Locale.ROOT))
            .collect(Collectors.toSet());
    return IPL_TEAMS.stream().filter(t -> !used.contains(t)).findFirst().orElse("BOT-" + RNG.nextInt(99));
  }

  private static String generateRoomCode() {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 6; i++) {
      sb.append(CODE_ALPHABET.charAt(RNG.nextInt(CODE_ALPHABET.length())));
    }
    return sb.toString().toUpperCase(Locale.ROOT);
  }
}

