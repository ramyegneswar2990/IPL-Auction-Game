package com.iplauction.model.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PlayerRoleConverter implements AttributeConverter<PlayerRole, String> {

  @Override
  public String convertToDatabaseColumn(PlayerRole attribute) {
    if (attribute == null) return null;
    return switch (attribute) {
      case Batsman -> "Batsman";
      case Bowler -> "Bowler";
      case AllRounder -> "All-Rounder";
      case WicketKeeper -> "Wicket-Keeper";
    };
  }

  @Override
  public PlayerRole convertToEntityAttribute(String dbData) {
    if (dbData == null) return null;
    return switch (dbData) {
      case "Batsman" -> PlayerRole.Batsman;
      case "Bowler" -> PlayerRole.Bowler;
      case "All-Rounder" -> PlayerRole.AllRounder;
      case "Wicket-Keeper" -> PlayerRole.WicketKeeper;
      default -> throw new IllegalArgumentException("Unknown player role: " + dbData);
    };
  }
}

