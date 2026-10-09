export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  title?: string;
}

export type CreateBookingDTO = Omit<Booking, 'id'>;

export type UpdateBookingDTO = Partial<Omit<Booking, 'id' | 'date'>> & {
  start?: string;
  end?: string;
  title?: string;
};

export interface TimeIntervalMinutes {
  startMinutes: number;
  endMinutes: number;
}

export type BookingValidationResult =
  | { valid: true }
  | { valid: false; error: string; field?: 'start' | 'end' | 'date' | 'title' };
