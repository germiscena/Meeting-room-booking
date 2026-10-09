import { describe, it, expect } from 'vitest';
import { bookingFormSchema } from './schemas';

describe('bookingFormSchema', () => {
  it('validates a correct form payload', () => {
    const data = {
      date: '2026-10-08',
      start: '10:00',
      end: '11:00',
      title: 'Valid Meeting',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it('validates optional title', () => {
    const data = {
      date: '2026-10-08',
      start: '10:00',
      end: '11:00',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it('fails on duration < 30 minutes', () => {
    const data = {
      date: '2026-10-08',
      start: '10:00',
      end: '10:15',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toContain('30 минут');
    }
  });

  it('fails on duration > 2 hours', () => {
    const data = {
      date: '2026-10-08',
      start: '10:00',
      end: '12:15',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toContain('2 часа');
    }
  });

  it('fails when start is outside working hours', () => {
    const data = {
      date: '2026-10-08',
      start: '08:45',
      end: '09:30',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it('fails when end is outside working hours', () => {
    const data = {
      date: '2026-10-08',
      start: '17:30',
      end: '18:15',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it('fails when step is not 15 minutes', () => {
    const data = {
      date: '2026-10-08',
      start: '10:05',
      end: '10:45',
    };
    const parsed = bookingFormSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it('validates title <= 60 characters and rejects > 60 characters', () => {
    const validTitle = 'A'.repeat(60);
    const validParsed = bookingFormSchema.safeParse({
      date: '2026-10-08',
      start: '10:00',
      end: '11:00',
      title: validTitle,
    });
    expect(validParsed.success).toBe(true);

    const invalidTitle = 'A'.repeat(61);
    const invalidParsed = bookingFormSchema.safeParse({
      date: '2026-10-08',
      start: '10:00',
      end: '11:00',
      title: invalidTitle,
    });
    expect(invalidParsed.success).toBe(false);
    if (!invalidParsed.success) {
      expect(invalidParsed.error.errors[0].message).toContain('60 символов');
    }
  });
});

