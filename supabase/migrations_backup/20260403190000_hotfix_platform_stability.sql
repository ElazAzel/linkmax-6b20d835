-- P2.10: Platform Stability Hotfix (Analytics + Profiles)

-- 1. Fix Analytics constraint (blocks activation/custom events)
-- The original constraint: CHECK (event_type IN ('view', 'click', 'share'))
-- We remove it to allow 'activation:wizard_started' and other future event types.
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;

-- 2. Add missing columns to User Profiles (Fixes 400 Bad Request on profile updates)
-- These columns are referenced in extended-types.ts and used by the frontend for tier/widget management.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'kaspi_widget_enabled') THEN
        ALTER TABLE public.user_profiles ADD COLUMN kaspi_widget_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'premium_tier') THEN
        ALTER TABLE public.user_profiles ADD COLUMN premium_tier TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'premium_expires_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'gcal_sync_enabled') THEN
        ALTER TABLE public.user_profiles ADD COLUMN gcal_sync_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
