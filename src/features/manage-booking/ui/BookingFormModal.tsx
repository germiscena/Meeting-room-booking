import { type FC } from 'react';
import { Modal } from '@/shared/ui';
import { BookingForm, type BookingFormProps } from './BookingForm';

export interface BookingFormModalProps extends Omit<BookingFormProps, 'onCancel'> {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingFormModal: FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  ...formProps
}) => {
  const isEditing = Boolean(initialData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редактирование бронирования' : 'Новое бронирование'}
      description="Укажите параметры встречи в переговорной"
    >
      <BookingForm
        initialData={initialData}
        onCancel={onClose}
        {...formProps}
      />
    </Modal>
  );
};
