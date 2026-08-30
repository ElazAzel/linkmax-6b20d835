-- Create orders table for payment tracking
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'KZT' NOT NULL,
    provider TEXT NOT NULL, -- 'kaspi', 'robokassa', 'stripe'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    external_id TEXT, -- ID from the payment provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own orders (orders linked to zones they manage)
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.zone_members
            WHERE zone_id = public.orders.zone_id
            AND user_id = auth.uid()
        )
    );

-- Only service role or admins can update status directly
-- (In production, status is updated via secure Edge Function webhooks)
CREATE POLICY "Only admins/service can manage orders"
    ON public.orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
