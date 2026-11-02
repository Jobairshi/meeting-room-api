# Meeting Room Booking API

A small Express API for booking meeting rooms. A booking is refused when the same room is already booked at an overlapping time.

Bookings are kept in memory, so they are lost when the server stops.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (check with `node -v`)
- [Postman](https://www.postman.com/downloads/), only if you want to run the test requests

## Setup and run

```bash
git clone https://github.com/Jobairshi/meeting-room-api.git
cd meeting-room-api
npm install
node index.js
```

You should see:

```
Server running on http://localhost:3000
```

Stop the server with `Ctrl + C`.

## Endpoints

| Method | URL | What it does | Responses |
|---|---|---|---|
| `GET` | `/bookings` | List all bookings | 200 |
| `POST` | `/bookings` | Book a room | 201 booked, 400 bad input, 409 room already booked |
| `DELETE` | `/bookings/:id` | Cancel a booking | 200 cancelled, 404 not found |

### Book a room

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{"room":"Room A","start":"2026-11-02T10:00","end":"2026-11-02T11:00","bookedBy":"Jobair"}'
```

Response (201):

```json
{ "id": 1, "room": "Room A", "start": "2026-11-02T10:00", "end": "2026-11-02T11:00", "bookedBy": "Jobair" }
```

### List bookings

```bash
curl http://localhost:3000/bookings
```

### Cancel a booking

```bash
curl -X DELETE http://localhost:3000/bookings/1
```

## Rules

- **Required fields:** `room`, `start`, `end` and `bookedBy`. A missing field returns 400.
- **Dates:** `start` and `end` must be valid dates, and `end` must be after `start`. Otherwise the API returns 400.
- **Overlap:** two bookings for the same room clash when `newStart < existingEnd` and `existingStart < newEnd`. A clash returns 409.
- **Back-to-back bookings are allowed.** A 10:00–11:00 booking does not block 11:00–12:00, because the room is free once the first meeting ends.
- **Cancel deletes the booking**, so the time slot can be booked again.

## Test with Postman

1. Start the server with `node index.js`.
2. In Postman, click **Import** and select `meeting-room-api.postman_collection.json`.
3. Run requests 1 to 10 **in order**. Each request name shows the expected result:

| # | Request | Expected |
|---|---|---|
| 1 | Room A 10:00–11:00 | 201 |
| 2 | Room A 10:30–11:30 | 409 overlap |
| 3 | Room B 10:30–11:30 | 201 different room |
| 4 | Room A 11:00–10:00 | 400 end before start |
| 5 | Missing `room` | 400 |
| 6 | Room A 11:00–12:00 | 201 back-to-back |
| 7 | Cancel booking 1 | 200 |
| 8 | Room A 10:00–11:00 again | 201 |
| 9 | Cancel booking 999 | 404 |
| 10 | Get all bookings | 200 |

The order matters, because request 7 cancels booking 1 and request 8 books that slot again. If you restart the server, run the requests again starting from request 1.
