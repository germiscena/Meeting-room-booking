import { useState } from 'react';
import { DateSelector } from '@/widgets/DateSelector';
import { DaySchedule } from '@/widgets/DaySchedule';
import {
  useBookingsQuery,
  useBookingModalState,
  useBookingActions,
  BookingFormModal,
  DeleteConfirmDialog,
} from '@/features/manage-booking';
import { getTodayISO } from '@/shared/lib';

export const App = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayISO());

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBookingsQuery(selectedDate);

  const modalState = useBookingModalState();
  const {
    isFormSubmitting,
    isDeleting,
    deleteErrorMessage,
    handleFormSubmit,
    handleDeleteConfirm,
    handleDeleteClose,
  } = useBookingActions({ selectedDate, modalState });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 py-5 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Бронирование переговорной
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Сервис резервирования переговорной комнаты • 09:00–18:00
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Date Selector Widget */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onOpenCreateModal={() => modalState.openCreate()}
        />

        {/* Day Schedule Widget */}
        <DaySchedule
          date={selectedDate}
          bookings={bookings}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          onSelectSlot={(startTime) => modalState.openCreate(startTime)}
          onEditBooking={(booking) => modalState.openEdit(booking)}
          onDeleteBooking={(booking) => modalState.openDelete(booking)}
          onOpenCreateModal={() => modalState.openCreate()}
        />

        {/* Booking Form Modal (Create / Edit) */}
        {modalState.isFormOpen && (
          <BookingFormModal
            isOpen={modalState.isFormOpen}
            onClose={modalState.closeForm}
            date={selectedDate}
            existingBookings={bookings}
            initialData={modalState.editingBooking}
            prefilledStartTime={modalState.prefilledStartTime}
            isSubmitting={isFormSubmitting}
            serverError={modalState.serverError}
            onSubmit={handleFormSubmit}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={modalState.isDeleteOpen}
          booking={modalState.bookingToDelete}
          isLoading={isDeleting}
          error={deleteErrorMessage}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
        />
      </main>
    </div>
  );
};

export default App;
