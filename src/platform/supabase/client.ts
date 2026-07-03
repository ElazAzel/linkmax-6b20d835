// Re-export the single Supabase client instance to avoid multiple GoTrueClient
// instances sharing the same storage key (which caused undefined-behavior warnings).
import { supabase as _supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppDatabase } from './extended-types';

export const supabase = _supabase as unknown as SupabaseClient<AppDatabase>;
