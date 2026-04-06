package com.iplauction.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaceBidRequest {
  @NotBlank private String roomCode;
  @NotBlank private String teamId;

  // Increment amount (in lakhs) to add on top of current bid
  @Min(1)
  private int amount;
}

