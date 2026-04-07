# IPL Auction System

A full-stack IPL auction web application with a Spring Boot backend and a React + Vite frontend.

## Overview

This project simulates a live auction room where teams can join, bid on players, pass, and view results in real-time. The backend uses WebSocket STOMP messaging to synchronize state across clients.

## Technology Stack

- Backend
  - Java 17
  - Spring Boot 3
  - Spring WebSocket + STOMP
  - Spring Data JPA
  - MySQL
  - Lombok
- Frontend
  - React 18
  - Vite
  - React Router DOM
  - Redux Toolkit
  - STOMP over SockJS
  - Tailwind CSS
  - Framer Motion

## Repository Structure

- `Backend/` - Spring Boot application
  - `src/main/java/com/iplauction/` - application code
  - `src/main/resources/application.properties` - runtime configuration
  - `pom.xml` - Maven dependencies
- `frontend/` - React application
  - `src/` - UI and state management
  - `package.json` - frontend dependencies
  - `index.html` - entry page

## Running Locally

### Backend

1. Ensure MySQL is running.
2. Create a database named `ipl_auction`.
3. Update `Backend/src/main/resources/application.properties` if needed.
4. From the root folder:
   ```powershell
   cd Backend
   .\mvnw.cmd spring-boot:run
   ```

The backend listens on `http://localhost:8086` and exposes the WebSocket endpoint at `/ws`.

### Frontend

1. From the root folder:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Open the local Vite URL shown in the terminal (default `http://localhost:5173`).

If the backend is hosted elsewhere, set the WebSocket base URL:

```powershell
$env:VITE_WS_BASE_URL = 'http://your-backend-host:8086'
npm run dev
```

## Application Flow

- A user creates or joins an auction room.
- The backend maintains room state, team state, auction progress, and player sale outcomes.
- Clients receive direct updates on `/user/queue/events` and room broadcasts on `/topic/room.{roomCode}`.
- The host can start the auction or force results.

## Notes

- Default backend MySQL connection:
  - URL: `jdbc:mysql://localhost:3306/ipl_auction`
  - User: `root`
  - Password: `9949`
- CORS is configured for `http://localhost:5173`.
- The frontend stores selected team state locally for reconnection.

## Useful Commands

- Backend build: `cd Backend && .\mvnw.cmd clean package`
- Frontend build: `cd frontend && npm run build`
