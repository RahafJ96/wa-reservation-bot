export enum ReservationStatus {
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
}
export interface Reservation {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}
