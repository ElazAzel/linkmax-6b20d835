-- Разблокировка event_type в таблице analytics
-- Старое ограничение: CHECK (event_type IN ('view', 'click', 'share'))
-- Приложение использует кастомные типы: heatmap_clicks, session_end, landing_view, и т.д.
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;
