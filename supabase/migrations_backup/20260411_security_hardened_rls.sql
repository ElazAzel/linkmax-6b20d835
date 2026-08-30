-- ==============================================
-- LinkMAX Security Hardening — 2026-04-11
-- Addresses points 9, 10, and 11 of the audit
-- ==============================================

-- 1. Ensure Robust Role Checking Functions
-- This handles Point 10 by providing a centralized way to check admin rights
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = p_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role(p_user_id, 'admin');
END;
$$;

-- 2. Booking Privacy Hardening (Point 9)
-- Restrict visibility of sensitive customer data in bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean state
DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;
DROP POLICY IF EXISTS "Owners can view all their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

-- Policy: Owners can see everything in their own bookings
CREATE POLICY "Owners can manage their bookings"
ON public.bookings FOR ALL
TO authenticated
USING (auth.uid() = owner_id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- Policy: Customers can see ONLY their own bookings (but not others')
CREATE POLICY "Customers can view their own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Double-Booking Protection (Point 11)
-- Ensure unique index covers the logical booking slot
-- Use EXCLUDE or UNIQUE INDEX to prevent overlap
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_uniqueness_guard') THEN
        CREATE UNIQUE INDEX idx_bookings_uniqueness_guard 
        ON public.bookings (owner_id, slot_date, slot_time) 
        WHERE status NOT IN ('cancelled', 'rejected');
    END IF;
END $$;

-- 4. Booking Logic Improvements (Point 11)
-- Add missing columns for timezone and status management if they don't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 5. Hardened Admin Role Assignment for Ilyas
-- (User confirmed: ilyasazelkhanov@gmail.com is the admin)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ilyasazelkhanov@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
