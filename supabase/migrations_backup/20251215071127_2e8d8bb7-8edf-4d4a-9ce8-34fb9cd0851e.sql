-- Add block_settings column to collaborations for managing which blocks to show
ALTER TABLE public.collaborations 
ADD COLUMN IF NOT EXISTS block_settings jsonb DEFAULT '{"requester_blocks": [], "target_blocks": [], "show_all": true}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.collaborations.block_settings IS 'Settings for which blocks to display on collab page: requester_blocks (array of block ids), target_blocks (array of block ids), show_all (boolean)';
