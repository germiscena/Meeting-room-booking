import { useMemo, type FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Tag, AlertCircle } from 'lucide-react';
import { Button, Alert } from '@/shared/ui';
import {
  bookingFormSchema,
  type BookingFormData,
  getAvailableStartTimes,
  getValidEndTimes,
  type Booking,
  MAX_TITLE_LENGTH,
} from '@/entities/booking';
import { getTodayISO, formatDateToHuman } from '@/shared/lib';

export interface BookingFormProps {
  date: string;
  existingBookings: Booking[];
  initialData?: Booking | null;
  prefilledStartTime?: string;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
}

export const BookingForm: FC<BookingFormProps> = ({
  date,
  existingBookings,
  initialData,
  prefilledStartTime,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}) => {
  const isEditing = Boolean(initialData);
  const todayStr = getTodayISO();

  // Calculate available start times
  const availableStartTimes = useMemo(() => {
    const slots = getAvailableStartTimes({
      date,
      todayStr,
      now: new Date(),
      existingBookings,
      excludeBookingId: initialData?.id,
    });

    // If editing, make sure the current booking's start time is available in options
    if (initialData?.start && !slots.includes(initialData.start)) {
      return [initialData.start, ...slots].sort();
    }

    return slots;
  }, [date, todayStr, initialData, existingBookings]);

  // Determine initial start and end times
  const defaultStartTime = useMemo(() => {
    if (initialData?.start) return initialData.start;
    if (prefilledStartTime && availableStartTimes.includes(prefilledStartTime)) {
      return prefilledStartTime;
    }
    return availableStartTimes[0] || '09:00';
  }, [initialData, prefilledStartTime, availableStartTimes]);

  const defaultEndTime = useMemo(() => {
    if (initialData?.end) return initialData.end;
    const ends = getValidEndTimes({
      startTime: defaultStartTime,
      existingBookings,
      excludeBookingId: initialData?.id,
    });
    return ends[0] || '09:30';
  }, [initialData, defaultStartTime, existingBookings]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date,
      title: initialData?.title || '',
      start: defaultStartTime,
      end: defaultEndTime,
    },
  });

  const selectedStart = watch('start');

  // Dynamically compute valid end times based on chosen start time
  const validEndTimes = useMemo(() => {
    if (!selectedStart) return [];
    return getValidEndTimes({
      startTime: selectedStart,
      existingBookings,
      excludeBookingId: initialData?.id,
    });
  }, [selectedStart, existingBookings, initialData]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Server Error / 409 Conflict Banner */}
      {serverError && (
        <Alert variant="error" title="Не удалось сохранить бронирование">
          <div className="flex items-start gap-2 mt-0.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        </Alert>
      )}

      {/* Date info */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex justify-between items-center">
        <span>Дата бронирования:</span>
        <span className="font-semibold text-slate-900 capitalize">
          {formatDateToHuman(date)}
        </span>
      </div>

      {/* Title Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="booking-title"
            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 min-w-0"
          >
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Название встречи (опционально)</span>
          </label>
          <span className="text-[11px] text-slate-400 font-normal shrink-0">
            Максимум {MAX_TITLE_LENGTH} символов
          </span>
        </div>
        <input
          id="booking-title"
          type="text"
          placeholder="Например: Синхронизация команды"
          maxLength={MAX_TITLE_LENGTH}
          {...register('title', {
            onChange: (e) => {
              if (e.target.value.length > MAX_TITLE_LENGTH) {
                const truncated = e.target.value.slice(0, MAX_TITLE_LENGTH);
                e.target.value = truncated;
                setValue('title', truncated, { shouldValidate: true, shouldDirty: true });
              }
            },
          })}
          onPaste={(e) => {
            const pasteText = e.clipboardData?.getData('text') || '';
            const target = e.currentTarget;
            const selStart = target.selectionStart ?? target.value.length;
            const selEnd = target.selectionEnd ?? target.value.length;
            const nextValue = target.value.slice(0, selStart) + pasteText + target.value.slice(selEnd);
            if (nextValue.length > MAX_TITLE_LENGTH) {
              e.preventDefault();
              const allowedPasteLen = Math.max(0, MAX_TITLE_LENGTH - (target.value.length - (selEnd - selStart)));
              const truncatedPaste = pasteText.slice(0, allowedPasteLen);
              const finalValue = (target.value.slice(0, selStart) + truncatedPaste + target.value.slice(selEnd)).slice(0, MAX_TITLE_LENGTH);
              target.value = finalValue;
              setValue('title', finalValue, { shouldValidate: true, shouldDirty: true });
            }
          }}
          disabled={isSubmitting}
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors"
        />
        {errors.title && (
          <p className="text-xs text-rose-600">{errors.title.message}</p>
        )}
      </div>

      {/* Start and End Time Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-1.5">
          <label
            htmlFor="booking-start"
            className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Время начала</span>
          </label>
          <Controller
            control={control}
            name="start"
            render={({ field }) => (
              <select
                id="booking-start"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  const newStart = e.target.value;
                  const newValidEndTimes = getValidEndTimes({
                    startTime: newStart,
                    existingBookings,
                    excludeBookingId: initialData?.id,
                  });
                  const currentEnd = getValues('end');
                  if (newValidEndTimes.length > 0 && !newValidEndTimes.includes(currentEnd)) {
                    setValue('end', newValidEndTimes[0]!, { shouldValidate: true });
                  }
                }}
                disabled={isSubmitting || availableStartTimes.length === 0}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors cursor-pointer"
              >
                {availableStartTimes.length === 0 ? (
                  <option value="">Нет доступных слотов</option>
                ) : (
                  availableStartTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                )}
              </select>
            )}
          />
          {errors.start && (
            <p className="text-xs text-rose-600">{errors.start.message}</p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-1.5">
          <label
            htmlFor="booking-end"
            className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Время окончания</span>
          </label>
          <Controller
            control={control}
            name="end"
            render={({ field }) => (
              <select
                id="booking-end"
                {...field}
                disabled={isSubmitting || validEndTimes.length === 0}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors cursor-pointer"
              >
                {validEndTimes.length === 0 ? (
                  <option value="">Недоступно</option>
                ) : (
                  validEndTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                )}
              </select>
            )}
          />
          {errors.end && (
            <p className="text-xs text-rose-600">{errors.end.message}</p>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        Правила: шаг 15 мин, мин. 30 мин, макс. 2 часа. До окончания рабочего дня (18:00).
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={availableStartTimes.length === 0 || validEndTimes.length === 0}
        >
          {isEditing ? 'Сохранить изменения' : 'Забронировать'}
        </Button>
      </div>
    </form>
  );
};
