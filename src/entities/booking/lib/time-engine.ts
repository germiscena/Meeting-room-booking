import {
  WORK_DAY_START_MINUTES,
  WORK_DAY_END_MINUTES,
  TIME_STEP_MINUTES,
  TODAY_BUFFER_SECONDS,
  MIN_BOOKING_DURATION_MINUTES,
  MAX_BOOKING_DURATION_MINUTES,
} from '../model/constants';
import type { Booking } from '../model/types';

/**
 * Converts 'HH:mm' string to total minutes from midnight (00:00).
 * Example: '09:30' -> 570
 */
export function timeToMinutes(time: string): number {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to 'HH:mm' string.
 * Example: 570 -> '09:30'
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Converts 'HH:mm' string to total seconds from midnight.
 */
export function timeToSeconds(time: string): number {
  return timeToMinutes(time) * 60;
}

/**
 * Returns seconds from midnight for a given Date in local time.
 */
export function dateToSecondsFromMidnight(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/**
 * Formats a Date object to 'YYYY-MM-DD' calendar string in local time.
 * Avoids UTC timezone day shifting.
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether a given calendar date (YYYY-MM-DD) is in the past
 * relative to reference date (YYYY-MM-DD).
 */
export function isPastDate(dateStr: string, referenceDateStr: string): boolean {
  return dateStr < referenceDateStr;
}

/**
 * Checks whether a given calendar date is today.
 */
export function isTodayDate(dateStr: string, referenceDateStr: string): boolean {
  return dateStr === referenceDateStr;
}

/**
 * Checks whether two time intervals overlap.
 * Intervals are treated as half-open [start, end).
 * Boundary touching (e.g. 10:00-11:00 and 11:00-12:00) is NOT considered an overlap.
 */
export function hasTimeOverlap(
  intervalA: { start: string; end: string },
  intervalB: { start: string; end: string }
): boolean {
  const startA = timeToMinutes(intervalA.start);
  const endA = timeToMinutes(intervalA.end);
  const startB = timeToMinutes(intervalB.start);
  const endB = timeToMinutes(intervalB.end);

  return startA < endB && endA > startB;
}

/**
 * Finds the first conflicting booking from the list, optionally excluding
 * a booking by ID (used when editing a booking).
 */
export function findConflictingBooking(
  interval: { start: string; end: string },
  existingBookings: Booking[],
  excludeBookingId?: string
): Booking | null {
  for (const booking of existingBookings) {
    if (excludeBookingId && booking.id === excludeBookingId) {
      continue;
    }
    if (hasTimeOverlap(interval, booking)) {
      return booking;
    }
  }
  return null;
}

/**
 * Checks if a slot on today's date is available according to the 2-minute buffer rule.
 * Slot is available only if slotStart - now >= TODAY_BUFFER_SECONDS (120 seconds).
 */
export function isSlotAvailableForToday(slotTime: string, now: Date): boolean {
  const slotSeconds = timeToSeconds(slotTime);
  const nowSeconds = dateToSecondsFromMidnight(now);
  return slotSeconds - nowSeconds >= TODAY_BUFFER_SECONDS;
}

/**
 * Generates an array of time strings with a given step.
 * Default: 09:00 to 18:00 with 15-minute step.
 */
export function generateTimeSlots(
  startMinutes: number = WORK_DAY_START_MINUTES,
  endMinutes: number = WORK_DAY_END_MINUTES,
  stepMinutes: number = TIME_STEP_MINUTES
): string[] {
  const slots: string[] = [];
  for (let mins = startMinutes; mins <= endMinutes; mins += stepMinutes) {
    slots.push(minutesToTime(mins));
  }
  return slots;
}

/**
 * Returns available start times for a booking on a given date.
 * Excludes occupied slots and slots that cannot form any valid non-overlapping interval (e.g. 15 min before a booking).
 */
export function getAvailableStartTimes({
  date,
  todayStr,
  now = new Date(),
  stepMinutes = TIME_STEP_MINUTES,
  existingBookings = [],
  excludeBookingId,
}: {
  date: string;
  todayStr: string;
  now?: Date;
  stepMinutes?: number;
  existingBookings?: Booking[];
  excludeBookingId?: string;
}): string[] {
  if (isPastDate(date, todayStr)) {
    return [];
  }

  // Max start time is 18:00 - 30 minutes = 17:30
  const maxStartMinutes = WORK_DAY_END_MINUTES - MIN_BOOKING_DURATION_MINUTES;
  const allSlots = generateTimeSlots(WORK_DAY_START_MINUTES, maxStartMinutes, stepMinutes);

  return allSlots.filter((slot) => {
    // 1. If today, check 2-minute buffer rule
    if (isTodayDate(date, todayStr) && !isSlotAvailableForToday(slot, now)) {
      return false;
    }

    // 2. If there are existing bookings, check that at least one valid end time is possible
    if (existingBookings.length > 0) {
      const validEnds = getValidEndTimes({
        startTime: slot,
        existingBookings,
        excludeBookingId,
        stepMinutes,
      });
      return validEnds.length > 0;
    }

    return true;
  });
}

/**
 * Returns valid end times for a chosen start time.
 * Takes into account:
 * - Minimum duration (30 min)
 * - Maximum duration (120 min)
 * - End of workday (18:00)
 * - Next conflicting booking start (cannot book through another booking)
 * - Excludes times if start time is already inside an existing booking
 */
export function getValidEndTimes({
  startTime,
  existingBookings,
  excludeBookingId,
  stepMinutes = TIME_STEP_MINUTES,
}: {
  startTime: string;
  existingBookings: Booking[];
  excludeBookingId?: string;
  stepMinutes?: number;
}): string[] {
  const startMin = timeToMinutes(startTime);
  const minEndMin = startMin + MIN_BOOKING_DURATION_MINUTES;
  const maxAllowedByDuration = startMin + MAX_BOOKING_DURATION_MINUTES;
  const maxEndMin = Math.min(WORK_DAY_END_MINUTES, maxAllowedByDuration);

  if (minEndMin > WORK_DAY_END_MINUTES) {
    return [];
  }

  // Check if startTime is inside an existing booking interval [b.start, b.end)
  const isStartTimeOccupied = existingBookings.some((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const bStart = timeToMinutes(b.start);
    const bEnd = timeToMinutes(b.end);
    return startMin >= bStart && startMin < bEnd;
  });
  if (isStartTimeOccupied) {
    return [];
  }

  // Find the earliest booking starting at or after startTime (excluding current booking)
  let earliestBlockingStart = WORK_DAY_END_MINUTES;
  for (const b of existingBookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    const bStartMin = timeToMinutes(b.start);
    if (bStartMin >= startMin && bStartMin < earliestBlockingStart) {
      earliestBlockingStart = bStartMin;
    }
  }

  const effectiveMaxEnd = Math.min(maxEndMin, earliestBlockingStart);
  if (minEndMin > effectiveMaxEnd) {
    return [];
  }

  const result: string[] = [];
  for (let m = minEndMin; m <= effectiveMaxEnd; m += stepMinutes) {
    result.push(minutesToTime(m));
  }
  return result;
}

/**
 * Determines if a 15-minute slot is blocked/unusable on the timeline.
 * An unbooked slot [slotMin, slotMin + 15) is blocked if:
 * 1. Preceding an existing booking [B.start - 15m, B.start) AND the slot 30m before
 *    [B.start - 30m, B.start - 15m) is unavailable (occupied or before 09:00).
 *    (This also covers 09:00–09:15 when a booking starts at 09:15).
 * 2. At workday boundary: 17:45–18:00 when an existing booking ends at 17:45.
 */
export function isSlotBlockedOnTimeline(
  slotTime: string,
  existingBookings: Booking[]
): boolean {
  const slotMin = timeToMinutes(slotTime);

  // If slot is already inside an existing booking, it is not an unbooked gap (it's occupied)
  const isOccupied = existingBookings.some((b) => {
    const bStart = timeToMinutes(b.start);
    const bEnd = timeToMinutes(b.end);
    return slotMin >= bStart && slotMin < bEnd;
  });
  if (isOccupied) {
    return false;
  }

  // Workday boundary check: 17:45–18:00 if a session ends at 17:45
  if (slotMin === WORK_DAY_END_MINUTES - TIME_STEP_MINUTES) {
    const hasBookingEndingAt1745 = existingBookings.some(
      (b) => timeToMinutes(b.end) === WORK_DAY_END_MINUTES - TIME_STEP_MINUTES
    );
    if (hasBookingEndingAt1745) {
      return true;
    }
  }

  // Preceding existing booking check:
  // Is there a booking starting 15 minutes after this slot?
  const nextSlotMin = slotMin + TIME_STEP_MINUTES;
  const nextTime = minutesToTime(nextSlotMin);
  const hasBookingStartingAtNext = existingBookings.some((b) => b.start === nextTime);

  if (hasBookingStartingAtNext) {
    const prevSlotMin = slotMin - TIME_STEP_MINUTES;
    // Slot 30 min before booking start is [prevSlotMin, slotMin)
    // Unavailable if before workday start (09:00)
    if (prevSlotMin < WORK_DAY_START_MINUTES) {
      return true;
    }
    // Or unavailable if occupied by an existing booking
    const isPrevOccupied = existingBookings.some((b) => {
      const bStart = timeToMinutes(b.start);
      const bEnd = timeToMinutes(b.end);
      return prevSlotMin >= bStart && prevSlotMin < bEnd;
    });
    if (isPrevOccupied) {
      return true;
    }
  }

  return false;
}

