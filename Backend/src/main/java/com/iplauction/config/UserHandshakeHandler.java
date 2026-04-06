package com.iplauction.config;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

/**
 * Provides a Principal for each WebSocket session so we can use /user destinations without a full
 * authentication system.
 */
public class UserHandshakeHandler extends DefaultHandshakeHandler {
  @Override
  protected Principal determineUser(
      ServerHttpRequest request,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {
    String name = UUID.randomUUID().toString();
    return () -> name;
  }
}

