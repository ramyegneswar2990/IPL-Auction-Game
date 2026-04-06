package com.iplauction.repository;

import com.iplauction.model.entity.Bid;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BidRepository extends JpaRepository<Bid, String> {
  @Query("select b from Bid b where b.room.roomCode = :roomCode order by b.bidTime desc")
  List<Bid> findByRoomCodeOrderByBidTimeDesc(@Param("roomCode") String roomCode);
}

