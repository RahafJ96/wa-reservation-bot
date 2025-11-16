# 🍽️ Restaurant Reservation Bot

A Node.js + TypeScript chatbot system for managing restaurant reservations.
The bot can create, modify, and cancel reservations through a conversational interface, powered by a Natural Language Understanding engine (Gemini API).

This project demonstrates backend design, API structure, conversational logic, validation, and clean architecture.

## 🚀 Features

### 🤖 Chatbot Features

- Detects user requests:
  - New reservation
  - Modify reservation
  - Cancel reservation
  - Confirm reservation

- Extracts structured data (date, time, guests, name)

- Understands user messages using Gemini AI

- Handles multi-step conversations with memory (conversationId)

- Validates user input with clear error messages

- Supports multiple sessions simultaneously

### 📦 API Features

- Fully functional REST API for reservations
- **CRUD** operations via:

  - `POST /api/reservations`
  - `GET /api/reservations/:id`
  - `PUT /api/reservations/:id`
  - `DELETE /api/reservations/:id`

- Input validation (date, time, guests, status)
- Error handling with proper HTTP status codes

## 🏗️ Architecture Overview

```graphql
.
├── public/
│   └── index.html                   # User interface
│
├── src/
│   │
│   ├── api/
│   │   ├── reservationRoutes.ts     # REST API for reservation CRUD (/api/reservations)
│   │   ├── chatRoutes.ts            # Chat endpoint (POST /api/chat)
│   │   ├── validation.ts            # Validation for user input (24-hour time, YYYY-MM-DD date, guests)
│   │   └── reservationStore.ts      # In-memory reservation “database”
│   │
│   ├── bot/
│   │   └── conversationManager.ts   # Conversation flow integration
│   │
│   ├── helper/
│   │   ├── gemini-start.ts          # Gemini module
│   │   └── gemini-test.ts           # Manual test script
│   │
│   ├── types/
│   │   └── reservations.ts          # Reservation type definitions
│   │
│   └── server.ts                    # Application entry point

```

## 🧪 Running the Project

1. Install dependencies

```bash
npm install
```

2. Create .env
   If using Gemini:

```bash
PORT=3000
GEMINI_API_KEY=YOUR_KEY_HERE
```

3. Start dev server

```bash
npm run dev
```

Server runs at:

```bash
http://localhost:3000
```

Health check:

```bash
GET /health
API running on http://localhost:3000 ✅
```

## 📌 Reservation API Endpoints

### Create a reservation

```bash
POST /api/reservations
```

Body:

```json
{
  "name": "Rahaf",
  "date": "2025-11-20",
  "time": "20:00",
  "guests": 2
}
```

Output:

```json
{
  "id": "res_2025_h43o56o7",
  "name": "Rahaf",
  "date": "2025-11-20",
  "time": "20:00",
  "guests": 2,
  "status": "Confirmed",
  "createdAt": "2025-11-15T10:50:25.765Z",
  "updatedAt": "2025-11-15T10:50:25.765Z"
}
```

### Get one reservation

```bash
GET /api/reservations/:id
```

Output:

```json
{
  "id": "res_2025_h43o56o7",
  "name": "Rahaf",
  "date": "2025-11-22",
  "time": "21:00",
  "guests": 5,
  "status": "Confirmed",
  "createdAt": "2025-11-15T10:50:25.765Z",
  "updatedAt": "2025-11-15T10:51:52.299Z"
}
```

### Modify reservation

```bash
PUT /api/reservations/:id
```

Body:

```json
{
  "name": "Rahaf",
  "date": "2025-11-22",
  "time": "21:00",
  "guests": 5
}
```

Output:

```json
{
  "id": "res_2025_h43o56o7",
  "name": "Rahaf",
  "date": "2025-11-22",
  "time": "21:00",
  "guests": 5,
  "status": "Confirmed",
  "createdAt": "2025-11-15T10:50:25.765Z",
  "updatedAt": "2025-11-15T10:51:52.299Z"
}
```

### Cancel reservation

```bash
DELETE /api/reservations/:id
```

Output:

```json
{
  "message": "Reservation cancelled",
  "reservation": {
    "id": "res_2025_h43o56o7",
    "name": "Rahaf",
    "date": "2025-11-22",
    "time": "21:00",
    "guests": 5,
    "status": "Cancelled",
    "createdAt": "2025-11-15T10:50:25.765Z",
    "updatedAt": "2025-11-15T10:53:02.217Z"
  }
}
```

## 🤖🧪 Testing the Chatbot API

### Testing with Postman - `api/chat`

```bash
POST /api/reservations/api/chat
```

Body:

```json
{
  "conversationId": "test-ai",
  "message": " I want to book a table tomorrow at 2pm for 5 people under the name Rahaf"
}
```

**Output:**

```json
{
  "conversationId": "test-ai",
  "reply": "Please confirm your reservation:
  - Name: Rahaf
  - Date: 2025-11-17
  - Time: 14:00
  - Guests: 5
  Reply 'yes' to confirm or 'no' to cancel."
}
```

**After the Confirmation:**

```json
{
  "conversationId": "test-ai",
  "reply": "✅ Your reservation is confirmed! Reservation ID: res_2025_66b6c4p6 - Name: Rahaf - Date: 2025-11-17 - Time: 14:00 - Guests: 5 What would you like to do next?"
}
```

---

**📌 To run the script:**

```bash
npm run test:gemini
```

**Output:**

User message:

```css
I want to book a table after two days from today at 4pm for 2 people under the name Rahaf
```

Helper result from Gemini:

```json
{
  "intent": "new_reservation",
  "date": "2025-11-18",
  "time": "16:00",
  "guests": 2,
  "name": "Rahaf",
  "notes": "User wants to book a new reservation for two days from today at 4 PM for 2 people under the name Rahaf."
}
```

## 🛠️ Tech Stack

- **Node.js + Express**

- **TypeScript**

- **Gemini AI API**

- **dotenv** for environment configuration
