package com.iplauction.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimerUpdateResponse {
  private String roomCode;
  private int timerSeconds;
}

