import { Router } from 'express';
import {
  createReservation,
  getReservation,
  updateReservation,
  cancelReservation,
  listReservations,
} from './reservationStore';
import { isValidDate, isValidTime, isValidGuests } from './validation';

const router = Router();

// Create a new Reservation
router.post('/', (req, res) => {
  const { name, date, time, guests } = req.body;

  if (!name || !date || !time || guests == null) {
    return res.status(400).json({
      error: 'Missing required fields: name, date, time, guests',
    });
  }

  if (!isValidDate(date)) {
    return res
      .status(400)
      .json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (!isValidTime(time)) {
    return res
      .status(400)
      .json({ error: 'Invalid time format. Use HH:MM 24h' });
  }

  if (!isValidGuests(Number(guests))) {
    return res.status(400).json({ error: 'Guests must be between 1 and 20' });
  }

  const reservation = createReservation({
    name,
    date,
    time,
    guests: Number(guests),
  });

  res.status(201).json(reservation);
});

// List all Reservations
router.get('/', (_req, res) => {
  res.json(listReservations());
});

// Get Reservation by id
router.get('/:id', (req, res) => {
  const reservation = getReservation(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json(reservation);
});

// Update Reservation
router.put('/:id', (req, res) => {
  const { name, date, time, guests, status } = req.body;

  const updates: any = {};

  if (name !== undefined) updates.name = name;
  if (date !== undefined) {
    if (!isValidDate(date)) {
      return res
        .status(400)
        .json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    updates.date = date;
  }

  if (time !== undefined) {
    if (!isValidTime(time)) {
      return res
        .status(400)
        .json({ error: 'Invalid time format. Use HH:MM 24h' });
    }
    updates.time = time;
  }

  if (guests !== undefined) {
    if (!isValidGuests(Number(guests))) {
      return res.status(400).json({ error: 'Guests must be between 1 and 20' });
    }
    updates.guests = Number(guests);
  }

  if (status !== undefined) {
    if (status !== 'confirmed' && status !== 'cancelled') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    updates.status = status;
  }

  const updated = updateReservation(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  res.json(updated);
});

// Cancel Reservation
router.delete('/:id', (req, res) => {
  const updated = cancelReservation(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  res.json({
    message: 'Reservation cancelled',
    reservation: updated,
  });
});

export default router;
