-- Change default trial period from 7 days to 2 days
ALTER TABLE public.user_profiles 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + '2 days'::interval);