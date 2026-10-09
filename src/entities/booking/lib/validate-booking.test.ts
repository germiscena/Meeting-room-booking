import { describe, it, expect } from 'vitest';
import { validateBookingRules } from './validate-booking';
import type { Booking } from '../model/types';

describe('validateBookingRules', () => {
  const todayStr = '2026-10-08';
  const now = new Date(2026, 9, 8, 10, 0, 0); // 10:00:00

  const existingBookings: Booking[] = [
    {
      id: 'existing-1',
      date: '2026-10-08',
      start: '12:00',
      end: '13:00',
      title: 'Lunch sync',
    },
  ];

  it('passes for a valid booking', () => {
    const result = validateBookingRules({
      booking: {
        date: todayStr,
        start: '10:30',
        end: '11:30',
        title: 'Project review',
      },
      existingBookings,
      now,
      todayStr,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects booking on past dates (Rule 6)', () => {
    const result = validateBookingRules({
      booking: {
        date: '2026-10-07',
        start: '10:00',
        end: '11:00',
      },
      existingBookings: [],
      now,
      todayStr,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe('date');
      expect(result.error).toContain('прошедшие даты');
    }
  });

  it('rejects slot outside working hours (Rule 1: 09:00 - 18:00)', () => {
    const earlyResult = validateBookingRules({
      booking: { date: todayStr, start: '08:45', end: '09:30' },
      existingBookings: [],
      now: new Date(2026, 9, 8, 8, 0),
      todayStr,
    });
    expect(earlyResult.valid).toBe(false);

    const lateResult = validateBookingRules({
      booking: { date: todayStr, start: '17:30', end: '18:15' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(lateResult.valid).toBe(false);
  });

  it('allows booking ending exactly at 18:00', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '17:00', end: '18:00' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects when start >= end (Rule 2)', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '14:00', end: '14:00' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects duration < 30 minutes (Rule 3)', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '14:00', end: '14:15' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('30 минут');
    }
  });

  it('rejects duration > 2 hours (Rule 4)', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '14:00', end: '16:15' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('2 часа');
    }
  });

  it('allows duration exactly 2 hours', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '14:00', end: '16:00' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects slots not on 15-minute boundaries', () => {
    const result = validateBookingRules({
      booking: { date: todayStr, start: '14:10', end: '14:40' },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects today slot with less than 2 minutes buffer (Rule 6)', () => {
    // Current time is 10:28:05
    const nowWithSeconds = new Date(2026, 9, 8, 10, 28, 5);
    const result = validateBookingRules({
      booking: { date: todayStr, start: '10:30', end: '11:00' },
      existingBookings: [],
      now: nowWithSeconds,
      todayStr,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('не менее чем за 2 минуты');
    }
  });

  it('rejects overlapping bookings (Rule 5)', () => {
    // Existing is 12:00 - 13:00
    const result = validateBookingRules({
      booking: { date: todayStr, start: '12:30', end: '13:30' },
      existingBookings,
      now,
      todayStr,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('пересекается');
    }
  });

  it('allows touching boundaries (Rule 5 requirement)', () => {
    // Existing is 12:00 - 13:00
    // 11:00 - 12:00 touches start
    const beforeResult = validateBookingRules({
      booking: { date: todayStr, start: '11:00', end: '12:00' },
      existingBookings,
      now,
      todayStr,
    });
    expect(beforeResult.valid).toBe(true);

    // 13:00 - 14:00 touches end
    const afterResult = validateBookingRules({
      booking: { date: todayStr, start: '13:00', end: '14:00' },
      existingBookings,
      now,
      todayStr,
    });
    expect(afterResult.valid).toBe(true);
  });

  it('does NOT conflict with itself when editing (Rule 7 requirement)', () => {
    // Editing booking 'existing-1' (currently 12:00-13:00) to 12:00-13:30
    const result = validateBookingRules({
      booking: { date: todayStr, start: '12:00', end: '13:30' },
      existingBookings,
      excludeBookingId: 'existing-1',
      now,
      todayStr,
    });
    expect(result.valid).toBe(true);
  });

  it('allows keeping original start time when editing a booking that has already started', () => {
    const startedBooking: Booking = {
      id: 'started-1',
      date: todayStr,
      start: '09:30',
      end: '10:30',
      title: 'Утренняя летучка',
    };
    // now is 10:00:00, 09:30 is in the past
    const result = validateBookingRules({
      booking: { date: todayStr, start: '09:30', end: '10:45', title: 'Продленная летучка' },
      existingBookings: [startedBooking],
      excludeBookingId: 'started-1',
      now,
      todayStr,
    });
    expect(result.valid).toBe(true);

    // But changing start to another past time is rejected
    const changeToPastResult = validateBookingRules({
      booking: { date: todayStr, start: '09:15', end: '10:15', title: 'Сдвиг назад' },
      existingBookings: [startedBooking],
      excludeBookingId: 'started-1',
      now,
      todayStr,
    });
    expect(changeToPastResult.valid).toBe(false);
  });

  it('validates title <= 60 characters and rejects > 60 characters', () => {
    const validResult = validateBookingRules({
      booking: {
        date: todayStr,
        start: '10:30',
        end: '11:30',
        title: 'B'.repeat(60),
      },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(validResult.valid).toBe(true);

    const invalidResult = validateBookingRules({
      booking: {
        date: todayStr,
        start: '10:30',
        end: '11:30',
        title: 'B'.repeat(61),
      },
      existingBookings: [],
      now,
      todayStr,
    });
    expect(invalidResult.valid).toBe(false);
    if (!invalidResult.valid) {
      expect(invalidResult.field).toBe('title');
      expect(invalidResult.error).toContain('60 символов');
    }
  });
});

