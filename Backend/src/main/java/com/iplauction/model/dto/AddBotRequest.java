package com.iplauction.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddBotRequest {
  @NotBlank private String roomCode;
  private String teamName;
}

