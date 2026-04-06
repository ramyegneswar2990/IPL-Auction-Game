package com.iplauction.repository;

import com.iplauction.model.entity.Team;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamRepository extends JpaRepository<Team, String> {
  @Query("select t from Team t where t.room.roomCode = :roomCode")
  List<Team> findByRoomCode(@Param("roomCode") String roomCode);

  @Query("select t from Team t where t.room.roomCode = :roomCode and t.sessionId = :sessionId")
  Optional<Team> findByRoomCodeAndSessionId(
      @Param("roomCode") String roomCode, @Param("sessionId") String sessionId);

  @Query("select t from Team t where t.sessionId = :sessionId")
  List<Team> findBySessionId(@Param("sessionId") String sessionId);
}

