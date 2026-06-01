package com.iplauction.controller;

import com.iplauction.exception.AuctionException;
import com.iplauction.model.dto.CreateRoomRequest;
import com.iplauction.model.dto.ErrorResponse;
import com.iplauction.model.dto.AddBotRequest;
import com.iplauction.model.dto.JoinRoomRequest;
import com.iplauction.model.dto.LeaveRoomRequest;
import com.iplauction.model.dto.PassRequest;
import com.iplauction.model.dto.PlaceBidRequest;
import com.iplauction.model.dto.ForceResultsRequest;
import com.iplauction.model.dto.RoomStateRequest;
import com.iplauction.model.dto.StartAuctionRequest;
import com.iplauction.model.dto.WsEnvelope;
import com.iplauction.model.dto.WsEventType;
import com.iplauction.service.AuctionService;
import com.iplauction.service.RoomService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AuctionWebSocketController {

  private final RoomService roomService;
  private final AuctionService auctionService;
  private final SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/room.create")
  public void createRoom(
      @Valid CreateRoomRequest req,
      Principal principal,
      SimpMessageHeaderAccessor headers) {
    String sessionId = headers.getSessionId();
    var host = roomService.createRoom(req.getTeamName(), sessionId);
    var state = roomService.buildRoomStateByCode(host.getRoom().getRoomCode());
    sendToUser(principal, WsEventType.ROOM_CREATED, state);
  }

  @MessageMapping("/room.join")
  public void joinRoom(
      @Valid JoinRoomRequest req, Principal principal, SimpMessageHeaderAccessor headers) {
    String sessionId = headers.getSessionId();
    var team = roomService.joinRoom(req.getRoomCode(), req.getTeamName(), req.getTeamId(), sessionId);
    var state = roomService.buildRoomStateByCode(team.getRoom().getRoomCode());
    sendToUser(principal, WsEventType.ROOM_STATE, state);
  }

  @MessageMapping("/auction.start")
  public void startAuction(
      @Valid StartAuctionRequest req, Principal principal, SimpMessageHeaderAccessor headers) {
    auctionService.startAuction(req.getRoomCode(), headers.getSessionId());
  }

  @MessageMapping("/auction.bid")
  public void bid(@Valid PlaceBidRequest req) {
    auctionService.placeBid(req.getRoomCode(), req.getTeamId(), req.getAmount());
  }

  @MessageMapping("/auction.pass")
  public void pass(@Valid PassRequest req) {
    auctionService.pass(req.getRoomCode(), req.getTeamId());
  }

  @MessageMapping("/auction.results")
  public void forceResults(@Valid ForceResultsRequest req, SimpMessageHeaderAccessor headers) {
    auctionService.forceEndAuction(req.getRoomCode(), headers.getSessionId());
  }

  @MessageMapping("/room.leave")
  public void leave(@Valid LeaveRoomRequest req) {
    roomService.leaveRoom(req.getRoomCode(), req.getTeamId());
  }

  @MessageMapping("/room.state")
  public void state(@Valid RoomStateRequest req, Principal principal) {
    var state = roomService.buildRoomStateByCode(req.getRoomCode());
    sendToUser(principal, WsEventType.ROOM_STATE, state);
  }

  @MessageMapping("/room.addBot")
  public void addBot(@Valid AddBotRequest req, SimpMessageHeaderAccessor headers) {
    roomService.addBotToRoom(req.getRoomCode(), headers.getSessionId(), req.getTeamName());
  }

  @MessageExceptionHandler
  public void handleException(Throwable ex, Principal principal) {
    if (ex instanceof AuctionException) {
      sendToUser(
          principal, WsEventType.ERROR, ErrorResponse.builder().message(ex.getMessage()).build());
      return;
    }
    log.warn("WebSocket handler failed", ex);
    String message = resolveClientMessage(ex);
    sendToUser(principal, WsEventType.ERROR, ErrorResponse.builder().message(message).build());
  }

  private static String resolveClientMessage(Throwable ex) {
    for (Throwable t = ex; t != null; t = t.getCause()) {
      if (t instanceof AuctionException) {
        return t.getMessage();
      }
      if (t instanceof CannotGetJdbcConnectionException
          || t instanceof DataAccessResourceFailureException) {
        return "Database is not available. Start MySQL on port 3307 (docker compose up mysql) and restart the backend.";
      }
      String msg = t.getMessage();
      if (msg != null
          && (msg.contains("Communications link failure")
              || msg.contains("Connection refused")
              || msg.contains("Connection is not available"))) {
        return "Database is not available. Start MySQL on port 3307 (docker compose up mysql) and restart the backend.";
      }
    }
    return "Unexpected error";
  }

  private void sendToUser(Principal principal, WsEventType type, Object payload) {
    if (principal == null) return;
    messagingTemplate.convertAndSendToUser(
        principal.getName(),
        "/queue/events",
        WsEnvelope.<Object>builder().type(type).payload(payload).build());
  }
}

