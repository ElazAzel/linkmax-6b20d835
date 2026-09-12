-- Add performance indexes for frequently queried columns

-- Pages table indexes
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON public.pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_user_published ON public.pages(user_id, is_published);

-- Blocks table indexes
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON public.blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page_position ON public.blocks(page_id, position);

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Lead interactions indexes
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON public.lead_interactions(user_id);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_page_id ON public.analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at DESC);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username) WHERE username IS NOT NULL;

-- Rate limits indexes (for cleanup)
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint);