export const WORK_DAY_START = '09:00';
export const WORK_DAY_END = '18:00';

export const WORK_DAY_START_MINUTES = 9 * 60; // 540
export const WORK_DAY_END_MINUTES = 18 * 60; // 1080

export const MIN_BOOKING_DURATION_MINUTES = 30;
export const MAX_BOOKING_DURATION_MINUTES = 120; // 2 hours

export const TIME_STEP_MINUTES = 15;

export const MAX_TITLE_LENGTH = 60;

/**
 * Buffer in seconds for bookings on current day:
 * Slot must start at least 120 seconds (2 minutes) in the future.
 */
export const TODAY_BUFFER_SECONDS = 120;

