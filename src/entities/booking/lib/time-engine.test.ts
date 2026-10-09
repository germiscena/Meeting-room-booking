import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  formatDateToISO,
  isPastDate,
  isTodayDate,
  hasTimeOverlap,
  findConflictingBooking,
  isSlotAvailableForToday,
  generateTimeSlots,
  getAvailableStartTimes,
  getValidEndTimes,
  isSlotBlockedOnTimeline,
} from './time-engine';
import type { Booking } from '../model/types';

describe('time-engine', () => {
  describe('timeToMinutes & minutesToTime', () => {
    it('correctly converts between time string and minutes', () => {
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('10:30')).toBe(630);
      expect(timeToMinutes('18:00')).toBe(1080);
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(630)).toBe('10:30');
      expect(minutesToTime(1080)).toBe('18:00');
    });
  });

  describe('formatDateToISO', () => {
    it('formats date into local YYYY-MM-DD string without timezone shifts', () => {
      const date = new Date(2026, 9, 8, 14, 30); // 8 Oct 2026
      expect(formatDateToISO(date)).toBe('2026-10-08');
    });
  });

  describe('isPastDate & isTodayDate', () => {
    const today = '2026-10-08';

    it('identifies past dates', () => {
      expect(isPastDate('2026-10-07', today)).toBe(true);
      expect(isPastDate('2026-10-08', today)).toBe(false);
      expect(isPastDate('2026-10-09', today)).toBe(false);
    });

    it('identifies today date', () => {
      expect(isTodayDate('2026-10-08', today)).toBe(true);
      expect(isTodayDate('2026-10-07', today)).toBe(false);
    });
  });

  describe('hasTimeOverlap (interval collision & boundary touching)', () => {
    const base = { start: '10:00', end: '11:00' };

    it('returns true when intervals overlap', () => {
      // Complete overlap
      expect(hasTimeOverlap(base, { start: '10:00', end: '11:00' })).toBe(true);
      // Subset
      expect(hasTimeOverlap(base, { start: '10:15', end: '10:45' })).toBe(true);
      // Superset
      expect(hasTimeOverlap(base, { start: '09:30', end: '11:30' })).toBe(true);
      // Overlap on left
      expect(hasTimeOverlap(base, { start: '09:30', end: '10:30' })).toBe(true);
      // Overlap on right
      expect(hasTimeOverlap(base, { start: '10:30', end: '11:30' })).toBe(true);
    });

    it('returns false when intervals do NOT overlap (including boundary touching)', () => {
      // Disjoint before
      expect(hasTimeOverlap(base, { start: '09:00', end: '09:30' })).toBe(false);
      // Disjoint after
      expect(hasTimeOverlap(base, { start: '12:00', end: '13:00' })).toBe(false);

      // Boundary touching left: [09:00, 10:00) and [10:00, 11:00)
      expect(hasTimeOverlap(base, { start: '09:00', end: '10:00' })).toBe(false);

      // Boundary touching right: [10:00, 11:00) and [11:00, 12:00) (Rule 5 requirement)
      expect(hasTimeOverlap(base, { start: '11:00', end: '12:00' })).toBe(false);
    });
  });

  describe('findConflictingBooking', () => {
    const bookings: Booking[] = [
      { id: '1', date: '2026-10-08', start: '10:00', end: '11:00', title: 'Meeting 1' },
      { id: '2', date: '2026-10-08', start: '13:00', end: '14:00', title: 'Meeting 2' },
    ];

    it('returns conflicting booking if there is overlap', () => {
      const conflict = findConflictingBooking({ start: '10:30', end: '11:30' }, bookings);
      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe('1');
    });

    it('returns null if slot touches boundaries without overlap', () => {
      expect(findConflictingBooking({ start: '11:00', end: '12:00' }, bookings)).toBeNull();
      expect(findConflictingBooking({ start: '09:00', end: '10:00' }, bookings)).toBeNull();
    });

    it('ignores the booking being edited when excludeBookingId is provided (Rule 7 requirement)', () => {
      // Editing booking '1': changing its end time from 11:00 to 11:30
      const conflict = findConflictingBooking({ start: '10:00', end: '11:30' }, bookings, '1');
      expect(conflict).toBeNull();
    });
  });

  describe('isSlotAvailableForToday (2-minute buffer rule)', () => {
    // Slot 10:30:00
    const slot = '10:30';

    it('is available at 10:27 (3 min left >= 2 min)', () => {
      const now = new Date(2026, 9, 8, 10, 27, 0);
      expect(isSlotAvailableForToday(slot, now)).toBe(true);
    });

    it('is available at 10:28:00 exactly (2 min left == 2 min)', () => {
      const now = new Date(2026, 9, 8, 10, 28, 0);
      expect(isSlotAvailableForToday(slot, now)).toBe(true);
    });

    it('is NOT available at 10:28:01 (1 min 59 sec left < 2 min)', () => {
      const now = new Date(2026, 9, 8, 10, 28, 1);
      expect(isSlotAvailableForToday(slot, now)).toBe(false);
    });

    it('at 10:28:01 the next slot 10:45 is available', () => {
      const now = new Date(2026, 9, 8, 10, 28, 1);
      expect(isSlotAvailableForToday('10:45', now)).toBe(true);
    });
  });

  describe('generateTimeSlots', () => {
    it('generates 15-minute slots between 09:00 and 10:00', () => {
      const slots = generateTimeSlots(9 * 60, 10 * 60, 15);
      expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
    });
  });

  describe('getAvailableStartTimes', () => {
    it('returns empty array for past dates', () => {
      const slots = getAvailableStartTimes({
        date: '2026-10-07',
        todayStr: '2026-10-08',
      });
      expect(slots).toEqual([]);
    });

    it('returns all slots up to 17:30 for future dates', () => {
      const slots = getAvailableStartTimes({
        date: '2026-10-09',
        todayStr: '2026-10-08',
      });
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('17:30');
      expect(slots.includes('17:45')).toBe(false); // Can't start at 17:45 because min duration is 30m
    });

    it('filters out past slots on today using the 2-minute rule', () => {
      const now = new Date(2026, 9, 8, 10, 28, 5); // 10:28:05
      const slots = getAvailableStartTimes({
        date: '2026-10-08',
        todayStr: '2026-10-08',
        now,
      });
      // 10:30 is not available (< 2 min)
      expect(slots.includes('10:30')).toBe(false);
      // 10:45 is available
      expect(slots.includes('10:45')).toBe(true);
      expect(slots[0]).toBe('10:45');
    });

    it('filters out occupied slots and slots within 15 min before an existing booking', () => {
      const existingBookings: Booking[] = [
        { id: '1', date: '2026-10-15', start: '10:00', end: '11:00' },
      ];

      const slots = getAvailableStartTimes({
        date: '2026-10-15',
        todayStr: '2026-10-08',
        existingBookings,
      });

      // 09:30 is allowed (09:30-10:00 is 30 mins)
      expect(slots.includes('09:30')).toBe(true);
      // 09:45 is excluded (cannot form 30 min before 10:00)
      expect(slots.includes('09:45')).toBe(false);
      // Occupied slots (10:00, 10:15, 10:30, 10:45) are excluded
      expect(slots.includes('10:00')).toBe(false);
      expect(slots.includes('10:15')).toBe(false);
      expect(slots.includes('10:30')).toBe(false);
      expect(slots.includes('10:45')).toBe(false);
      // 11:00 touches boundary and is allowed (e.g. 11:00-11:30)
      expect(slots.includes('11:00')).toBe(true);
    });

    it('ignores the booking being edited when excludeBookingId is provided', () => {
      const existingBookings: Booking[] = [
        { id: '1', date: '2026-10-15', start: '10:00', end: '11:00' },
      ];

      const slots = getAvailableStartTimes({
        date: '2026-10-15',
        todayStr: '2026-10-08',
        existingBookings,
        excludeBookingId: '1',
      });

      // 10:00 is available because booking 1 is excluded
      expect(slots.includes('10:00')).toBe(true);
      expect(slots.includes('09:45')).toBe(true);
    });
  });

  describe('getValidEndTimes', () => {
    const existingBookings: Booking[] = [
      { id: '1', date: '2026-10-08', start: '11:00', end: '12:00' },
    ];

    it('provides valid end times adhering to min 30m, max 120m, and workday limit', () => {
      const endTimes = getValidEndTimes({
        startTime: '09:00',
        existingBookings: [],
      });
      // From 09:30 up to 11:00 (max 2 hours)
      expect(endTimes).toEqual(['09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00']);
    });

    it('caps end times by the next existing booking so meetings cannot overlap', () => {
      const endTimes = getValidEndTimes({
        startTime: '10:00',
        existingBookings, // Booking at 11:00
      });
      // Allowed: 10:30, 10:45, 11:00 (11:00 touches boundary, which is allowed)
      expect(endTimes).toEqual(['10:30', '10:45', '11:00']);
      expect(endTimes.includes('11:15')).toBe(false);
    });

    it('does not cap by the booking being edited', () => {
      const endTimes = getValidEndTimes({
        startTime: '10:00',
        existingBookings,
        excludeBookingId: '1', // We are editing booking 1
      });
      // Allowed up to 12:00 (max 2 hours)
      expect(endTimes).toContain('12:00');
    });
  });

  describe('isSlotBlockedOnTimeline', () => {
    it('blocks 09:00–09:15 if an existing booking starts at 09:15', () => {
      const bookings: Booking[] = [
        { id: '1', date: '2026-10-08', start: '09:15', end: '10:00' },
      ];
      expect(isSlotBlockedOnTimeline('09:00', bookings)).toBe(true);
      // 09:15 itself is occupied, not a dead free slot
      expect(isSlotBlockedOnTimeline('09:15', bookings)).toBe(false);
      // 10:00 is available
      expect(isSlotBlockedOnTimeline('10:00', bookings)).toBe(false);
    });

    it('does NOT block 09:00 if an existing booking starts at 09:30', () => {
      const bookings: Booking[] = [
        { id: '1', date: '2026-10-08', start: '09:30', end: '10:30' },
      ];
      // User can book 09:00–09:30 (30 mins duration)
      expect(isSlotBlockedOnTimeline('09:00', bookings)).toBe(false);
      expect(isSlotBlockedOnTimeline('09:15', bookings)).toBe(false);
    });

    it('blocks 17:45–18:00 if an existing booking ends at 17:45', () => {
      const bookings: Booking[] = [
        { id: '1', date: '2026-10-08', start: '16:00', end: '17:45' },
      ];
      expect(isSlotBlockedOnTimeline('17:45', bookings)).toBe(true);
    });

    it('does NOT block 17:45 if the day is empty (as it can be part of a 17:30–18:00 booking)', () => {
      expect(isSlotBlockedOnTimeline('17:45', [])).toBe(false);
    });

    it('blocks a 15-minute gap preceding a booking when slot 30m before is occupied', () => {
      const bookings: Booking[] = [
        { id: '1', date: '2026-10-08', start: '10:00', end: '10:30' },
        { id: '2', date: '2026-10-08', start: '10:45', end: '11:45' },
      ];
      // 10:30 is 15 min before booking 2 (10:45), and 30m before (10:15) is occupied by booking 1
      expect(isSlotBlockedOnTimeline('10:30', bookings)).toBe(true);
    });

    it('does NOT block a 30-minute gap between bookings', () => {
      const bookings: Booking[] = [
        { id: '1', date: '2026-10-08', start: '10:00', end: '10:30' },
        { id: '2', date: '2026-10-08', start: '11:00', end: '12:00' },
      ];
      // Gap is 10:30–11:00 (30 mins). A 30-min booking 10:30–11:00 is valid!
      expect(isSlotBlockedOnTimeline('10:30', bookings)).toBe(false);
      expect(isSlotBlockedOnTimeline('10:45', bookings)).toBe(false);
    });
  });
});

