import type { BookingFormData } from '@/entities/booking';
import { ConflictError, ValidationError } from '@/shared/api';
import {
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} from '../api/use-booking-queries';
import type { useBookingModalState } from './use-booking-modal-state';

export interface UseBookingActionsParams {
  selectedDate: string;
  modalState: ReturnType<typeof useBookingModalState>;
}

export function useBookingActions({ selectedDate, modalState }: UseBookingActionsParams) {
  const createMutation = useCreateBookingMutation();
  const updateMutation = useUpdateBookingMutation();
  const deleteMutation = useDeleteBookingMutation();

  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleFormSubmit = async (formData: BookingFormData) => {
    try {
      modalState.setServerError(null);

      if (modalState.editingBooking) {
        await updateMutation.mutateAsync({
          id: modalState.editingBooking.id,
          date: formData.date,
          dto: {
            start: formData.start,
            end: formData.end,
            title: formData.title,
          },
        });
      } else {
        await createMutation.mutateAsync({
          date: formData.date,
          start: formData.start,
          end: formData.end,
          title: formData.title,
        });
      }

      modalState.closeForm();
    } catch (err: unknown) {
      if (err instanceof ConflictError) {
        modalState.setServerError(
          'Выбранный интервал только что занят другим бронированием. Пожалуйста, выберите другое время.'
        );
      } else if (err instanceof ValidationError) {
        modalState.setServerError(err.message);
      } else if (err instanceof Error) {
        modalState.setServerError(err.message || 'Ошибка сохранения бронирования');
      } else {
        modalState.setServerError('Произошла непредвиденная ошибка');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modalState.bookingToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        id: modalState.bookingToDelete.id,
        date: selectedDate,
      });
      modalState.closeDelete();
    } catch {
      // Error is tracked in deleteMutation.error
    }
  };

  const handleDeleteClose = () => {
    deleteMutation.reset();
    modalState.closeDelete();
  };

  const deleteErrorMessage = deleteMutation.error instanceof Error
    ? deleteMutation.error.message || 'Не удалось удалить бронирование. Попробуйте снова.'
    : deleteMutation.isError
      ? 'Не удалось удалить бронирование. Попробуйте снова.'
      : null;

  return {
    isFormSubmitting,
    isDeleting: deleteMutation.isPending,
    deleteErrorMessage,
    handleFormSubmit,
    handleDeleteConfirm,
    handleDeleteClose,
  };
}
