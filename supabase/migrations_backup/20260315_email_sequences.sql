-- SQL Migration for Email Sequences
-- Created: 2026-03-15

-- 1. Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Email Sequences
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sequence Steps
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id),
    delay_hours INTEGER DEFAULT 24,
    step_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Lead Sequence Subscriptions
CREATE TABLE IF NOT EXISTS public.lead_sequence_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    current_step_id UUID REFERENCES public.email_sequence_steps(id),
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
    next_run_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    lead_id UUID REFERENCES public.leads(id),
    template_id UUID REFERENCES public.email_templates(id),
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sequence_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified - users can only see their own data)
CREATE POLICY "Users can manage their own templates" ON public.email_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sequences" ON public.email_sequences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage steps of their own sequences" ON public.email_sequence_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.email_sequences 
            WHERE id = sequence_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage subscriptions of their leads" ON public.lead_sequence_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE id = lead_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR ALL USING (auth.uid() = user_id);
