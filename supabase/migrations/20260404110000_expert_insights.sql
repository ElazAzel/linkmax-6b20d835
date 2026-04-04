-- Phase 26: Expert Insights & Conversion Analytics
-- Create table for tracking DKE queries

CREATE TABLE IF NOT EXISTS public.expert_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    has_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.expert_queries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expert_queries' AND policyname = 'Public can insert queries'
    ) THEN
        CREATE POLICY "Public can insert queries" ON public.expert_queries
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expert_queries' AND policyname = 'Owners can view their queries'
    ) THEN
        CREATE POLICY "Owners can view their queries" ON public.expert_queries
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.pages
                    WHERE public.pages.id = expert_queries.page_id
                    AND public.pages.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_queries_page_id ON public.expert_queries(page_id);
CREATE INDEX IF NOT EXISTS idx_expert_queries_created_at ON public.expert_queries(created_at);

-- Grant access
GRANT ALL ON public.expert_queries TO postgres;
GRANT ALL ON public.expert_queries TO service_role;
GRANT INSERT ON public.expert_queries TO anon;
GRANT INSERT ON public.expert_queries TO authenticated;
GRANT SELECT ON public.expert_queries TO authenticated;
