-- 20260404100000_crm_soft_delete_maintenance.sql
-- Добавление поддержки Soft Delete для таблиц CRM (Deals & Tasks)

-- 1. Добавление колонки deleted_at в zone_deals
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_deals' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.zone_deals ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Добавление колонки deleted_at в zone_tasks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_tasks' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.zone_tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Оптимизация индексов для фильтрации активных записей
CREATE INDEX IF NOT EXISTS idx_zone_deals_active ON public.zone_deals (zone_id, created_at DESC) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_zone_tasks_active ON public.zone_tasks (zone_id, created_at DESC) WHERE (deleted_at IS NULL);

-- 4. Обновление RLS политик (если они уже есть и используют * или захардкоженные фильтры)
-- Большинство политик используют USING(zone_id IN (...)), поэтому они продолжат работать.
-- Однако, если есть специфические политики, они могут потребовать обновления. 
-- По умолчанию PostgreSQL позволяет SELECT и UPDATE удаленных строк, если это не запрещено явно.
-- Мы полагаемся на фронтенд-фильтрацию (.is('deleted_at', null)), как это сделано для блоков.

COMMENT ON COLUMN public.zone_deals.deleted_at IS 'Timestamp of soft deletion. NULL if active.';
COMMENT ON COLUMN public.zone_tasks.deleted_at IS 'Timestamp of soft deletion. NULL if active.';
