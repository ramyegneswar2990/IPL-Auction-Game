package com.iplauction.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForceResultsRequest {
  @NotBlank private String roomCode;
}

