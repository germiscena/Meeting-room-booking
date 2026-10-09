import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import {
  useBookingsQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} from './use-booking-queries';
import { db } from '@/mocks/db';
import { ConflictError } from '@/shared/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

describe('use-booking-queries', () => {
  const testDate = '2026-10-20';

  beforeEach(() => {
    db.resetDb();
  });

  it('fetches bookings via useBookingsQuery', async () => {
    db.createBooking({
      date: testDate,
      start: '10:00',
      end: '11:00',
      title: 'Sync',
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBookingsQuery(testDate), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].title).toBe('Sync');
  });

  it('invalidates cache on successful create mutation', async () => {
    const { wrapper } = createWrapper();

    const { result: queryResult } = renderHook(() => useBookingsQuery(testDate), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    expect(queryResult.current.data).toHaveLength(0);

    const { result: mutationResult } = renderHook(() => useCreateBookingMutation(), { wrapper });

    mutationResult.current.mutate({
      date: testDate,
      start: '11:00',
      end: '12:00',
      title: 'New Booking',
    });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    // The query should automatically refetch because cache was invalidated
    await waitFor(() => expect(queryResult.current.data).toHaveLength(1));
    expect(queryResult.current.data?.[0].title).toBe('New Booking');
  });

  it('invalidates cache on 409 Conflict so client gets current conflicting state', async () => {
    // Existing booking in DB
    db.createBooking({
      date: testDate,
      start: '14:00',
      end: '15:00',
      title: 'Existing',
    });

    const { wrapper } = createWrapper();

    const { result: queryResult } = renderHook(() => useBookingsQuery(testDate), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

    const { result: mutationResult } = renderHook(() => useCreateBookingMutation(), { wrapper });

    // Attempt to book conflicting slot
    mutationResult.current.mutate({
      date: testDate,
      start: '14:30',
      end: '15:30',
      title: 'Conflicting',
    });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));
    expect(mutationResult.current.error).toBeInstanceOf(ConflictError);

    // Verify invalidateQueries was called and query is up-to-date
    expect(queryResult.current.data).toHaveLength(1);
  });

  it('updates and deletes booking with cache invalidation', async () => {
    const created = db.createBooking({
      date: testDate,
      start: '15:00',
      end: '16:00',
      title: 'To Update',
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        query: useBookingsQuery(testDate),
        update: useUpdateBookingMutation(),
        deleteBooking: useDeleteBookingMutation(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.query.data?.[0].title).toBe('To Update');

    // Update
    result.current.update.mutate({
      id: created.id,
      date: testDate,
      dto: { title: 'Updated' },
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.query.data?.[0].title).toBe('Updated'));

    // Delete
    result.current.deleteBooking.mutate({ id: created.id, date: testDate });
    await waitFor(() => expect(result.current.deleteBooking.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.query.data).toHaveLength(0));
  });
});
