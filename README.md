# 🍽️ Restaurant Reservation Bot

## 🚀 Features

### 📦 API Features

- Fully functional REST API for reservations
- CRUD operations via:

  - `POST /api/reservations`
  - `GET /api/reservations/:id`
  - `PUT /api/reservations/:id`
  - `DELETE /api/reservations/:id`

- Input validation (date, time, guests, status)
- Error handling with proper HTTP status codes

## 🏗️ Architecture Overview

```graphql
src/
│
├── api/
│   ├── reservationRoutes.ts      # REST API for reservation CRUD (/api/reservations)
│   ├── validation.ts             # Validation for user input (time-24h, date-type-YYYY-MM-DD, guests)
│   └── reservationStore.ts       # In-memory reservation “database”
│
├── bot/
│
├── helper/
│
├── types/
│   └── reservations.ts           # Types of the reservations params
│
└── server.ts                      # Applcation entry point

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
