import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from './BookingForm';
import type { Booking } from '@/entities/booking';

describe('BookingForm', () => {
  const date = '2026-10-25'; // Future date
  const existingBookings: Booking[] = [
    {
      id: '1',
      date,
      start: '12:00',
      end: '13:00',
      title: 'Обед',
    },
  ];

  it('renders start and end time selectors and inputs', () => {
    render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        isSubmitting={false}
        serverError={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/название встречи/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/время начала/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/время окончания/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /забронировать/i })).toBeInTheDocument();
  });

  it('submits form with entered values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        isSubmitting={false}
        serverError={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/название встречи/i);
    await user.type(titleInput, 'Командный синк');

    const submitBtn = screen.getByRole('button', { name: /забронировать/i });
    await user.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Командный синк',
        date,
      }),
      expect.anything()
    );
  });

  it('renders server error banner (409 Conflict) and preserves entered title and values', () => {
    render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        initialData={{
          id: 'temp',
          date,
          start: '10:00',
          end: '11:00',
          title: 'Моя важная встреча',
        }}
        isSubmitting={false}
        serverError="Выбранный интервал только что занят другим бронированием. Пожалуйста, выберите другое время."
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText(/выбранный интервал только что занят другим бронированием/i)
    ).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/название встречи/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Моя важная встреча');
  });

  it('disables submit button and shows loading state during submission', () => {
    render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        isSubmitting={true}
        serverError={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /забронировать/i });
    expect(submitBtn).toBeDisabled();
  });

  it('truncates title to MAX_TITLE_LENGTH (60 chars) on paste / input', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        isSubmitting={false}
        serverError={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/название встречи/i) as HTMLInputElement;
    const longString = 'A'.repeat(80);
    await user.click(titleInput);
    await user.paste(longString);

    expect(titleInput.value.length).toBe(60);
    expect(titleInput.value).toBe('A'.repeat(60));
  });

  it('displays "Максимум 60 символов" notice in both create and edit modes', () => {
    // 1. Create mode
    const { rerender } = render(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        isSubmitting={false}
        serverError={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/максимум 60 символов/i)).toBeInTheDocument();

    // 2. Edit mode
    rerender(
      <BookingForm
        date={date}
        existingBookings={existingBookings}
        initialData={{
          id: 'edit-1',
          date,
          start: '10:00',
          end: '11:00',
          title: 'Существующая встреча',
        }}
        isSubmitting={false}
        serverError={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/максимум 60 символов/i)).toBeInTheDocument();
  });
});


