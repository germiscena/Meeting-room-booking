import React from 'react';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { Booking } from '@/entities/booking';
import { timeToMinutes } from '@/entities/booking';

export interface BookingsListProps {
  bookings: Booking[];
  isPast: boolean;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (booking: Booking) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({ bookings, isPast, onEditBooking, onDeleteBooking }) => {
  const formatDuration = (start: string, end: string) => {
    const mins = timeToMinutes(end) - timeToMinutes(start);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0 && remainingMins > 0) {
      return `${hours} ч ${remainingMins} мин`;
    }
    if (hours > 0) {
      return `${hours} ч`;
    }
    return `${remainingMins} мин`;
  };

  return (
    <div className="space-y-3" role="list" aria-label="Список бронирований на день">
      {bookings.map((booking) => {
        const durationText = formatDuration(booking.start, booking.end);

        return (
          <div
            key={booking.id}
            role="listitem"
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all gap-3 overflow-hidden"
          >
            {/* Info */}
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="flex flex-col items-center justify-center w-28 py-1.5 px-2 bg-slate-100 rounded-lg text-slate-800 font-semibold text-xs sm:text-sm shrink-0">
                <span>
                  {booking.start} – {booking.end}
                </span>
                <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {durationText}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate"
                  title={booking.title || 'Встреча в переговорной'}
                >
                  {booking.title || 'Встреча в переговорной'}
                </h4>
                <p className="text-xs text-slate-500">{booking.title ? 'Забронировано' : 'Без указания названия'}</p>
              </div>
            </div>

            {/* Actions */}
            {!isPast && (
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 ml-auto sm:ml-4">
                {onEditBooking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditBooking(booking)}
                    aria-label={`Редактировать бронирование ${booking.title || booking.start}`}
                    className="h-8 px-2.5 text-xs text-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Изменить</span>
                  </Button>
                )}

                {onDeleteBooking && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteBooking(booking)}
                    aria-label={`Удалить бронирование ${booking.title || booking.start}`}
                    className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
