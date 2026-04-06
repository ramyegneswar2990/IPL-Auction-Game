package com.iplauction.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {
  @Id
  @Column(length = 36)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_id", nullable = false)
  private AuctionRoom room;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false)
  @Builder.Default
  private int purse = 12000;

  @Column(name = "is_host", nullable = false)
  @Builder.Default
  private boolean isHost = false;

  @Column(name = "has_passed", nullable = false)
  @Builder.Default
  private boolean hasPassed = false;

  @Column(name = "is_bot", nullable = false)
  @Builder.Default
  private boolean isBot = false;

  @Column(name = "session_id", length = 100)
  private String sessionId;
}

