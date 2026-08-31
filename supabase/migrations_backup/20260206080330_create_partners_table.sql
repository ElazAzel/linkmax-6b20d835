-- Create partners table for landing page partner logos
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Partners are viewable by everyone"
  ON public.partners
  FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Partners are editable by admins only"
  ON public.partners
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users)
  );

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_partners_sort_order ON public.partners(sort_order);
CREATE INDEX IF NOT EXISTS idx_partners_active ON public.partners(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Insert 10 placeholder partners
INSERT INTO public.partners (name, logo_url, sort_order) VALUES
  ('Partner 1', 'https://via.placeholder.com/200x80/1a1a2e/ffffff?text=Partner+1', 1),
  ('Partner 2', 'https://via.placeholder.com/200x80/16213e/ffffff?text=Partner+2', 2),
  ('Partner 3', 'https://via.placeholder.com/200x80/0f3460/ffffff?text=Partner+3', 3),
  ('Partner 4', 'https://via.placeholder.com/200x80/533483/ffffff?text=Partner+4', 4),
  ('Partner 5', 'https://via.placeholder.com/200x80/e94560/ffffff?text=Partner+5', 5),
  ('Partner 6', 'https://via.placeholder.com/200x80/1a1a2e/ffffff?text=Partner+6', 6),
  ('Partner 7', 'https://via.placeholder.com/200x80/16213e/ffffff?text=Partner+7', 7),
  ('Partner 8', 'https://via.placeholder.com/200x80/0f3460/ffffff?text=Partner+8', 8),
  ('Partner 9', 'https://via.placeholder.com/200x80/533483/ffffff?text=Partner+9', 9),
  ('Partner 10', 'https://via.placeholder.com/200x80/e94560/ffffff?text=Partner+10', 10);
