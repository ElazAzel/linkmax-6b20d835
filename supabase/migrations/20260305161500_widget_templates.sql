-- Create widget_templates table
CREATE TABLE IF NOT EXISTS public.widget_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ru TEXT,
    category TEXT NOT NULL CHECK (category IN ('games', 'calculators', 'timers', 'engagement', 'business', 'social')),
    description TEXT,
    description_ru TEXT,
    icon TEXT,
    html TEXT NOT NULL,
    css TEXT,
    javascript TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.widget_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view widget templates"
    ON public.widget_templates FOR SELECT
    USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify widget templates"
    ON public.widget_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_widgets BEFORE UPDATE ON public.widget_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
