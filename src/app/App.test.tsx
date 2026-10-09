import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { db } from '@/mocks/db';

function renderApp() {
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

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

describe('App End-to-End User Journeys', () => {
  const fixedNow = new Date('2026-10-09T08:00:00');
  const todayStr = '2026-10-09';

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(fixedNow);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.setSystemTime(fixedNow);
    db.resetDb();
  });

  it('renders application header and schedule', async () => {
    renderApp();

    expect(screen.getByText('Бронирование переговорной')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/расписание комнаты/i)).toBeInTheDocument();
    });
  });

  it('creates a new booking and shows it on the schedule', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/переговорная свободна весь день/i)).toBeInTheDocument();
    });

    // Click "Забронировать" button
    const bookBtn = screen.getByRole('button', { name: /забронировать слот/i });
    await user.click(bookBtn);

    // Modal opens
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Новое бронирование')).toBeInTheDocument();

    // Type title
    const titleInput = within(dialog).getByLabelText(/название встречи/i);
    await user.type(titleInput, 'Интервью кандидата');

    // Submit
    const submitBtn = within(dialog).getByRole('button', { name: /^забронировать$/i });
    await user.click(submitBtn);

    // Modal closes and booking appears
    await waitFor(() => {
      expect(screen.queryByText('Новое бронирование')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Интервью кандидата')).toBeInTheDocument();
  });

  it('edits an existing booking without self-conflict (Rule 7)', async () => {
    const user = userEvent.setup();

    // Seed a booking
    db.createBooking({
      date: todayStr,
      start: '14:00',
      end: '15:00',
      title: 'Стартовое совещание',
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Стартовое совещание')).toBeInTheDocument();
    });

    // Click booking on timeline to edit
    const bookingBlock = screen.getByText('Стартовое совещание');
    await user.click(bookingBlock);

    // Modal opens in edit mode
    expect(screen.getByText('Редактирование бронирования')).toBeInTheDocument();

    // Change title
    const titleInput = screen.getByLabelText(/название встречи/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Обновленное совещание');

    // Submit
    const saveBtn = screen.getByRole('button', { name: /сохранить изменения/i });
    await user.click(saveBtn);

    // Modal closes and updated title is displayed
    await waitFor(() => {
      expect(screen.queryByText('Редактирование бронирования')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Обновленное совещание')).toBeInTheDocument();
  });

  it('handles 409 Conflict: modal stays open, data preserved, clear message shown (Rule 8)', async () => {
    const user = userEvent.setup();

    // Existing booking from 14:00 to 15:00
    db.createBooking({
      date: todayStr,
      start: '14:00',
      end: '15:00',
      title: 'Занятый слот',
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Занятый слот')).toBeInTheDocument();
    });

    // Open create modal
    const bookHeaderBtn = screen.getByRole('button', { name: /^забронировать$/i });
    await user.click(bookHeaderBtn);

    const dialog = screen.getByRole('dialog');
    const titleInput = within(dialog).getByLabelText(/название встречи/i);
    await user.type(titleInput, 'Моя встреча');

    // Select start and end that conflict with existing booking (14:00)
    const startSelect = within(dialog).getByLabelText(/время начала/i);
    const endSelect = within(dialog).getByLabelText(/время окончания/i);

    // In background, another user booked 10:00 to 11:00 right now:
    db.createBooking({
      date: todayStr,
      start: '10:00',
      end: '11:00',
      title: 'Внезапно занятый слот',
    });

    await user.selectOptions(startSelect, '10:00');
    await user.selectOptions(endSelect, '11:00');

    // Submit
    const submitBtn = within(dialog).getByRole('button', { name: /^забронировать$/i });
    await user.click(submitBtn);

    // 409 Conflict occurred:
    // 1. Modal must NOT close
    expect(within(dialog).getByText('Новое бронирование')).toBeInTheDocument();

    // 2. Clear error message shown
    await waitFor(() => {
      expect(
        within(dialog).getByText(/выбранный интервал только что занят другим бронированием/i)
      ).toBeInTheDocument();
    });

    // 3. User data NOT lost
    expect(titleInput).toHaveValue('Моя встреча');
  });

  it('deletes an existing booking via confirmation dialog', async () => {
    const user = userEvent.setup();

    db.createBooking({
      date: todayStr,
      start: '16:00',
      end: '17:00',
      title: 'Встреча на удаление',
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Встреча на удаление')).toBeInTheDocument();
    });

    // Switch to list view
    const listTab = screen.getByRole('button', { name: /список/i });
    await user.click(listTab);

    // Click delete icon
    const deleteBtn = screen.getByRole('button', {
      name: /удалить бронирование встреча на удаление/i,
    });
    await user.click(deleteBtn);

    // Confirm dialog opens
    expect(screen.getByText('Удаление бронирования')).toBeInTheDocument();
    expect(screen.getByText(/вы уверены, что хотите удалить эту бронь/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /^удалить бронирование$/i });
    await user.click(confirmBtn);

    // Dialog closes and booking disappears from list
    await waitFor(() => {
      expect(screen.queryByText('Удаление бронирования')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Встреча на удаление')).not.toBeInTheDocument();
  });

  it('deletes an existing booking directly from timeline view', async () => {
    const user = userEvent.setup();

    db.createBooking({
      date: todayStr,
      start: '16:00',
      end: '17:00',
      title: 'Удаление с таймлайна',
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Удаление с таймлайна')).toBeInTheDocument();
    });

    // Click delete icon inside timeline booking block
    const timelineDeleteBtn = screen.getByRole('button', {
      name: /удалить бронирование удаление с таймлайна/i,
    });
    await user.click(timelineDeleteBtn);

    // Confirm dialog opens
    expect(screen.getByText('Удаление бронирования')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^удалить бронирование$/i });
    await user.click(confirmBtn);

    // Dialog closes and booking disappears from timeline
    await waitFor(() => {
      expect(screen.queryByText('Удаление бронирования')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Удаление с таймлайна')).not.toBeInTheDocument();
  });
});
