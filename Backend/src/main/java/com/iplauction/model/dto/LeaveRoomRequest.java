package com.iplauction.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeaveRoomRequest {
  @NotBlank private String roomCode;
  @NotBlank private String teamId;
}

