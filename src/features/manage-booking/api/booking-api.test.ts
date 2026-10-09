import { describe, it, expect, beforeEach } from 'vitest';
import { bookingApi } from './booking-api';
import { db } from '@/mocks/db';
import { ConflictError, ValidationError, NotFoundError } from '@/shared/api';

describe('bookingApi', () => {
  const testDate = '2026-10-15'; // Future date to avoid "past date" checks

  beforeEach(() => {
    db.resetDb();
  });

  it('fetches empty list when no bookings exist for date', async () => {
    const list = await bookingApi.getBookingsByDate(testDate);
    expect(list).toEqual([]);
  });

  it('creates a new booking successfully', async () => {
    const created = await bookingApi.createBooking({
      date: testDate,
      start: '10:00',
      end: '11:00',
      title: 'Planning',
    });

    expect(created.id).toBeDefined();
    expect(created.date).toBe(testDate);
    expect(created.start).toBe('10:00');
    expect(created.end).toBe('11:00');
    expect(created.title).toBe('Planning');

    const list = await bookingApi.getBookingsByDate(testDate);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
  });

  it('throws ConflictError (409) when trying to book an overlapping slot', async () => {
    // First booking
    await bookingApi.createBooking({
      date: testDate,
      start: '10:00',
      end: '11:00',
      title: 'First meeting',
    });

    // Overlapping booking
    await expect(
      bookingApi.createBooking({
        date: testDate,
        start: '10:30',
        end: '11:30',
        title: 'Conflicting meeting',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('allows touching boundary booking (Rule 5)', async () => {
    await bookingApi.createBooking({
      date: testDate,
      start: '10:00',
      end: '11:00',
      title: 'First meeting',
    });

    // Touching end: 11:00 - 12:00
    const second = await bookingApi.createBooking({
      date: testDate,
      start: '11:00',
      end: '12:00',
      title: 'Adjacent meeting',
    });

    expect(second.id).toBeDefined();
    const list = await bookingApi.getBookingsByDate(testDate);
    expect(list).toHaveLength(2);
  });

  it('throws ValidationError (400) for invalid duration or working hours', async () => {
    await expect(
      bookingApi.createBooking({
        date: testDate,
        start: '10:00',
        end: '10:15', // < 30 minutes
      })
    ).rejects.toThrow(ValidationError);
  });

  it('updates an existing booking successfully', async () => {
    const created = await bookingApi.createBooking({
      date: testDate,
      start: '14:00',
      end: '15:00',
      title: 'Initial',
    });

    const updated = await bookingApi.updateBooking(created.id, {
      title: 'Updated Title',
      end: '15:30',
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.end).toBe('15:30');
  });

  it('throws NotFoundError (404) when updating non-existent booking', async () => {
    await expect(
      bookingApi.updateBooking('non-existent-id', { title: 'Test' })
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes an existing booking successfully', async () => {
    const created = await bookingApi.createBooking({
      date: testDate,
      start: '14:00',
      end: '15:00',
    });

    await bookingApi.deleteBooking(created.id);
    const list = await bookingApi.getBookingsByDate(testDate);
    expect(list).toHaveLength(0);
  });

  it('throws NotFoundError (404) when deleting non-existent booking', async () => {
    await expect(bookingApi.deleteBooking('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});
