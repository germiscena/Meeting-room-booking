import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { bookingApi } from './booking-api';
import { bookingKeys } from './booking-keys';
import { ConflictError } from '@/shared/api';
import type { Booking, CreateBookingDTO, UpdateBookingDTO } from '@/entities/booking';

/**
 * Hook for fetching bookings for a specific date.
 */
export function useBookingsQuery(
  date: string,
  options?: Omit<UseQueryOptions<Booking[], Error, Booking[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bookingKeys.list(date),
    queryFn: () => bookingApi.getBookingsByDate(date),
    enabled: Boolean(date),
    ...options,
  });
}

/**
 * Hook for creating a new booking.
 * On success or 409 Conflict, automatically invalidates the query cache for that date
 * to ensure UI has the latest view of occupied slots.
 */
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBookingDTO) => bookingApi.createBooking(dto),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.list(created.date),
      });
    },
    onError: (error, variables) => {
      // Invalidate on 409 so UI shows the conflicting bookings that were booked concurrently
      if (error instanceof ConflictError) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.list(variables.date),
        });
      }
    },
  });
}

/**
 * Hook for updating an existing booking.
 */
export function useUpdateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      date: string;
      dto: UpdateBookingDTO;
    }) => bookingApi.updateBooking(id, dto),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.list(variables.date || updated?.date),
      });
    },
    onError: (error, variables) => {
      if (error instanceof ConflictError) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.list(variables.date),
        });
      }
    },
  });
}

/**
 * Hook for deleting a booking.
 */
export function useDeleteBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; date: string }) => bookingApi.deleteBooking(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.list(variables.date),
      });
    },
  });
}
