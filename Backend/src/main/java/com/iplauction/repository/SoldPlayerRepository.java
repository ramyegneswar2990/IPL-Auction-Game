package com.iplauction.repository;

import com.iplauction.model.entity.SoldPlayer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SoldPlayerRepository extends JpaRepository<SoldPlayer, String> {
  @Query("select sp from SoldPlayer sp where sp.room.roomCode = :roomCode")
  List<SoldPlayer> findByRoomCode(@Param("roomCode") String roomCode);

  @Query("select sp from SoldPlayer sp where sp.room.roomCode = :roomCode and sp.team.id = :teamId")
  List<SoldPlayer> findByRoomCodeAndTeamId(
      @Param("roomCode") String roomCode, @Param("teamId") String teamId);
}

