import { z } from 'zod';
import {
  WORK_DAY_START_MINUTES,
  WORK_DAY_END_MINUTES,
  MIN_BOOKING_DURATION_MINUTES,
  MAX_BOOKING_DURATION_MINUTES,
  TIME_STEP_MINUTES,
  MAX_TITLE_LENGTH,
} from './constants';
import { timeToMinutes } from '../lib/time-engine';

export const bookingFormSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Выберите корректную дату'),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Выберите время начала'),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Выберите время окончания'),
    title: z
      .string()
      .trim()
      .max(MAX_TITLE_LENGTH, `Название не должно превышать ${MAX_TITLE_LENGTH} символов`)
      .optional(),
  })
  .superRefine((data, ctx) => {
    const startMin = timeToMinutes(data.start);
    const endMin = timeToMinutes(data.end);

    // Step check
    if (startMin % TIME_STEP_MINUTES !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время начала должно быть с шагом 15 минут',
        path: ['start'],
      });
    }
    if (endMin % TIME_STEP_MINUTES !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время окончания должно быть с шагом 15 минут',
        path: ['end'],
      });
    }

    // Working hours check
    if (startMin < WORK_DAY_START_MINUTES || startMin > WORK_DAY_END_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время начала должно быть в пределах рабочего дня (09:00–18:00)',
        path: ['start'],
      });
    }
    if (endMin < WORK_DAY_START_MINUTES || endMin > WORK_DAY_END_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время окончания должно быть в пределах рабочего дня (09:00–18:00)',
        path: ['end'],
      });
    }

    // start < end
    if (startMin >= endMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время окончания должно быть позже времени начала',
        path: ['end'],
      });
      return;
    }

    const duration = endMin - startMin;

    // Minimum duration 30 min
    if (duration < MIN_BOOKING_DURATION_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Минимальная длительность бронирования — ${MIN_BOOKING_DURATION_MINUTES} минут`,
        path: ['end'],
      });
    }

    // Maximum duration 120 min
    if (duration > MAX_BOOKING_DURATION_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Максимальная длительность бронирования — ${MAX_BOOKING_DURATION_MINUTES / 60} часа`,
        path: ['end'],
      });
    }
  });

export type BookingFormData = z.infer<typeof bookingFormSchema>;
