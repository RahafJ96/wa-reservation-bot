export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date >= today;
}

export function isValidTime(timeStr: string): boolean {
  const value = timeStr.trim();

  // 24-hour format
  const regex24 = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (regex24.test(value)) return true;

  // 12-hour format AM / PM
  const regex12 = /^(0?[1-9]|1[0-2])(?::([0-5]\d))?\s?(am|pm)$/i;
  return regex12.test(value);
}

export function isValidGuests(guests: number): boolean {
  return Number.isInteger(guests) && guests > 0 && guests <= 20;
}
