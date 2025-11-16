import { Reservation, ReservationStatus } from '../types/reservation-types';

const reservations = new Map<string, Reservation>();

// Generate a unique id
function generateId(): string {
  return `res_${new Date().getFullYear()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// Create a new reservation
export function createReservation(input: {
  name: string;
  date: string;
  time: string;
  guests: number;
}): Reservation {
  const id = generateId();
  const now = new Date().toISOString();

  const reservation: Reservation = {
    id,
    name: input.name,
    date: input.date,
    time: input.time,
    guests: input.guests,
    status: ReservationStatus.CONFIRMED,
    createdAt: now,
    updatedAt: now,
  };

  reservations.set(id, reservation);
  return reservation;
}

// Get a reservation by ID
export function getReservation(id: string): Reservation | undefined {
  return reservations.get(id);
}

// Update a reservation
export function updateReservation(
  id: string,
  updates: Partial<
    Pick<Reservation, 'name' | 'date' | 'time' | 'guests' | 'status'>
  >
): Reservation | null {
  const existing = reservations.get(id);
  if (!existing) return null;

  const updated: Reservation = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  reservations.set(id, updated);
  return updated;
}

// Cancel a reservation
export function cancelReservation(id: string): Reservation | null {
  const existing = reservations.get(id);
  if (!existing) return null;

  const updated: Reservation = {
    ...existing,
    status: ReservationStatus.CANCELLED,
    updatedAt: new Date().toISOString(),
  };

  reservations.set(id, updated);

  // We can just delete it from the Map using only this line:
  // return reservations.delete(id);

  return updated;
}
// List all reservations
export function listReservations(): Reservation[] {
  return Array.from(reservations.values());
}
