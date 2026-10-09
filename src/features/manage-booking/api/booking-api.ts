import { apiClient } from '@/shared/api';
import type { Booking, CreateBookingDTO, UpdateBookingDTO } from '@/entities/booking';

export const bookingApi = {
  /**
   * Fetches all bookings for a given date (YYYY-MM-DD).
   */
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/api/bookings?date=${encodeURIComponent(date)}`);
  },

  /**
   * Creates a new booking.
   */
  async createBooking(dto: CreateBookingDTO): Promise<Booking> {
    return apiClient.post<Booking>('/api/bookings', dto);
  },

  /**
   * Updates an existing booking by ID.
   */
  async updateBooking(id: string, dto: UpdateBookingDTO): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${encodeURIComponent(id)}`, dto);
  },

  /**
   * Deletes a booking by ID.
   */
  async deleteBooking(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/bookings/${encodeURIComponent(id)}`);
  },
};
