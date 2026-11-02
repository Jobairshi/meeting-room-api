const express = require('express')

const app = express()
app.use(express.json())

let bookings = []
let nextId = 1

app.get('/bookings', (req, res) => {
  res.json(bookings)
})

app.post('/bookings', (req, res) => {
  const { room, start, end, bookedBy } = req.body || {}

  if (!room || !start || !end || !bookedBy) {
    return res.status(400).json({ error: 'room, start, end and bookedBy are required' })
  }

  const startTime = new Date(start)
  const endTime = new Date(end)

  if (isNaN(startTime) || isNaN(endTime)) {
    return res.status(400).json({ error: 'start and end must be valid dates' })
  }

  if (endTime <= startTime) {
    return res.status(400).json({ error: 'end must be after start' })
  }

  // Two ranges overlap when each one starts before the other ends.
  // Back-to-back (10:00-11:00 then 11:00-12:00) is allowed.
  const clash = bookings.find(
    (b) => b.room === room && startTime < new Date(b.end) && new Date(b.start) < endTime
  )

  if (clash) {
    return res.status(409).json({ error: 'room already booked', clash })
  }

  const booking = { id: nextId++, room, start, end, bookedBy }
  bookings.push(booking)
  res.status(201).json(booking)
})

app.delete('/bookings/:id', (req, res) => {
  const id = Number(req.params.id)
  const booking = bookings.find((b) => b.id === id)

  if (!booking) {
    return res.status(404).json({ error: 'booking not found' })
  }

  bookings = bookings.filter((b) => b.id !== id)
  res.json({ message: 'booking cancelled', booking })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
