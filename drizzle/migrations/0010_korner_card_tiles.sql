-- Korner-style "card" and "tiles" blocks. Keep every existing value.
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type = ANY (ARRAY[
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video',
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download',
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator',
  'catalog', 'before_after', 'faq', 'countdown', 'pricing', 'shoutout',
  'booking', 'community', 'event', 'audio', 'card', 'tiles'
]));