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

Base URL: `http://localhost:3000`

| Method | URL | What it does | Responses |
|---|---|---|---|
| `POST` | `/bookings` | Book a room | 201, 400, 409 |
| `GET` | `/bookings` | List all bookings | 200 |
| `DELETE` | `/bookings/:id` | Cancel a booking | 200, 404 |

## How to use each API

### 1. Book a room: `POST /bookings`

Send a JSON body with these fields:

| Field | Type | Required | Example | Notes |
|---|---|---|---|---|
| `room` | string | yes | `"Room A"` | Room names are case-sensitive: `"Room A"` and `"room a"` count as different rooms |
| `start` | string (date) | yes | `"2026-11-02T10:00"` | Use the format `YYYY-MM-DDTHH:mm` |
| `end` | string (date) | yes | `"2026-11-02T11:00"` | Must be after `start` |
| `bookedBy` | string | yes | `"Jobair"` | Name of the person booking |

**curl:**

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{"room":"Room A","start":"2026-11-02T10:00","end":"2026-11-02T11:00","bookedBy":"Jobair"}'
```

**Postman:** method `POST`, URL `http://localhost:3000/bookings`. Under **Body**, choose **raw** and set the type to **JSON**, then paste:

```json
{
  "room": "Room A",
  "start": "2026-11-02T10:00",
  "end": "2026-11-02T11:00",
  "bookedBy": "Jobair"
}
```

**Responses:**

`201 Created`: the room is booked. The response contains the new booking and its `id`. Keep the `id`, because you need it to cancel.

```json
{ "id": 1, "room": "Room A", "start": "2026-11-02T10:00", "end": "2026-11-02T11:00", "bookedBy": "Jobair" }
```

`400 Bad Request`: a field is missing.

```json
{ "error": "room, start, end and bookedBy are required" }
```

`400 Bad Request`: `start` or `end` is not a real date (for example `"tomorrow"`).

```json
{ "error": "start and end must be valid dates" }
```

`400 Bad Request`: `end` is the same as or before `start`.

```json
{ "error": "end must be after start" }
```

`409 Conflict`: the room already has a booking that overlaps this time. `clash` shows the existing booking that is in the way.

```json
{
  "error": "room already booked",
  "clash": { "id": 1, "room": "Room A", "start": "2026-11-02T10:00", "end": "2026-11-02T11:00", "bookedBy": "Jobair" }
}
```

### 2. List all bookings: `GET /bookings`

No body or parameters.

**curl:**

```bash
curl http://localhost:3000/bookings
```

**Postman:** method `GET`, URL `http://localhost:3000/bookings`.

**Response:**

`200 OK`: an array of all bookings, in the order they were made. It is `[]` when there are none.

```json
[
  { "id": 1, "room": "Room A", "start": "2026-11-02T10:00", "end": "2026-11-02T11:00", "bookedBy": "Jobair" },
  { "id": 2, "room": "Room B", "start": "2026-11-02T10:30", "end": "2026-11-02T11:30", "bookedBy": "Sara" }
]
```

### 3. Cancel a booking: `DELETE /bookings/:id`

Put the booking's `id` in the URL. The `id` comes from the `POST` response or from `GET /bookings`.

**curl:**

```bash
curl -X DELETE http://localhost:3000/bookings/1
```

**Postman:** method `DELETE`, URL `http://localhost:3000/bookings/1`.

**Responses:**

`200 OK`: the booking is deleted, and its time slot is free to book again.

```json
{
  "message": "booking cancelled",
  "booking": { "id": 1, "room": "Room A", "start": "2026-11-02T10:00", "end": "2026-11-02T11:00", "bookedBy": "Jobair" }
}
```

`404 Not Found`: no booking has that `id`, or it was already cancelled.

```json
{ "error": "booking not found" }
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
