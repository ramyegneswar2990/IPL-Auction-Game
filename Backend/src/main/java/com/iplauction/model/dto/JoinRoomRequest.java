package com.iplauction.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinRoomRequest {
  @NotBlank private String roomCode;

  // For first-time join, provide teamName.
  // For reconnection, provide existing teamId (and teamName can be omitted).
  private String teamName;
  private String teamId;
}

