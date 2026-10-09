import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button, Badge } from '@/shared/ui';
import { formatDateToHuman, shiftDateDays, getTodayISO } from '@/shared/lib';
import { isPastDate, isTodayDate } from '@/entities/booking';

export interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  onOpenCreateModal?: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange, onOpenCreateModal }) => {
  const todayStr = getTodayISO();
  const isPast = isPastDate(selectedDate, todayStr);
  const isToday = isTodayDate(selectedDate, todayStr);

  const handlePrevDay = () => {
    onDateChange(shiftDateDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(shiftDateDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-4 gap-y-3 lg:gap-y-1 items-start lg:items-center">
        {/* Date Header */}
        <div className="flex items-center gap-3 min-w-0 col-span-1">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 self-start mt-0.5">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 capitalize leading-snug truncate">{formatDateToHuman(selectedDate)}</h2>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 col-span-1 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
          {/* Day Navigation */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <Button variant="ghost" size="sm" onClick={handlePrevDay} aria-label="Предыдущий день" className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleToday} disabled={isToday} className="h-8 px-2.5 text-xs text-slate-700 hover:bg-white">
              Сегодня
            </Button>

            <Button variant="ghost" size="sm" onClick={handleNextDay} aria-label="Следующий день" className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Direct Date Picker input */}
          <div className="relative">
            <input
              type="date"
              aria-label="Выбрать дату"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer"
            />
          </div>

          {/* Book Button */}
          {onOpenCreateModal && (
            <Button
              variant="primary"
              size="md"
              disabled={isPast}
              onClick={onOpenCreateModal}
              title={isPast ? 'Нельзя создавать бронирования на прошедшие даты' : 'Забронировать'}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Забронировать</span>
            </Button>
          )}
        </div>

        {/* Status and Explanations */}
        <div className="flex items-center gap-2 col-span-1 lg:col-start-1 lg:row-start-2 lg:pl-[3.75rem] h-6 text-xs text-slate-500 min-w-0 overflow-hidden">
          {isToday && (
            <Badge variant="success" className="whitespace-nowrap shrink-0">
              Сегодня
            </Badge>
          )}
          {isPast && (
            <Badge variant="warning" className="whitespace-nowrap shrink-0 px-3 py-0.5 font-medium">
              В архиве
            </Badge>
          )}
          <span className="text-xs sm:text-sm text-slate-500 truncate min-w-0 flex-1" title={isPast ? 'Бронирование на прошедшие даты недоступно' : 'Рабочие часы комнаты: 09:00 – 18:00'}>
            {isPast ? 'Бронирование на прошедшие даты недоступно' : 'Рабочие часы комнаты: 09:00 – 18:00'}
          </span>
        </div>
      </div>
    </div>
  );
};
