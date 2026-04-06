package com.iplauction.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "auction_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionRoom {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "room_code", unique = true, nullable = false, length = 10)
  private String roomCode;

  @Column(name = "host_team_id", length = 36)
  private String hostTeamId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  @Builder.Default
  private RoomStatus status = RoomStatus.LOBBY;

  @Column(name = "current_player_index", nullable = false)
  @Builder.Default
  private int currentPlayerIndex = -1;

  @Column(name = "current_bid", nullable = false)
  @Builder.Default
  private int currentBid = 0;

  @Column(name = "current_bidder_id", length = 36)
  private String currentBidderId;

  @Column(name = "timer_seconds", nullable = false)
  @Builder.Default
  private int timerSeconds = 10;

  // Stores shuffled player ids, comma-separated (e.g. p1,p9,p2,...)
  @Column(name = "player_order", columnDefinition = "TEXT")
  private String playerOrder;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private Instant createdAt;
}

