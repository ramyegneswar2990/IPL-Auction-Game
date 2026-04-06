-- IPL Auction System schema + seed data
CREATE DATABASE IF NOT EXISTS ipl_auction;
USE ipl_auction;

CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper') NOT NULL,
    nationality VARCHAR(50),
    base_price INT NOT NULL DEFAULT 200,
    rating INT NOT NULL DEFAULT 80
);

CREATE TABLE IF NOT EXISTS auction_rooms (
    id VARCHAR(36) PRIMARY KEY,
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_team_id VARCHAR(36),
    status ENUM('LOBBY', 'ACTIVE', 'SOLD', 'ENDED') DEFAULT 'LOBBY',
    current_player_index INT DEFAULT -1,
    current_bid INT DEFAULT 0,
    current_bidder_id VARCHAR(36),
    timer_seconds INT DEFAULT 10,
    player_order TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    purse INT DEFAULT 12000,
    is_host BOOLEAN DEFAULT FALSE,
    has_passed BOOLEAN DEFAULT FALSE,
    session_id VARCHAR(100),
    FOREIGN KEY (room_id) REFERENCES auction_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sold_players (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    team_id VARCHAR(36) NOT NULL,
    sold_price INT NOT NULL,
    sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES auction_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS bids (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    team_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES auction_rooms(id) ON DELETE CASCADE
);

-- Seed 30 IPL players (idempotent on id)
INSERT INTO players (id, name, role, nationality, base_price, rating) VALUES
('p1', 'Virat Kohli', 'Batsman', 'India', 200, 95),
('p2', 'Jasprit Bumrah', 'Bowler', 'India', 200, 94),
('p3', 'MS Dhoni', 'Wicket-Keeper', 'India', 200, 90),
('p4', 'Rohit Sharma', 'Batsman', 'India', 200, 93),
('p5', 'Ravindra Jadeja', 'All-Rounder', 'India', 200, 91),
('p6', 'Pat Cummins', 'Bowler', 'Australia', 200, 92),
('p7', 'Ben Stokes', 'All-Rounder', 'England', 200, 90),
('p8', 'Rashid Khan', 'Bowler', 'Afghanistan', 200, 89),
('p9', 'KL Rahul', 'Wicket-Keeper', 'India', 200, 87),
('p10', 'Hardik Pandya', 'All-Rounder', 'India', 200, 88),
('p11', 'Suryakumar Yadav', 'Batsman', 'India', 200, 89),
('p12', 'Jos Buttler', 'Wicket-Keeper', 'England', 200, 88),
('p13', 'Kagiso Rabada', 'Bowler', 'South Africa', 200, 90),
('p14', 'Trent Boult', 'Bowler', 'New Zealand', 150, 86),
('p15', 'David Warner', 'Batsman', 'Australia', 150, 85),
('p16', 'Shubman Gill', 'Batsman', 'India', 150, 86),
('p17', 'Mitchell Starc', 'Bowler', 'Australia', 200, 88),
('p18', 'Rishabh Pant', 'Wicket-Keeper', 'India', 200, 87),
('p19', 'Andre Russell', 'All-Rounder', 'West Indies', 150, 86),
('p20', 'Yuzvendra Chahal', 'Bowler', 'India', 100, 82),
('p21', 'Faf du Plessis', 'Batsman', 'South Africa', 100, 83),
('p22', 'Glenn Maxwell', 'All-Rounder', 'Australia', 150, 85),
('p23', 'Mohammed Shami', 'Bowler', 'India', 150, 86),
('p24', 'Ishan Kishan', 'Wicket-Keeper', 'India', 100, 80),
('p25', 'Devon Conway', 'Batsman', 'New Zealand', 100, 81),
('p26', 'Kuldeep Yadav', 'Bowler', 'India', 100, 83),
('p27', 'Marcus Stoinis', 'All-Rounder', 'Australia', 100, 80),
('p28', 'Quinton de Kock', 'Wicket-Keeper', 'South Africa', 100, 82),
('p29', 'Axar Patel', 'All-Rounder', 'India', 100, 82),
('p30', 'Sam Curran', 'All-Rounder', 'England', 100, 81)
ON DUPLICATE KEY UPDATE id=id;

