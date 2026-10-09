import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

describe('BookingDatabase localStorage persistence', () => {
  beforeEach(() => {
    db.resetDb();
  });

  it('persists newly created bookings to localStorage', () => {
    const booking = db.createBooking({
      date: '2026-10-15',
      start: '10:00',
      end: '11:00',
      title: 'Встреча в переговорной',
    });

    const storedRaw = localStorage.getItem('meeting_room_bookings_db_v1');
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw!);
    expect(stored).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: booking.id,
          title: 'Встреча в переговорной',
        }),
      ])
    );
  });

  it('updates bookings in localStorage', () => {
    const booking = db.createBooking({
      date: '2026-10-15',
      start: '10:00',
      end: '11:00',
      title: 'Исходное название',
    });

    db.updateBooking(booking.id, {
      title: 'Обновленное название',
      start: '10:30',
      end: '11:30',
    });

    const storedRaw = localStorage.getItem('meeting_room_bookings_db_v1');
    const stored = JSON.parse(storedRaw!);
    const updated = stored.find((b: { id: string }) => b.id === booking.id);

    expect(updated).toBeDefined();
    expect(updated.title).toBe('Обновленное название');
    expect(updated.start).toBe('10:30');
    expect(updated.end).toBe('11:30');
  });

  it('removes bookings from localStorage on deletion', () => {
    const booking = db.createBooking({
      date: '2026-10-15',
      start: '10:00',
      end: '11:00',
      title: 'Удаляемая встреча',
    });

    const deleted = db.deleteBooking(booking.id);
    expect(deleted).toBe(true);

    const storedRaw = localStorage.getItem('meeting_room_bookings_db_v1');
    const stored = JSON.parse(storedRaw!);
    const found = stored.find((b: { id: string }) => b.id === booking.id);
    expect(found).toBeUndefined();
  });

  it('clears localStorage on resetDb', () => {
    db.createBooking({
      date: '2026-10-15',
      start: '10:00',
      end: '11:00',
      title: 'Тест',
    });

    db.resetDb();
    expect(localStorage.getItem('meeting_room_bookings_db_v1')).toBeNull();
  });
});
