-- Phase 16: Absolute Double-Booking Protection
-- Partial unique index to prevent duplicate confirmed/pending bookings on the same slot
-- This ensures that even if two requests come simultaneously, the database will reject the second one.

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_booking 
ON public.bookings (page_id, block_id, slot_date, slot_time) 
WHERE status NOT IN ('cancelled', 'rejected');
