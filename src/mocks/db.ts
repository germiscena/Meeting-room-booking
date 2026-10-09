import type { Booking, CreateBookingDTO, UpdateBookingDTO } from '../entities/booking';
import { formatDateToISO } from '../entities/booking';

class BookingDatabase {
  private bookings: Booking[] = [];
  private idCounter = 1;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Resets database to empty state (useful for test isolation).
   */
  public resetDb(): void {
    this.bookings = [];
    this.idCounter = 1;
  }

  /**
   * Seeds demo data around today and future dates.
   */
  public seedInitialData(baseDate = new Date()): void {
    this.resetDb();

    const todayStr = formatDateToISO(baseDate);

    // Tomorrow date
    const tomorrow = new Date(baseDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateToISO(tomorrow);

    // Day after tomorrow
    const dayAfter = new Date(baseDate);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = formatDateToISO(dayAfter);

    this.bookings = [
      {
        id: 'mock-1',
        date: todayStr,
        start: '13:00',
        end: '14:00',
        title: 'Командный обед и синк',
      },
      {
        id: 'mock-2',
        date: todayStr,
        start: '16:00',
        end: '17:30',
        title: 'Демо спринта',
      },
      {
        id: 'mock-3',
        date: tomorrowStr,
        start: '10:00',
        end: '11:00',
        title: 'Собеседование Frontend',
      },
      {
        id: 'mock-4',
        date: tomorrowStr,
        start: '14:00',
        end: '15:00',
        title: '1-on-1 с тимлидом',
      },
      {
        id: 'mock-5',
        date: dayAfterStr,
        start: '11:00',
        end: '12:30',
        title: 'Ретроспектива',
      },
    ];

    this.idCounter = 10;
  }

  public getBookingsByDate(date: string): Booking[] {
    return this.bookings
      .filter((b) => b.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  public createBooking(dto: CreateBookingDTO): Booking {
    const newBooking: Booking = {
      id: `booking-${Date.now()}-${this.idCounter++}`,
      date: dto.date,
      start: dto.start,
      end: dto.end,
      title: dto.title?.trim() || undefined,
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  public updateBooking(id: string, updates: UpdateBookingDTO): Booking | undefined {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return undefined;
    }

    const existing = this.bookings[index];
    const updated: Booking = {
      ...existing,
      ...(updates.start ? { start: updates.start } : {}),
      ...(updates.end ? { end: updates.end } : {}),
      ...(updates.title !== undefined
        ? { title: updates.title.trim() ? updates.title.trim() : undefined }
        : {}),
    };

    this.bookings[index] = updated;
    return updated;
  }

  public deleteBooking(id: string): boolean {
    const initialLength = this.bookings.length;
    this.bookings = this.bookings.filter((b) => b.id !== id);
    return this.bookings.length !== initialLength;
  }
}

export const db = new BookingDatabase();
