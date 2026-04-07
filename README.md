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

Screen Shots:
<img width="950" height="736" alt="Screenshot 2026-04-06 170235" src="https://github.com/user-attachments/assets/600920ba-b185-41dd-8ff6-951955954f42" />
<img width="668" height="725" alt="Screenshot 2026-04-06 170248" src="https://github.com/user-attachments/assets/19a6969d-fa1f-4b9a-98f5-c574676cae36" />
<img width="1075" height="600" alt="Screenshot 2026-04-06 170255" src="https://github.com/user-attachments/assets/d9ba5aa3-3b36-4226-b61f-a87f4d909c26" />
<img width="1122" height="820" alt="Screenshot 2026-04-06 172457" src="https://github.com/user-attachments/assets/a1dc6a36-f3ee-4989-a1a9-ed256191bdd8" />
<img width="1078" height="801" alt="Screenshot 2026-04-06 172513" src="https://github.com/user-attachments/assets/79a60870-d344-46b3-8946-a66ca82633ab" />
<img width="1420" height="450" alt="Screenshot 2026-04-06 190515" src="https://github.com/user-attachments/assets/36f90bb2-ca21-40f3-8533-872dece42816" />




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
