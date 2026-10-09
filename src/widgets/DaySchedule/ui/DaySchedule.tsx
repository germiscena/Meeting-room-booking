import React, { useState } from 'react';
import { AlertCircle, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { Button, Alert } from '@/shared/ui';
import { getTodayISO } from '@/shared/lib';
import { isPastDate, isTodayDate } from '@/entities/booking';
import type { Booking } from '@/entities/booking';
import { TimelineView } from './TimelineView';
import { BookingsList } from './BookingsList';
import { ScheduleSkeleton } from './ScheduleSkeleton';
import { EmptyDayState } from './EmptyDayState';

export interface DayScheduleProps {
  date: string;
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSelectSlot?: (startTime: string) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (booking: Booking) => void;
  onOpenCreateModal?: () => void;
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ date, bookings, isLoading, isError, error, onRetry, onSelectSlot, onEditBooking, onDeleteBooking, onOpenCreateModal }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'list'>('timeline');

  const todayStr = getTodayISO();
  const isPast = isPastDate(date, todayStr);
  const isToday = isTodayDate(date, todayStr);

  // 1. Loading State
  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <Alert variant="error" title="Ошибка загрузки расписания">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error?.message || 'Не удалось загрузить бронирования на эту дату. Проверьте соединение с сетью.'}</span>
          </div>
        </Alert>

        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            <span>Повторить попытку</span>
          </Button>
        )}
      </div>
    );
  }

  // 3. Content State
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Расписание комнаты</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Забронировано встреч: <span className="font-semibold text-slate-700">{bookings.length}</span>
          </p>
        </div>

        {/* View toggle (Timeline / List) */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            aria-pressed={activeTab === 'timeline'}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'timeline' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Таймлайн</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            aria-pressed={activeTab === 'list'}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Список</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {bookings.length === 0 ? (
        <EmptyDayState isPast={isPast} onBookClick={onOpenCreateModal} />
      ) : (
        <div>
          {activeTab === 'timeline' && (
            <TimelineView
              bookings={bookings}
              isToday={isToday}
              isPast={isPast}
              onSelectSlot={onSelectSlot}
              onEditBooking={onEditBooking}
              onDeleteBooking={onDeleteBooking}
            />
          )}

          {activeTab === 'list' && <BookingsList bookings={bookings} isPast={isPast} onEditBooking={onEditBooking} onDeleteBooking={onDeleteBooking} />}
        </div>
      )}
    </div>
  );
};
