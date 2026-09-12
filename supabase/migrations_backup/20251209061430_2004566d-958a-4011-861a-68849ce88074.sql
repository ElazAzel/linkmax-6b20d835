-- Drop the existing blocks_type_check constraint
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

-- Add updated constraint with all block types
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (
  type IN (
    'profile',
    'link',
    'button',
    'text',
    'image',
    'video',
    'carousel',
    'product',
    'socials',
    'custom_code',
    'messenger',
    'form',
    'download',
    'newsletter',
    'testimonial',
    'scratch',
    'search',
    'map',
    'avatar',
    'separator',
    'catalog',
    'before_after',
    'faq',
    'countdown',
    'pricing'
  )
);