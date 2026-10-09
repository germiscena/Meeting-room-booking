import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Booking } from '@/entities/booking';

describe('DeleteConfirmDialog', () => {
  const mockBooking: Booking = {
    id: 'test-1',
    date: '2026-10-25',
    start: '14:00',
    end: '15:00',
    title: 'Стратегическая сессия',
  };

  it('renders booking details in dialog', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        booking={mockBooking}
        isLoading={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Удаление бронирования')).toBeInTheDocument();
    expect(screen.getByText('Стратегическая сессия')).toBeInTheDocument();
    expect(screen.getByText('14:00 – 15:00')).toBeInTheDocument();
  });

  it('calls onConfirm when clicking confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmDialog
        isOpen={true}
        booking={mockBooking}
        isLoading={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /удалить бронирование/i });
    await user.click(deleteBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking cancel button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <DeleteConfirmDialog
        isOpen={true}
        booking={mockBooking}
        isLoading={false}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /отмена/i });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders error message when error prop is provided', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        booking={mockBooking}
        isLoading={false}
        error="Не удалось удалить бронирование из-за ошибки сети"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByText('Не удалось удалить бронирование из-за ошибки сети')
    ).toBeInTheDocument();
  });

  it('renders long title cleanly with truncate class and preserves action buttons', () => {
    const longTitle = 'Очень длинное название встречи для проверки корректного обрезания в диалоге';
    const bookingWithLongTitle: Booking = {
      ...mockBooking,
      title: longTitle,
    };

    render(
      <DeleteConfirmDialog
        isOpen={true}
        booking={bookingWithLongTitle}
        isLoading={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('truncate');
    expect(titleElement).toHaveClass('min-w-0');
    expect(titleElement).toHaveAttribute('title', longTitle);

    const cancelBtn = screen.getByRole('button', { name: /отмена/i });
    const deleteBtn = screen.getByRole('button', { name: /удалить бронирование/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();
    expect(cancelBtn).toHaveClass('shrink-0');
    expect(deleteBtn).toHaveClass('shrink-0');
  });
});

