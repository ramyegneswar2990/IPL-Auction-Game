package com.iplauction.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 30)
  private PlayerRole role;

  @Column(length = 50)
  private String nationality;

  @Column(name = "base_price", nullable = false)
  private int basePrice;

  @Column(nullable = false)
  private int rating;
}

