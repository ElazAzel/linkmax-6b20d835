
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.bookings.payment_status IS 'none, pending, paid, refunded';
COMMENT ON COLUMN public.bookings.payment_method IS 'whatsapp, kaspi, robokassa';
