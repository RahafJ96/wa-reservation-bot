export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isValidTime(timeStr: string): boolean {
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return regex.test(timeStr);
}

export function isValidGuests(guests: number): boolean {
  return Number.isInteger(guests) && guests > 0 && guests <= 20;
}
