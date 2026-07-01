-- ===== МАРКЕТПЛЕЙС ШАБЛОНОВ =====

-- Таблица пользовательских шаблонов
CREATE TABLE public.user_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Другое',
  preview_url TEXT,
  blocks JSONB NOT NULL,
  theme_settings JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_for_sale BOOLEAN NOT NULL DEFAULT false,
  price INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'KZT',
  downloads_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Покупки шаблонов
CREATE TABLE public.template_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.user_templates(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KZT',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Лайки шаблонов
CREATE TABLE public.template_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.user_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

-- RLS для user_templates
CREATE POLICY "Users can view public templates"
ON public.user_templates FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view own templates"
ON public.user_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
ON public.user_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.user_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.user_templates FOR DELETE
USING (auth.uid() = user_id);

-- RLS для template_purchases
CREATE POLICY "Users can view own purchases"
ON public.template_purchases FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create purchases"
ON public.template_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- RLS для template_likes
CREATE POLICY "Anyone can view template likes"
ON public.template_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like templates"
ON public.template_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.template_likes FOR DELETE
USING (auth.uid() = user_id);

-- Функция для лайка шаблона
CREATE OR REPLACE FUNCTION public.like_template(p_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.template_likes (template_id, user_id)
  VALUES (p_template_id, auth.uid())
  ON CONFLICT DO NOTHING;
  
  UPDATE public.user_templates
  SET likes_count = likes_count + 1
  WHERE id = p_template_id;
END;
$$;

-- Функция для покупки шаблона
CREATE OR REPLACE FUNCTION public.purchase_template(p_template_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_purchase_id UUID;
BEGIN
  -- Получаем информацию о шаблоне
  SELECT * INTO v_template FROM public.user_templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template not found');
  END IF;
  
  IF NOT v_template.is_for_sale THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template is not for sale');
  END IF;
  
  IF v_template.user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase own template');
  END IF;
  
  -- Проверяем, не куплен ли уже
  IF EXISTS (SELECT 1 FROM public.template_purchases WHERE template_id = p_template_id AND buyer_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', true, 'already_purchased', true);
  END IF;
  
  -- Создаем запись о покупке
  INSERT INTO public.template_purchases (template_id, buyer_id, seller_id, price, currency)
  VALUES (p_template_id, auth.uid(), v_template.user_id, v_template.price, v_template.currency)
  RETURNING id INTO v_purchase_id;
  
  -- Увеличиваем счетчик скачиваний
  UPDATE public.user_templates
  SET downloads_count = downloads_count + 1
  WHERE id = p_template_id;
  
  RETURN jsonb_build_object('success', true, 'purchase_id', v_purchase_id);
END;
$$;

-- Trigger для updated_at
CREATE TRIGGER update_user_templates_updated_at
BEFORE UPDATE ON public.user_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();