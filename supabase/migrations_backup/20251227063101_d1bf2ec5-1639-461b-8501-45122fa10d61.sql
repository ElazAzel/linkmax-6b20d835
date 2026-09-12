-- Drop the old constraint and add updated one with all block types
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (
  type = ANY (ARRAY[
    'profile'::text, 'link'::text, 'button'::text, 'text'::text, 'image'::text, 
    'video'::text, 'carousel'::text, 'product'::text, 'socials'::text, 
    'custom_code'::text, 'messenger'::text, 'form'::text, 'download'::text, 
    'newsletter'::text, 'testimonial'::text, 'scratch'::text, 'search'::text, 
    'map'::text, 'avatar'::text, 'separator'::text, 'catalog'::text, 
    'before_after'::text, 'faq'::text, 'countdown'::text, 'pricing'::text,
    'shoutout'::text, 'booking'::text
  ])
);