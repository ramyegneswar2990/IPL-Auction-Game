package com.iplauction.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BidUpdateResponse {
  private String roomCode;
  private String teamId;
  private String teamName;
  private int currentBid;
  private int timerSeconds;
}

