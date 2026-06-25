CREATE TABLE IF NOT EXISTS public.page_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    niches TEXT[] DEFAULT '{}'::TEXT[],
    is_premium BOOLEAN DEFAULT FALSE,
    blocks JSONB[] NOT NULL DEFAULT '{}'::JSONB[],
    theme_settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active templates
CREATE POLICY "Anyone can view page templates"
    ON public.page_templates FOR SELECT
    USING (true);

-- Only admins can insert/update/delete (we will rely on a secure Edge Function or check for an admin flag)
CREATE POLICY "Only admins can modify page templates"
    ON public.page_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.page_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
