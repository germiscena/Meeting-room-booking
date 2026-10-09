import { formatDateToISO } from '@/entities/booking';

export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

/**
 * Returns a human-friendly string for the calendar date.
 * Example: "8 октября 2026 г., четверг"
 */
export function formatDateToHuman(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Shifts YYYY-MM-DD string by a given number of days.
 */
export function shiftDateDays(dateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}
