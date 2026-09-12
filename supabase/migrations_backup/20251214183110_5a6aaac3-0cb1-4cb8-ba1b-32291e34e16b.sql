-- Add niche column to pages table
ALTER TABLE public.pages 
ADD COLUMN niche text DEFAULT 'other';

-- Create index for niche filtering
CREATE INDEX idx_pages_niche ON public.pages(niche);

-- Update existing pages to have a default niche
UPDATE public.pages SET niche = 'other' WHERE niche IS NULL;