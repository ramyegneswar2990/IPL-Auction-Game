package com.iplauction.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerCardResponse {
  private String id;
  private String name;
  private String role;
  private String nationality;
  private int basePrice;
  private int rating;
}

