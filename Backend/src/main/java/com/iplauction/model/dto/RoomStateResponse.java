package com.iplauction.model.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoomStateResponse {
  private String roomId;
  private String roomCode;
  private String status;

  private String hostTeamId;

  private int currentPlayerIndex;
  private PlayerCardResponse currentPlayer;
  private int currentBid;
  private String currentBidderId;
  private String currentBidderName;
  private int timerSeconds;

  private List<TeamState> teams;

  @Data
  @Builder
  public static class TeamState {
    private String id;
    private String name;
    private int purse;
    private boolean host;
    private boolean passed;
  }
}

