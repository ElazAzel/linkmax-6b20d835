
-- Удаляем дубликатный индекс
DROP INDEX IF EXISTS idx_blocks_position;

-- Создаём триггер для автоматического создания профиля при регистрации
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Добавляем индекс для private_page_data по page_id (ускоряет JOIN)
CREATE INDEX IF NOT EXISTS idx_private_page_data_page_id ON public.private_page_data(page_id);

-- Создаём функцию для атомарного сохранения блоков (транзакционно)
CREATE OR REPLACE FUNCTION public.save_page_blocks(
  p_page_id uuid,
  p_blocks jsonb,
  p_is_premium boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Удаляем старые блоки
  DELETE FROM public.blocks WHERE page_id = p_page_id;
  
  -- Вставляем новые блоки
  INSERT INTO public.blocks (page_id, type, position, title, content, style, is_premium, schedule, click_count)
  SELECT 
    p_page_id,
    (block->>'type')::text,
    (block->>'position')::integer,
    block->>'title',
    block->'content',
    COALESCE(block->'style', '{}'::jsonb),
    p_is_premium,
    block->'schedule',
    0
  FROM jsonb_array_elements(p_blocks) AS block;
END;
$$;

-- Создаём функцию для безопасного upsert страницы
CREATE OR REPLACE FUNCTION public.upsert_user_page(
  p_user_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_avatar_url text,
  p_avatar_style jsonb,
  p_theme_settings jsonb,
  p_seo_meta jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id uuid;
BEGIN
  -- Пытаемся найти существующую страницу
  SELECT id INTO v_page_id FROM public.pages WHERE user_id = p_user_id;
  
  IF v_page_id IS NULL THEN
    -- Создаём новую страницу
    INSERT INTO public.pages (user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published)
    VALUES (p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style, p_theme_settings, p_seo_meta, false)
    RETURNING id INTO v_page_id;
  ELSE
    -- Обновляем существующую
    UPDATE public.pages
    SET 
      slug = p_slug,
      title = p_title,
      description = p_description,
      avatar_url = p_avatar_url,
      avatar_style = p_avatar_style,
      theme_settings = p_theme_settings,
      seo_meta = p_seo_meta,
      updated_at = now()
    WHERE id = v_page_id;
  END IF;
  
  RETURN v_page_id;
END;
$$;
