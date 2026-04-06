package com.iplauction.repository;

import com.iplauction.model.entity.AuctionRoom;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionRoomRepository extends JpaRepository<AuctionRoom, String> {
  Optional<AuctionRoom> findByRoomCode(String roomCode);
  boolean existsByRoomCode(String roomCode);
}

