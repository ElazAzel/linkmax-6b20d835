-- Add schedule column to blocks table for time-based visibility
ALTER TABLE public.blocks
ADD COLUMN schedule jsonb DEFAULT NULL;