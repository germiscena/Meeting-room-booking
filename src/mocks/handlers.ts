import { http, HttpResponse, delay } from 'msw';
import { db } from './db';
import { validateBookingRules } from '../entities/booking';
import type { CreateBookingDTO, UpdateBookingDTO } from '../entities/booking';

// Add slight network delay only in non-test environment
const simulatedDelay = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await delay(120);
  }
};

export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // GET /api/bookings?date=YYYY-MM-DD
  http.get('/api/bookings', async ({ request }) => {
    await simulatedDelay();
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return HttpResponse.json(
        { message: 'Параметр date обязателен (YYYY-MM-DD)', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return HttpResponse.json(
        { message: 'Неверный формат даты', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const bookings = db.getBookingsByDate(date);
    return HttpResponse.json(bookings);
  }),

  // POST /api/bookings
  http.post('/api/bookings', async ({ request }) => {
    await simulatedDelay();

    let body: CreateBookingDTO;
    try {
      body = (await request.json()) as CreateBookingDTO;
    } catch {
      return HttpResponse.json(
        { message: 'Некорректное тело запроса', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const existingBookings = db.getBookingsByDate(body.date);
    const validation = validateBookingRules({
      booking: body,
      existingBookings,
    });

    if (!validation.valid) {
      const isConflict = validation.error.includes('пересекается');
      return HttpResponse.json(
        {
          message: validation.error,
          code: isConflict ? 'CONFLICT' : 'VALIDATION_ERROR',
          field: validation.field,
        },
        { status: isConflict ? 409 : 400 }
      );
    }

    const created = db.createBooking(body);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PATCH /api/bookings/:id
  http.patch('/api/bookings/:id', async ({ request, params }) => {
    await simulatedDelay();

    const id = params.id as string;
    const existing = db.getBookingById(id);

    if (!existing) {
      return HttpResponse.json(
        { message: 'Бронирование не найдено', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let body: UpdateBookingDTO;
    try {
      body = (await request.json()) as UpdateBookingDTO;
    } catch {
      return HttpResponse.json(
        { message: 'Некорректное тело запроса', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const merged = {
      date: existing.date,
      start: body.start || existing.start,
      end: body.end || existing.end,
      title: body.title !== undefined ? body.title : existing.title,
    };

    const existingForDate = db.getBookingsByDate(existing.date);
    const validation = validateBookingRules({
      booking: merged,
      existingBookings: existingForDate,
      excludeBookingId: id,
      originalBooking: existing,
    });

    if (!validation.valid) {
      const isConflict = validation.error.includes('пересекается');
      return HttpResponse.json(
        {
          message: validation.error,
          code: isConflict ? 'CONFLICT' : 'VALIDATION_ERROR',
          field: validation.field,
        },
        { status: isConflict ? 409 : 400 }
      );
    }

    const updated = db.updateBooking(id, body);
    return HttpResponse.json(updated, { status: 200 });
  }),

  // DELETE /api/bookings/:id
  http.delete('/api/bookings/:id', async ({ params }) => {
    await simulatedDelay();

    const id = params.id as string;
    const deleted = db.deleteBooking(id);

    if (!deleted) {
      return HttpResponse.json(
        { message: 'Бронирование не найдено', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
