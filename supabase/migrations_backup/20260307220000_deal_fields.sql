-- Добавляем поддержку кастомных полей для Сделок

-- 1. Таблица для конфигурации полей
CREATE TABLE IF NOT EXISTS public.zone_deal_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'select')),
    options JSONB, -- Для типа 'select'
    is_required BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_zone_deal_fields_zone_id ON public.zone_deal_fields(zone_id);

-- RLS
ALTER TABLE public.zone_deal_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal fields in their zones"
    ON public.zone_deal_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.zone_members
            WHERE zone_members.zone_id = zone_deal_fields.zone_id
            AND zone_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage deal fields in their zones"
    ON public.zone_deal_fields FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.zone_members
            WHERE zone_members.zone_id = zone_deal_fields.zone_id
            AND zone_members.user_id = auth.uid()
            AND zone_members.role IN ('owner', 'admin')
        )
    );

-- Триггер для updated_at
CREATE TRIGGER handle_updated_at_zone_deal_fields
    BEFORE UPDATE ON public.zone_deal_fields
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Добавление колонки в zone_deals
ALTER TABLE public.zone_deals
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Индекс для GIN поиска по JSONB
CREATE INDEX IF NOT EXISTS idx_zone_deals_custom_fields ON public.zone_deals USING GIN (custom_fields);
