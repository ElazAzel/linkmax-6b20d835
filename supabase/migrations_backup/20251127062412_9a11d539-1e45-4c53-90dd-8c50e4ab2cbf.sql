-- Update blocks table to support new block types
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

ALTER TABLE public.blocks 
ADD CONSTRAINT blocks_type_check 
CHECK (type IN ('profile', 'link', 'text', 'product', 'video', 'carousel', 'custom_code', 'search'));

-- Add comment explaining premium blocks
COMMENT ON COLUMN public.blocks.is_premium IS 'Indicates if this block requires premium subscription. Video embeds, carousels, and custom code are premium features.';