import {
  WORK_DAY_START_MINUTES,
  WORK_DAY_END_MINUTES,
  MIN_BOOKING_DURATION_MINUTES,
  MAX_BOOKING_DURATION_MINUTES,
  TIME_STEP_MINUTES,
  MAX_TITLE_LENGTH,
} from '../model/constants';
import type { Booking, BookingValidationResult } from '../model/types';
import {
  formatDateToISO,
  isPastDate,
  isTodayDate,
  isSlotAvailableForToday,
  timeToMinutes,
  findConflictingBooking,
} from './time-engine';

export interface ValidateBookingParams {
  booking: {
    date: string;
    start: string;
    end: string;
    title?: string;
  };
  existingBookings: Booking[];
  excludeBookingId?: string;
  originalBooking?: Booking;
  now?: Date;
  todayStr?: string;
}

/**
 * Pure domain validator executing all business rules.
 * Used on both client-side and server-side (MSW).
 */
export function validateBookingRules({
  booking,
  existingBookings,
  excludeBookingId,
  originalBooking,
  now = new Date(),
  todayStr = formatDateToISO(now),
}: ValidateBookingParams): BookingValidationResult {
  const { date, start, end, title } = booking;

  // 1. Title length check
  if (title && title.trim().length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Название бронирования не должно превышать ${MAX_TITLE_LENGTH} символов`,
      field: 'title',
    };
  }

  // 2. Date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      valid: false,
      error: 'Неверный формат даты (ожидается YYYY-MM-DD)',
      field: 'date',
    };
  }

  // 3. Rule 6: Past date check
  if (isPastDate(date, todayStr)) {
    return {
      valid: false,
      error: 'Нельзя создавать бронирования на прошедшие даты',
      field: 'date',
    };
  }

  // 4. Time format
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) {
    return {
      valid: false,
      error: 'Неверный формат времени (ожидается HH:mm)',
      field: 'start',
    };
  }

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  // 5. 15-minute step check
  if (startMin % TIME_STEP_MINUTES !== 0) {
    return {
      valid: false,
      error: 'Время начала должно быть с шагом 15 минут (00, 15, 30, 45)',
      field: 'start',
    };
  }
  if (endMin % TIME_STEP_MINUTES !== 0) {
    return {
      valid: false,
      error: 'Время окончания должно быть с шагом 15 минут (00, 15, 30, 45)',
      field: 'end',
    };
  }

  // 6. Rule 1: Working hours check (09:00 - 18:00)
  if (startMin < WORK_DAY_START_MINUTES || startMin > WORK_DAY_END_MINUTES) {
    return {
      valid: false,
      error: 'Время начала должно быть в пределах рабочего дня (09:00–18:00)',
      field: 'start',
    };
  }
  if (endMin < WORK_DAY_START_MINUTES || endMin > WORK_DAY_END_MINUTES) {
    return {
      valid: false,
      error: 'Время окончания должно быть в пределах рабочего дня (09:00–18:00)',
      field: 'end',
    };
  }

  // 7. Rule 2: start < end
  if (startMin >= endMin) {
    return {
      valid: false,
      error: 'Время начала должно быть строго раньше времени окончания',
      field: 'end',
    };
  }

  const durationMin = endMin - startMin;

  // 8. Rule 3: Minimum duration 30 minutes
  if (durationMin < MIN_BOOKING_DURATION_MINUTES) {
    return {
      valid: false,
      error: `Минимальная длительность бронирования — ${MIN_BOOKING_DURATION_MINUTES} минут`,
      field: 'end',
    };
  }

  // 9. Rule 4: Maximum duration 2 hours (120 minutes)
  if (durationMin > MAX_BOOKING_DURATION_MINUTES) {
    return {
      valid: false,
      error: `Максимальная длительность бронирования — ${MAX_BOOKING_DURATION_MINUTES / 60} часа`,
      field: 'end',
    };
  }

  // If editing an existing booking and start time is unchanged, allow keeping the original start time
  // even if that slot has already started/passed today.
  const original =
    originalBooking ||
    (excludeBookingId ? existingBookings.find((b) => b.id === excludeBookingId) : undefined);
  const isSameStartAsBefore = Boolean(
    original && original.date === date && original.start === start
  );

  // 10. Rule 6: Current day 2-minute buffer rule
  if (isTodayDate(date, todayStr) && !isSameStartAsBefore) {
    if (!isSlotAvailableForToday(start, now)) {
      return {
        valid: false,
        error: 'Нельзя забронировать прошедший слот (бронирование возможно не менее чем за 2 минуты до начала)',
        field: 'start',
      };
    }
  }

  // 11. Rules 5 & 7: Check overlap with existing bookings (excluding edited booking)
  const conflict = findConflictingBooking({ start, end }, existingBookings, excludeBookingId);
  if (conflict) {
    return {
      valid: false,
      error: `Выбранное время пересекается с существующим бронированием (${conflict.start}–${conflict.end}${conflict.title ? `: ${conflict.title}` : ''})`,
      field: 'start',
    };
  }

  return { valid: true };
}
