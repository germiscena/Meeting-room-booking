import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateSelector } from './DateSelector';

describe('DateSelector', () => {
  const futureDate = '2026-10-25';
  const pastDate = '2026-10-01';

  it('renders date header correctly', () => {
    render(<DateSelector selectedDate={futureDate} onDateChange={vi.fn()} />);
    expect(screen.getByText(/25 октября 2026/i)).toBeInTheDocument();
  });

  it('calls onDateChange with next day when clicking next button', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();

    render(<DateSelector selectedDate={futureDate} onDateChange={onDateChange} />);

    const nextBtn = screen.getByRole('button', { name: /следующий день/i });
    await user.click(nextBtn);

    expect(onDateChange).toHaveBeenCalledWith('2026-10-26');
  });

  it('calls onDateChange with previous day when clicking prev button', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();

    render(<DateSelector selectedDate={futureDate} onDateChange={onDateChange} />);

    const prevBtn = screen.getByRole('button', { name: /предыдущий день/i });
    await user.click(prevBtn);

    expect(onDateChange).toHaveBeenCalledWith('2026-10-24');
  });

  it('disables create booking button and shows archive badge on past dates', () => {
    const onOpenCreateModal = vi.fn();

    render(<DateSelector selectedDate={pastDate} onDateChange={vi.fn()} onOpenCreateModal={onOpenCreateModal} />);

    const badge = screen.getByText('В архиве');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('whitespace-nowrap');
    expect(badge).toHaveClass('shrink-0');
    const bookBtn = screen.getByRole('button', { name: /забронировать/i });
    expect(bookBtn).toBeDisabled();
  });

  it('enables create booking button on future dates', async () => {
    const user = userEvent.setup();
    const onOpenCreateModal = vi.fn();

    render(<DateSelector selectedDate={futureDate} onDateChange={vi.fn()} onOpenCreateModal={onOpenCreateModal} />);

    const bookBtn = screen.getByRole('button', { name: /забронировать/i });
    expect(bookBtn).toBeEnabled();

    await user.click(bookBtn);
    expect(onOpenCreateModal).toHaveBeenCalledTimes(1);
  });

  it('renders stable structure for today date with "Сегодня" badge and top-anchored icon', () => {
    const todayStr = '2026-10-09';
    const { container } = render(<DateSelector selectedDate={todayStr} onDateChange={vi.fn()} />);

    const todayBadge = screen.getByText('Сегодня', { selector: 'span' });
    expect(todayBadge).toBeInTheDocument();
    expect(todayBadge).toHaveClass('whitespace-nowrap');
    expect(todayBadge).toHaveClass('shrink-0');

    // Calendar icon container has self-start to prevent vertical jumping
    const iconContainer = container.querySelector('.lucide-calendar')?.parentElement;
    expect(iconContainer).toHaveClass('self-start');
    expect(iconContainer).toHaveClass('shrink-0');
  });

  it('renders dates with short and long day names without layout collapse', () => {
    const shortDayDate = '2026-05-01'; // Пятница, 1 мая
    const longDayDate = '2026-12-28'; // Понедельник, 28 декабря

    const { rerender } = render(<DateSelector selectedDate={shortDayDate} onDateChange={vi.fn()} />);
    expect(screen.getByText(/1 мая 2026/i)).toBeInTheDocument();

    rerender(<DateSelector selectedDate={longDayDate} onDateChange={vi.fn()} />);
    expect(screen.getByText(/28 декабря 2026/i)).toBeInTheDocument();
  });

  it('keeps navigation controls permanently available and stable across today, past, and future dates', () => {
    const onDateChange = vi.fn();
    const onOpenCreateModal = vi.fn();

    // 1. Today state
    const { rerender } = render(<DateSelector selectedDate="2026-10-09" onDateChange={onDateChange} onOpenCreateModal={onOpenCreateModal} />);
    expect(screen.getByRole('button', { name: /предыдущий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /следующий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /забронировать/i })).toBeEnabled();
    expect(screen.getByText('Сегодня', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/рабочие часы комнаты: 09:00 – 18:00/i)).toBeInTheDocument();

    // 2. Past state
    rerender(<DateSelector selectedDate="2026-10-01" onDateChange={onDateChange} onOpenCreateModal={onOpenCreateModal} />);
    expect(screen.getByRole('button', { name: /предыдущий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /следующий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /забронировать/i })).toBeDisabled();
    expect(screen.getByText('В архиве')).toBeInTheDocument();
    expect(screen.getByText(/бронирование на прошедшие даты недоступно/i)).toBeInTheDocument();

    // 3. Future state
    rerender(<DateSelector selectedDate="2026-10-25" onDateChange={onDateChange} onOpenCreateModal={onOpenCreateModal} />);
    expect(screen.getByRole('button', { name: /предыдущий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /следующий день/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /забронировать/i })).toBeEnabled();
    expect(screen.queryByText('В архиве')).not.toBeInTheDocument();
    expect(screen.getByText(/рабочие часы комнаты: 09:00 – 18:00/i)).toBeInTheDocument();
  });

  it('maintains identical height (h-6) for status and explanations row in all 3 situations: "Сегодня", "В архиве", and without badges', () => {
    // 1. Situation 1: With "Сегодня" badge (Today)
    const { container, rerender } = render(<DateSelector selectedDate="2026-10-09" onDateChange={vi.fn()} />);
    const todayStatusRow = container.querySelector('span.truncate')?.parentElement;
    expect(todayStatusRow).toHaveClass('h-6');
    expect(todayStatusRow).toHaveClass('overflow-hidden');
    expect(screen.getByText('Сегодня', { selector: 'span' })).toBeInTheDocument();

    // 2. Situation 2: With "В архиве" badge (Past)
    rerender(<DateSelector selectedDate="2026-10-01" onDateChange={vi.fn()} />);
    const pastStatusRow = container.querySelector('span.truncate')?.parentElement;
    expect(pastStatusRow).toHaveClass('h-6');
    expect(pastStatusRow).toHaveClass('overflow-hidden');
    expect(screen.getByText('В архиве')).toBeInTheDocument();

    // 3. Situation 3: Without badges (Future)
    rerender(<DateSelector selectedDate="2026-10-25" onDateChange={vi.fn()} />);
    const futureStatusRow = container.querySelector('span.truncate')?.parentElement;
    expect(futureStatusRow).toHaveClass('h-6');
    expect(futureStatusRow).toHaveClass('overflow-hidden');
    expect(screen.queryByText('Сегодня', { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.queryByText('В архиве')).not.toBeInTheDocument();
  });
});
