# IPL Auction Backend (Spring Boot + WebSocket)

## Requirements
- Java 17+
- Maven (or use `mvnw`)
- MySQL 8+

## Database setup
1. Create DB and tables using `src/main/resources/schema.sql` (recommended once):
   - Create a database named `ipl_auction`
   - Run the schema file (it also seeds 30 players)

2. Configure credentials in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ipl_auction
spring.datasource.username=root
spring.datasource.password=9949
```

## Run
From `Backend/`:

```bash
./mvnw spring-boot:run
```

Server runs on `http://localhost:8080`.

## WebSocket
- **Endpoint**: `/ws` (SockJS)
- **Send prefix**: `/app`
- **Subscribe prefix**: `/topic`
- **Room topic**: `/topic/room.{roomCode}`
- **User queue**: `/user/queue/events` (direct replies/errors; useful for create/join/state)

### Client → Server mappings
- `/app/room.create` `{ "teamName": "MI" }`
- `/app/room.join` `{ "roomCode": "ABC123", "teamName": "CSK" }`
  - Reconnect supported via `{ "roomCode": "ABC123", "teamId": "<existingTeamId>" }`
- `/app/auction.start` `{ "roomCode": "ABC123" }`
- `/app/auction.bid` `{ "roomCode": "ABC123", "teamId": "<teamId>", "amount": 50 }` (increment in lakhs)
- `/app/auction.pass` `{ "roomCode": "ABC123", "teamId": "<teamId>" }`
- `/app/room.leave` `{ "roomCode": "ABC123", "teamId": "<teamId>" }`
- `/app/room.state` `{ "roomCode": "ABC123", "teamId": "<teamId>" }`

### Server → Client events
Messages are wrapped as:

```json
{ "type": "ROOM_STATE", "payload": { ... } }
```

Room broadcasts go to `/topic/room.{roomCode}`. Direct replies and errors go to `/user/queue/events`.

## Notes
- Auction is **server-authoritative**: bids and timer are validated and controlled server-side.
- Timer resets to 10 seconds on each bid.
- If the **host disconnects**, the room is closed and a `ROOM_CLOSED` event is broadcast.

