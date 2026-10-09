import { type FC } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Modal, Button, Alert } from '@/shared/ui';
import type { Booking } from '@/entities/booking';
import { formatDateToHuman } from '@/shared/lib';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  booking: Booking | null;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
  isOpen,
  booking,
  isLoading,
  error,
  onClose,
  onConfirm,
}) => {
  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Удаление бронирования"
      description="Это действие нельзя отменить"
    >
      <div className="space-y-4 min-w-0">
        {error && (
          <Alert variant="error" title="Ошибка удаления">
            <div className="flex items-start gap-2 mt-0.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </Alert>
        )}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1.5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 text-slate-500 text-xs">
            <span className="shrink-0">Дата:</span>
            <span className="font-medium text-slate-800 truncate text-right">
              {formatDateToHuman(booking.date)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-500 text-xs">
            <span className="shrink-0">Время:</span>
            <span className="font-bold text-slate-900 shrink-0">
              {booking.start} – {booking.end}
            </span>
          </div>
          {booking.title && (
            <div className="flex items-center justify-between gap-3 text-slate-500 text-xs pt-1 border-t border-slate-200/60 min-w-0">
              <span className="shrink-0">Название:</span>
              <span
                className="font-semibold text-slate-800 truncate text-right min-w-0 flex-1"
                title={booking.title}
              >
                {booking.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200/60">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Вы уверены, что хотите удалить эту бронь? Слот станет доступен другим сотрудникам.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="shrink-0"
          >
            Отмена
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
            className="shrink-0"
          >
            Удалить бронирование
          </Button>
        </div>
      </div>
    </Modal>
  );
};
