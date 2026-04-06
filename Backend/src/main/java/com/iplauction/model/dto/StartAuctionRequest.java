package com.iplauction.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartAuctionRequest {
  @NotBlank private String roomCode;
}

