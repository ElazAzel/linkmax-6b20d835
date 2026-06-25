-- Drop old constraint and add updated one with 'community' type
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video', 
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download', 
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator', 
  'catalog', 'before_after', 'faq', 'countdown', 'pricing', 'shoutout', 
  'booking', 'community'
));