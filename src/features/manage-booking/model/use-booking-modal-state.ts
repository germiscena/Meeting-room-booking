import { useState, useCallback } from 'react';
import type { Booking } from '@/entities/booking';

export function useBookingModalState() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [prefilledStartTime, setPrefilledStartTime] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  const openCreate = useCallback((startTime?: string) => {
    setEditingBooking(null);
    setPrefilledStartTime(startTime);
    setServerError(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((booking: Booking) => {
    setEditingBooking(booking);
    setPrefilledStartTime(undefined);
    setServerError(null);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingBooking(null);
    setPrefilledStartTime(undefined);
    setServerError(null);
  }, []);

  const openDelete = useCallback((booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setBookingToDelete(null);
  }, []);

  return {
    isFormOpen,
    editingBooking,
    prefilledStartTime,
    serverError,
    setServerError,
    openCreate,
    openEdit,
    closeForm,

    isDeleteOpen,
    bookingToDelete,
    openDelete,
    closeDelete,
  };
}
