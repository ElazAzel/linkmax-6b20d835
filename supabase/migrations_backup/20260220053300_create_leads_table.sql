-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    block_id TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived', 'spam')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_leads_page_id ON public.leads(page_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Page owners can view their leads
CREATE POLICY "Users can view leads for their pages"
    ON public.leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE pages.id = leads.page_id
            AND pages.user_id = auth.uid()
        )
    );

-- Page owners can update their leads (e.g. status)
CREATE POLICY "Users can update leads for their pages"
    ON public.leads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE pages.id = leads.page_id
            AND pages.user_id = auth.uid()
        )
    );

-- Anyone can insert a lead (via edge function or public API if RLS bypassed)
-- Best practice: Edge function uses Service Role. If using anon client, allow inserts.
CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at_leads()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_leads();
