-- Phase 40.5: Hotfix Zenith Stability
-- Consolidated fix for Leads and Expert Insights

-- 1. Исправление таблицы LEADS
-- Добавляем недостающие колонки, которые ожидает фронтенд-код и хуки.
DO $$ 
BEGIN 
    -- user_id (владелец лида/эксперт)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'user_id') THEN
        ALTER TABLE public.leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- name (функциональное имя клиента)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name') THEN
        ALTER TABLE public.leads ADD COLUMN name TEXT;
    END IF;

    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
        ALTER TABLE public.leads ADD COLUMN email TEXT;
    END IF;

    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') THEN
        ALTER TABLE public.leads ADD COLUMN phone TEXT;
    END IF;

    -- source (откуда пришел лид)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source') THEN
        ALTER TABLE public.leads ADD COLUMN source TEXT DEFAULT 'form';
    END IF;

    -- metadata (JSONB для гибких данных)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'metadata') THEN
        ALTER TABLE public.leads ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- page_id и block_id (делаем необязательными для ручных лидов)
    ALTER TABLE public.leads ALTER COLUMN page_id DROP NOT NULL;
    ALTER TABLE public.leads ALTER COLUMN block_id DROP NOT NULL;
END $$;

-- Обновление политик RLS для leads (если user_id добавлен)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'user_id') THEN
        DROP POLICY IF EXISTS "Users can view leads for their pages" ON public.leads;
        DROP POLICY IF EXISTS "Users can update leads for their pages" ON public.leads;
        DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
        
        CREATE POLICY "Users can view own leads" ON public.leads
            FOR SELECT USING (auth.uid() = user_id OR EXISTS (
                SELECT 1 FROM public.pages WHERE pages.id = leads.page_id AND pages.user_id = auth.uid()
            ));

        CREATE POLICY "Users can update own leads" ON public.leads
            FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
                SELECT 1 FROM public.pages WHERE pages.id = leads.page_id AND pages.user_id = auth.uid()
            ));
    END IF;
END $$;


-- 2. Восстановление таблицы EXPERT_QUERIES (Fix 404)
CREATE TABLE IF NOT EXISTS public.expert_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    has_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.expert_queries ENABLE ROW LEVEL SECURITY;

-- Policies for expert_queries
DROP POLICY IF EXISTS "Public can insert queries" ON public.expert_queries;
CREATE POLICY "Public can insert queries" ON public.expert_queries
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can view their queries" ON public.expert_queries;
CREATE POLICY "Owners can view their queries" ON public.expert_queries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE public.pages.id = expert_queries.page_id
            AND public.pages.user_id = auth.uid()
        )
    );

-- Grant access
GRANT ALL ON public.expert_queries TO postgres;
GRANT ALL ON public.expert_queries TO service_role;
GRANT INSERT ON public.expert_queries TO anon;
GRANT INSERT ON public.expert_queries TO authenticated;
GRANT SELECT ON public.expert_queries TO authenticated;

-- Force Schema Cache Refresh (Hint for Supabase)
NOTIFY pgrst, 'reload schema';
