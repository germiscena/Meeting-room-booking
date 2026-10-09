import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DaySchedule } from './DaySchedule';
import type { Booking } from '@/entities/booking';

describe('DaySchedule', () => {
  const date = '2026-10-25';

  const mockBookings: Booking[] = [
    {
      id: '1',
      date,
      start: '10:00',
      end: '11:00',
      title: 'Спринт планирование',
    },
    {
      id: '2',
      date,
      start: '14:00',
      end: '15:30',
      title: 'Демо клиенту',
    },
  ];

  it('renders skeleton during loading state', () => {
    const { container } = render(
      <DaySchedule
        date={date}
        bookings={[]}
        isLoading={true}
        isError={false}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error message and retry button when isError is true', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <DaySchedule
        date={date}
        bookings={[]}
        isLoading={false}
        isError={true}
        error={new Error('Сетевой сбой')}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText(/Сетевой сбой/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /повторить попытку/i });
    await user.click(retryBtn);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when there are no bookings', () => {
    render(
      <DaySchedule
        date={date}
        bookings={[]}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText(/Переговорная свободна весь день/i)).toBeInTheDocument();
  });

  it('renders bookings on the timeline', () => {
    render(
      <DaySchedule
        date={date}
        bookings={mockBookings}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText('Спринт планирование')).toBeInTheDocument();
    expect(screen.getByText('Демо клиенту')).toBeInTheDocument();
  });

  it('switches to list view and displays bookings with actions', async () => {
    const user = userEvent.setup();
    const onEditBooking = vi.fn();
    const onDeleteBooking = vi.fn();

    render(
      <DaySchedule
        date={date}
        bookings={mockBookings}
        isLoading={false}
        isError={false}
        onEditBooking={onEditBooking}
        onDeleteBooking={onDeleteBooking}
      />
    );

    // Switch to list tab
    const listTab = screen.getByRole('button', { name: /список/i });
    await user.click(listTab);

    expect(screen.getByText('Спринт планирование')).toBeInTheDocument();
    expect(screen.getByText('10:00 – 11:00')).toBeInTheDocument();

    const editButtons = screen.getAllByRole('button', { name: /изменить|редактировать/i });
    await user.click(editButtons[0]);
    expect(onEditBooking).toHaveBeenCalledWith(mockBookings[0]);
  });

  it('calls onSelectSlot when clicking an available slot on the timeline', async () => {
    const user = userEvent.setup();
    const onSelectSlot = vi.fn();

    render(
      <DaySchedule
        date={date}
        bookings={mockBookings}
        isLoading={false}
        isError={false}
        onSelectSlot={onSelectSlot}
      />
    );

    // Find slot for 09:00
    const slot0900 = screen.getByTitle(/09:00 — Нажмите, чтобы забронировать/i);
    await user.click(slot0900);

    expect(onSelectSlot).toHaveBeenCalledWith('09:00');
  });

  it('renders short 30-minute block with start and end times on separate lines without truncation', () => {
    const shortBookings: Booking[] = [
      { id: 'short-1', date, start: '09:00', end: '09:30', title: 'Короткий синк' },
    ];

    render(
      <DaySchedule
        date={date}
        bookings={shortBookings}
        isLoading={false}
        isError={false}
      />
    );

    const startElements = screen.getAllByText('09:00');
    expect(startElements.length).toBeGreaterThanOrEqual(2); // One on the hour ruler, one inside booking block
    const blockStart = startElements.find((el) => el.classList.contains('whitespace-nowrap'));
    expect(blockStart).toBeDefined();

    const blockEnd = screen.getByText('09:30');
    expect(blockEnd).toBeInTheDocument();
    expect(blockEnd).toHaveClass('whitespace-nowrap');
  });

  it('allows deleting booking directly from timeline view', async () => {
    const user = userEvent.setup();
    const onDeleteBooking = vi.fn();

    render(
      <DaySchedule
        date={date}
        bookings={mockBookings}
        isLoading={false}
        isError={false}
        onDeleteBooking={onDeleteBooking}
      />
    );

    const deleteBtn = screen.getByRole('button', {
      name: /удалить бронирование спринт планирование/i,
    });
    await user.click(deleteBtn);

    expect(onDeleteBooking).toHaveBeenCalledWith(mockBookings[0]);
  });

  it('blocks unusable 15-minute slot on timeline (09:00 when booking starts at 09:15) and prevents interaction', async () => {
    const user = userEvent.setup();
    const onSelectSlot = vi.fn();
    const bookingsAt0915: Booking[] = [
      { id: 'b-915', date, start: '09:15', end: '10:00', title: 'Утренняя летучка' },
    ];

    const { container } = render(
      <DaySchedule
        date={date}
        bookings={bookingsAt0915}
        isLoading={false}
        isError={false}
        onSelectSlot={onSelectSlot}
      />
    );

    // 09:00 slot should have blocked title and cursor-not-allowed
    const blockedSlot = container.querySelector('[title*="09:00 (Интервал недоступен: менее 30 минут)"]');
    expect(blockedSlot).toBeInTheDocument();
    expect(blockedSlot).toHaveClass('cursor-not-allowed');

    if (blockedSlot) {
      await user.click(blockedSlot);
    }
    expect(onSelectSlot).not.toHaveBeenCalled();
  });

  it('renders list view with long title without displacing buttons', async () => {
    const user = userEvent.setup();
    const onEditBooking = vi.fn();
    const onDeleteBooking = vi.fn();
    const longTitle = 'Очень длинное название встречи для проверки корректного отображения';
    const bookingsWithLongTitle: Booking[] = [
      { id: 'long-1', date, start: '10:00', end: '11:00', title: longTitle },
    ];

    render(
      <DaySchedule
        date={date}
        bookings={bookingsWithLongTitle}
        isLoading={false}
        isError={false}
        onEditBooking={onEditBooking}
        onDeleteBooking={onDeleteBooking}
      />
    );

    // Switch to list view
    const listTab = screen.getByRole('button', { name: /список/i });
    await user.click(listTab);

    // Check title element has truncate class
    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('truncate');

    // Action buttons must still be present and functional
    const editBtn = screen.getByRole('button', { name: new RegExp(`редактировать бронирование ${longTitle}`, 'i') });
    const deleteBtn = screen.getByRole('button', { name: new RegExp(`удалить бронирование ${longTitle}`, 'i') });
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();
  });
});

