package com.iplauction.service;

import com.iplauction.model.dto.TimerUpdateResponse;
import com.iplauction.model.dto.WsEnvelope;
import com.iplauction.model.dto.WsEventType;
import com.iplauction.model.entity.AuctionRoom;
import com.iplauction.repository.AuctionRoomRepository;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TimerService {

  private final AuctionRoomRepository roomRepository;
  private final SimpMessagingTemplate messagingTemplate;
  private final ObjectProvider<AuctionService> auctionService;

  private final Map<String, ScheduledExecutorService> executors = new ConcurrentHashMap<>();
  private final Map<String, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();

  public void startOrReset(String roomCode, int seconds) {
    cancel(roomCode);
    var executor =
        executors.computeIfAbsent(roomCode, rc -> Executors.newSingleThreadScheduledExecutor());

    ScheduledFuture<?> future =
        executor.scheduleAtFixedRate(
            () -> tick(roomCode),
            1,
            1,
            TimeUnit.SECONDS);
    futures.put(roomCode, future);

    roomRepository
        .findByRoomCode(roomCode)
        .ifPresent(
            room -> {
              room.setTimerSeconds(seconds);
              roomRepository.save(room);
              broadcastTimer(room);
            });
  }

  public void cancel(String roomCode) {
    ScheduledFuture<?> f = futures.remove(roomCode);
    if (f != null) {
      f.cancel(false);
    }
  }

  public void shutdownRoom(String roomCode) {
    cancel(roomCode);
    ScheduledExecutorService ex = executors.remove(roomCode);
    if (ex != null) {
      ex.shutdownNow();
    }
  }

  private void tick(String roomCode) {
    AuctionRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
    if (room == null) {
      shutdownRoom(roomCode);
      return;
    }

    if (room.getTimerSeconds() <= 0) {
      cancel(roomCode);
      auctionService.getObject().sellCurrentPlayer(roomCode);
      return;
    }

    room.setTimerSeconds(room.getTimerSeconds() - 1);
    roomRepository.save(room);
    broadcastTimer(room);

    if (room.getTimerSeconds() <= 0) {
      cancel(roomCode);
      auctionService.getObject().sellCurrentPlayer(roomCode);
    }
  }

  private void broadcastTimer(AuctionRoom room) {
    String destination = "/topic/room." + room.getRoomCode();
    var payload =
        TimerUpdateResponse.builder()
            .roomCode(room.getRoomCode())
            .timerSeconds(room.getTimerSeconds())
            .build();
    messagingTemplate.convertAndSend(
        destination,
        WsEnvelope.<TimerUpdateResponse>builder()
            .type(WsEventType.TIMER_UPDATE)
            .payload(payload)
            .build());
  }
}

