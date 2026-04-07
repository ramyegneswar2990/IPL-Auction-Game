# IPL Auction System Design Document

## Purpose

This document describes the architecture, data flow, and component design for the IPL Auction System. The application is built as a real-time auction experience where multiple clients interact through a WebSocket-backed server.

## High-Level Architecture

The system is divided into two main parts:

1. Backend: Spring Boot service with WebSocket STOMP messaging
2. Frontend: React + Vite client using Redux for state management

## Backend Design

### Core Responsibilities

- Manage auction rooms and teams
- Maintain current auction state and player bidding
- Broadcast state updates to connected clients
- Handle room creation, join, leave, bid, pass, and results actions

### Key Components

- `IplAuctionApplication` - Spring Boot entry point
- `WebSocketConfig` - STOMP endpoint configuration
- `AuctionWebSocketController` - handles incoming WebSocket commands
- `RoomService` - room lifecycle, join/leave, bot management
- `AuctionService` - auction state transitions, bidding, sale outcomes
- `repository/` - persistent storage with Spring Data JPA

### WebSocket Endpoints

- STOMP endpoint: `/ws`
- Application destination prefix: `/app`
- User queue destination: `/user/queue/events`
- Room broadcast topic: `/topic/room.{roomCode}`

### Message Flow

Frontend send actions to server:

- `/app/room.create`
- `/app/room.join`
- `/app/auction.start`
- `/app/auction.bid`
- `/app/auction.pass`
- `/app/auction.results`
- `/app/room.leave`
- `/app/room.state`

Backend replies with event envelopes using `WsEventType`.

### Error Handling

- `AuctionWebSocketController` catches exceptions and forwards an `ERROR` envelope to the requesting user.

## Frontend Design

### Core Responsibilities

- Provide room creation and join UX
- Render auction room state in real time
- Send user actions to the backend via STOMP
- Manage client-side auction state with Redux

### Key Components

- `App.jsx` - route definitions
- `Home.jsx` - lobby and room entry UI
- `AuctionRoom.jsx` - live auction interface
- `Results.jsx` - final leaderboard screen
- `useWebSocket.js` - websocket connection and STOMP event handling
- `auctionSlice.js` - Redux slice for auction state
- `websocket.js` - STOMP + SockJS adapter

### State Management

Redux holds:

- connection state (`connected`, `connecting`)
- room metadata (`roomCode`, `status`, `teams`)
- current auction values (`currentPlayer`, `currentBid`, `timer`)
- history and results (`bidHistory`, `leaderboard`, `soldPlayers`)

### UI Behavior

- Host can start auction and force results
- Teams can bid or pass
- Auction progress and bid history update in real time
- After auction end, users are redirected to results

## Data Flow

1. Client connects to backend WebSocket `/ws`
2. Client sends `/app/room.create` or `/app/room.join`
3. Backend responds with either `ROOM_CREATED` or `ROOM_STATE`
4. Client subscribes to `/topic/room.{roomCode}`
5. Auction events are broadcast to all room subscribers
6. Client UI updates based on event type

## Deployment Notes

### Backend

- Runs on port `8086`
- MySQL database configured in `Backend/src/main/resources/application.properties`
- CORS origin set to frontend dev server `http://localhost:5173`

### Frontend

- Default dev URL: `http://localhost:5173`
- WebSocket base URL can be overridden with `VITE_WS_BASE_URL`

## Extensibility

Future enhancements may include:

- persistent player/team accounts
- full player draft pool editor
- auction timer synchronization improvements
- more auction modes and bidding rules
- improved mobile / responsive UI

## Conclusion

This system is designed for real-time auction interaction with a clean separation between WebSocket-driven backend state and frontend rendering. The backend handles auction rules, while the frontend focuses on responsive user interaction and live updates.
