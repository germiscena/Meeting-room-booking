import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  WORK_DAY_START_MINUTES,
  WORK_DAY_END_MINUTES,
  TIME_STEP_MINUTES,
  timeToMinutes,
  isSlotAvailableForToday,
  minutesToTime,
  isSlotBlockedOnTimeline,
} from '@/entities/booking';
import type { Booking } from '@/entities/booking';

export interface TimelineViewProps {
  bookings: Booking[];
  isToday: boolean;
  isPast: boolean;
  now?: Date;
  onSelectSlot?: (startTime: string) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (booking: Booking) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  bookings,
  isToday,
  isPast,
  now = new Date(),
  onSelectSlot,
  onEditBooking,
  onDeleteBooking,
}) => {
  const totalMinutes = WORK_DAY_END_MINUTES - WORK_DAY_START_MINUTES; // 540 minutes

  // Generate hour markers (09:00, 10:00, ..., 18:00)
  const hourMarkers: number[] = [];
  for (let m = WORK_DAY_START_MINUTES; m <= WORK_DAY_END_MINUTES; m += 60) {
    hourMarkers.push(m);
  }

  // Generate clickable 15-min background slots
  const slots: number[] = [];
  for (let m = WORK_DAY_START_MINUTES; m < WORK_DAY_END_MINUTES; m += TIME_STEP_MINUTES) {
    slots.push(m);
  }

  // Calculate current time position if today
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isNowWithinWorkday =
    isToday &&
    currentMinutes >= WORK_DAY_START_MINUTES &&
    currentMinutes <= WORK_DAY_END_MINUTES;
  const nowPercent = isNowWithinWorkday
    ? ((currentMinutes - WORK_DAY_START_MINUTES) / totalMinutes) * 100
    : null;

  return (
    <div className="w-full overflow-x-auto pb-4 select-none">
      <div className="min-w-[720px] bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        {/* Hour Header Ruler */}
        <div className="relative h-6 text-xs font-semibold text-slate-500 border-b border-slate-200 mb-2">
          {hourMarkers.map((minutes) => {
            const percent = ((minutes - WORK_DAY_START_MINUTES) / totalMinutes) * 100;
            return (
              <div
                key={minutes}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${percent}%` }}
              >
                <span>{minutesToTime(minutes)}</span>
                <span className="w-px h-1.5 bg-slate-300 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* Timeline Canvas Container */}
        <div className="relative h-28 bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
          {/* Vertical Grid Lines for each hour */}
          {hourMarkers.map((minutes) => {
            const percent = ((minutes - WORK_DAY_START_MINUTES) / totalMinutes) * 100;
            return (
              <div
                key={`grid-${minutes}`}
                className="absolute top-0 bottom-0 w-px bg-slate-200/80 pointer-events-none"
                style={{ left: `${percent}%` }}
              />
            );
          })}

          {/* Interactive Background 15-minute Slots */}
          <div className="absolute inset-0 flex">
            {slots.map((slotMin) => {
              const timeStr = minutesToTime(slotMin);
              const isPastSlot = isPast || (isToday && !isSlotAvailableForToday(timeStr, now));
              const isBlockedSlot = isSlotBlockedOnTimeline(timeStr, bookings);
              const isInteractive = !isPastSlot && !isBlockedSlot;

              let slotStyle = 'hover:bg-blue-50/60 cursor-pointer group';
              let slotTitle = `${timeStr} — Нажмите, чтобы забронировать`;

              if (isPastSlot) {
                slotStyle = 'bg-slate-100/60 cursor-not-allowed';
                slotTitle = `${timeStr} (Недоступно: прошедшее время)`;
              } else if (isBlockedSlot) {
                slotStyle = 'bg-slate-200/75 border-r border-slate-300/50 cursor-not-allowed';
                slotTitle = `${timeStr} (Интервал недоступен: менее 30 минут)`;
              }

              return (
                <div
                  key={`slot-${slotMin}`}
                  style={{ width: `${(TIME_STEP_MINUTES / totalMinutes) * 100}%` }}
                  className={`h-full border-r border-slate-100/50 transition-colors ${slotStyle}`}
                  onClick={() => {
                    if (isInteractive && onSelectSlot) {
                      onSelectSlot(timeStr);
                    }
                  }}
                  title={slotTitle}
                  role={isInteractive ? 'button' : 'presentation'}
                  tabIndex={isInteractive ? 0 : -1}
                  aria-disabled={!isInteractive}
                  aria-label={slotTitle}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isInteractive && onSelectSlot) {
                      e.preventDefault();
                      onSelectSlot(timeStr);
                    }
                  }}
                />
              );
            })}
          </div>

          {/* Current Time Indicator Bar */}
          {nowPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow-xs"
              style={{ left: `${nowPercent}%` }}
              title={`Текущее время: ${minutesToTime(currentMinutes)}`}
            >
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -ml-1 -mt-0.5" />
            </div>
          )}

          {/* Render Booked Interval Blocks */}
          {bookings.map((booking) => {
            const startMin = timeToMinutes(booking.start);
            const endMin = timeToMinutes(booking.end);
            const durationMin = endMin - startMin;
            const isShortBlock = durationMin <= 45;

            const leftPercent = ((startMin - WORK_DAY_START_MINUTES) / totalMinutes) * 100;
            const widthPercent = ((endMin - startMin) / totalMinutes) * 100;

            return (
              <div
                key={booking.id}
                role="button"
                aria-label={`Бронирование: ${booking.title || 'Без названия'}, с ${booking.start} до ${booking.end}`}
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditBooking) {
                    onEditBooking(booking);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onEditBooking) {
                    e.preventDefault();
                    onEditBooking(booking);
                  }
                }}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                className="absolute top-2 bottom-2 z-10 rounded-lg bg-blue-600 text-white p-1 sm:p-1.5 grid grid-rows-[auto_1fr_auto] items-center text-center shadow-xs hover:bg-blue-700 hover:shadow-md transition-all cursor-pointer overflow-hidden border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 select-none"
                title={`${booking.start}–${booking.end}${booking.title ? `: ${booking.title}` : ''} (Нажмите для редактирования)`}
              >
                {/* Top Zone: Start and End Time (Row 1) */}
                <div className="flex items-center justify-center text-center w-full min-h-[22px] px-0.5">
                  {isShortBlock ? (
                    <div className="flex flex-col items-center justify-center font-bold text-[10px] leading-tight select-none">
                      <span className="whitespace-nowrap">{booking.start}</span>
                      <span className="whitespace-nowrap">{booking.end}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-[11px] sm:text-xs truncate select-none px-1">
                      {booking.start}–{booking.end}
                    </span>
                  )}
                </div>

                {/* Central Zone: Booking Title (Row 2, 1fr) */}
                <div className="flex items-center justify-center text-center w-full min-h-[1.25rem] px-1 overflow-hidden">
                  {booking.title ? (
                    <span
                      className="truncate max-w-full font-medium text-[10px] sm:text-[11px] text-blue-100 leading-tight block text-center"
                      title={booking.title}
                    >
                      {booking.title}
                    </span>
                  ) : (
                    <div className="h-3 w-full" aria-hidden="true" />
                  )}
                </div>

                {/* Bottom Zone: Delete Button (Row 3) */}
                <div className="flex items-center justify-center text-center w-full min-h-[22px]">
                  {!isPast && onDeleteBooking ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBooking(booking);
                      }}
                      aria-label={`Удалить бронирование ${booking.title || `${booking.start}–${booking.end}`}`}
                      title="Удалить бронирование"
                      className="p-1 rounded text-blue-200 hover:text-white hover:bg-rose-600 transition-colors focus:outline-none focus:ring-1 focus:ring-white shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block" />
            <span>Занято</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-200 inline-block" />
            <span>Свободно (кликните для брони)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 inline-block" />
            <span>Недоступный интервал (&lt; 30 мин)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 inline-block" />
            <span>Прошедшее время</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-rose-500 inline-block" />
              <span>Сейчас</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

