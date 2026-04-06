package com.iplauction.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerSoldResponse {
  private String roomCode;
  private PlayerCardResponse player;
  private boolean sold;
  private String teamId;
  private String teamName;
  private int soldPrice;
}

