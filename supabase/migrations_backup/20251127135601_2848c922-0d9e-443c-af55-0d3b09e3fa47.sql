-- Drop the old constraint
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

-- Add new constraint with all block types
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check 
CHECK (type = ANY (ARRAY[
  'profile'::text,
  'link'::text, 
  'text'::text,
  'image'::text,
  'product'::text,
  'video'::text,
  'carousel'::text,
  'button'::text,
  'socials'::text,
  'search'::text,
  'custom-code'::text,
  'messenger'::text,
  'form'::text,
  'download'::text,
  'newsletter'::text,
  'testimonial'::text,
  'scratch'::text
]));