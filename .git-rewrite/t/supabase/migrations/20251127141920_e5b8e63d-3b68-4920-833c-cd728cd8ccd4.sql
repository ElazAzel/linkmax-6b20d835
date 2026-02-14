-- Update blocks_type_check constraint to include new block types: map, avatar, separator
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
CHECK (type IN (
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video', 
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download', 
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator'
));