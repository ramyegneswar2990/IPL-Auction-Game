package com.iplauction.config;

import com.iplauction.model.entity.Team;
import com.iplauction.repository.TeamRepository;
import com.iplauction.service.AuctionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketDisconnectListener {

  private final TeamRepository teamRepository;
  private final AuctionService auctionService;

  @EventListener
  @Transactional
  public void onDisconnect(SessionDisconnectEvent event) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = accessor.getSessionId();
    if (sessionId == null) return;

    List<Team> teams = teamRepository.findBySessionId(sessionId);
    if (teams.isEmpty()) return;

    Team hostTeam = teams.stream().filter(Team::isHost).findFirst().orElse(null);
    if (hostTeam != null) {
      String roomCode = hostTeam.getRoom().getRoomCode();
      auctionService.closeRoomAsHostDisconnect(roomCode);
      return;
    }

    for (Team team : teams) {
      team.setSessionId(null);
    }
    teamRepository.saveAll(teams);
  }
}

