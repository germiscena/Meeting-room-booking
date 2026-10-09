import React from 'react';
import { CalendarCheck2, Plus } from 'lucide-react';
import { Button } from '@/shared/ui';

export interface EmptyDayStateProps {
  isPast: boolean;
  onBookClick?: () => void;
}

export const EmptyDayState: React.FC<EmptyDayStateProps> = ({ isPast, onBookClick }) => {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
        <CalendarCheck2 className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        Переговорная свободна весь день
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
        {isPast
          ? 'В этот день не было бронирований.'
          : 'На эту дату пока нет запланированных встреч. Вы можете занять любое удобное время с 09:00 до 18:00.'}
      </p>

      {!isPast && onBookClick && (
        <Button variant="primary" size="md" onClick={onBookClick}>
          <Plus className="w-4 h-4" />
          <span>Забронировать слот</span>
        </Button>
      )}
    </div>
  );
};
