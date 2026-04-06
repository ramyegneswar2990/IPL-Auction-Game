package com.iplauction.model.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardResponse {
  private String roomCode;
  private List<Entry> entries;

  @Data
  @Builder
  public static class Entry {
    private String teamId;
    private String teamName;
    private int playersCount;
    private int squadRating;
    private int remainingPurse;
    private int score;
  }
}

