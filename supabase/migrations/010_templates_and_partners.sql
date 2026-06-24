BEGIN;

-- ==============================================
-- 010: TEMPLATES AND PARTNERS
-- ==============================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Tables

-- templates (text ID for legacy support)
CREATE TABLE IF NOT EXISTS public.templates (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  preview_image text,
  is_premium boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- page_templates
CREATE TABLE IF NOT EXISTS public.page_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    niches TEXT[] DEFAULT '{}'::TEXT[],
    is_premium BOOLEAN DEFAULT FALSE,
    blocks JSONB[] NOT NULL DEFAULT '{}'::JSONB[],
    theme_settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- user_templates (marketplace)
CREATE TABLE IF NOT EXISTS public.user_templates (
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

-- template_purchases
CREATE TABLE IF NOT EXISTS public.template_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.user_templates(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KZT',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- template_likes
CREATE TABLE IF NOT EXISTS public.template_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.user_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- partners
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'KZT' NOT NULL,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- widget_templates
CREATE TABLE IF NOT EXISTS public.widget_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ru TEXT,
    category TEXT NOT NULL CHECK (category IN ('games', 'calculators', 'timers', 'engagement', 'business', 'social')),
    description TEXT,
    description_ru TEXT,
    icon TEXT,
    html TEXT NOT NULL,
    css TEXT,
    javascript TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_templates ENABLE ROW LEVEL SECURITY;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_partners_sort_order ON public.partners(sort_order);
CREATE INDEX IF NOT EXISTS idx_partners_active ON public.partners(is_active);

-- 5. RLS Policies

-- templates
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.templates;
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON public.templates;
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON public.templates;
DROP POLICY IF EXISTS "Anyone can view public templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;

CREATE POLICY "Anyone can view public templates"
  ON public.templates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert templates"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- page_templates
DROP POLICY IF EXISTS "Anyone can view page templates" ON public.page_templates;
CREATE POLICY "Anyone can view page templates"
    ON public.page_templates FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify page templates" ON public.page_templates;
CREATE POLICY "Only admins can modify page templates"
    ON public.page_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- user_templates
DROP POLICY IF EXISTS "Users can view public templates" ON public.user_templates;
CREATE POLICY "Users can view public templates"
ON public.user_templates FOR SELECT
USING (is_public = true);

DROP POLICY IF EXISTS "Users can view own templates" ON public.user_templates;
CREATE POLICY "Users can view own templates"
ON public.user_templates FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create templates" ON public.user_templates;
CREATE POLICY "Users can create templates"
ON public.user_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.user_templates;
CREATE POLICY "Users can update own templates"
ON public.user_templates FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.user_templates;
CREATE POLICY "Users can delete own templates"
ON public.user_templates FOR DELETE
USING (auth.uid() = user_id);

-- template_purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.template_purchases;
CREATE POLICY "Users can view own purchases"
ON public.template_purchases FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create purchases" ON public.template_purchases;
CREATE POLICY "Users can create purchases"
ON public.template_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- template_likes
DROP POLICY IF EXISTS "Anyone can view template likes" ON public.template_likes;
CREATE POLICY "Anyone can view template likes"
ON public.template_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can like templates" ON public.template_likes;
CREATE POLICY "Users can like templates"
ON public.template_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON public.template_likes;
CREATE POLICY "Users can unlike"
ON public.template_likes FOR DELETE
USING (auth.uid() = user_id);

-- partners
DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Partners are viewable by everyone"
  ON public.partners
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Partners are editable by admins only" ON public.partners;
CREATE POLICY "Partners are editable by admins only"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.zone_members
            WHERE zone_id = public.orders.zone_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Only admins/service can manage orders" ON public.orders;
CREATE POLICY "Only admins/service can manage orders"
    ON public.orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- widget_templates
DROP POLICY IF EXISTS "Anyone can view widget templates" ON public.widget_templates;
CREATE POLICY "Anyone can view widget templates"
    ON public.widget_templates FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify widget templates" ON public.widget_templates;
CREATE POLICY "Only admins can modify widget templates"
    ON public.widget_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- 6. Triggers

-- templates updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON public.templates;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- page_templates updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.page_templates;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.page_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- user_templates updated_at
DROP TRIGGER IF EXISTS update_user_templates_updated_at ON public.user_templates;
CREATE TRIGGER update_user_templates_updated_at
BEFORE UPDATE ON public.user_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- partners updated_at
CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partners_updated_at();

-- orders updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.orders;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- widget_templates updated_at
DROP TRIGGER IF EXISTS handle_updated_at_widgets ON public.widget_templates;
CREATE TRIGGER handle_updated_at_widgets BEFORE UPDATE ON public.widget_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Functions

-- like_template
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

-- purchase_template
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

  IF EXISTS (SELECT 1 FROM public.template_purchases WHERE template_id = p_template_id AND buyer_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', true, 'already_purchased', true);
  END IF;

  INSERT INTO public.template_purchases (template_id, buyer_id, seller_id, price, currency)
  VALUES (p_template_id, auth.uid(), v_template.user_id, v_template.price, v_template.currency)
  RETURNING id INTO v_purchase_id;

  UPDATE public.user_templates
  SET downloads_count = downloads_count + 1
  WHERE id = p_template_id;

  RETURN jsonb_build_object('success', true, 'purchase_id', v_purchase_id);
END;
$$;

-- 8. Seeds

-- Seed partners
INSERT INTO public.partners (name, logo_url, sort_order) VALUES
  ('Partner 1', 'https://via.placeholder.com/200x80/1a1a2e/ffffff?text=Partner+1', 1),
  ('Partner 2', 'https://via.placeholder.com/200x80/16213e/ffffff?text=Partner+2', 2),
  ('Partner 3', 'https://via.placeholder.com/200x80/0f3460/ffffff?text=Partner+3', 3),
  ('Partner 4', 'https://via.placeholder.com/200x80/533483/ffffff?text=Partner+4', 4),
  ('Partner 5', 'https://via.placeholder.com/200x80/e94560/ffffff?text=Partner+5', 5),
  ('Partner 6', 'https://via.placeholder.com/200x80/1a1a2e/ffffff?text=Partner+6', 6),
  ('Partner 7', 'https://via.placeholder.com/200x80/16213e/ffffff?text=Partner+7', 7),
  ('Partner 8', 'https://via.placeholder.com/200x80/0f3460/ffffff?text=Partner+8', 8),
  ('Partner 9', 'https://via.placeholder.com/200x80/533483/ffffff?text=Partner+9', 9),
  ('Partner 10', 'https://via.placeholder.com/200x80/e94560/ffffff?text=Partner+10', 10)
ON CONFLICT DO NOTHING;

-- Seed templates (legacy text IDs)
INSERT INTO public.templates (id, name, description, category, preview_image, is_premium, blocks) VALUES
('personal', 'Личная страница', 'Простая страница со ссылками для всех', 'other', '👤', false,
'[
  {"type": "profile", "overrides": {"name": {"ru": "Ваше имя", "en": "Your Name", "kk": "Сіздің атыңыз"}, "bio": {"ru": "✨ Расскажите о себе\n📍 Ваш город\n💼 Чем занимаетесь", "en": "✨ Tell about yourself\n📍 Your city\n💼 What you do", "kk": "✨ Өзіңіз туралы айтыңыз\n📍 Сіздің қалаңыз\n💼 Не істейсіз"}}},
  {"type": "link", "overrides": {"title": {"ru": "📱 Instagram", "en": "📱 Instagram", "kk": "📱 Instagram"}, "url": "https://instagram.com/", "icon": "instagram", "style": "rounded"}},
  {"type": "link", "overrides": {"title": {"ru": "💬 Telegram", "en": "💬 Telegram", "kk": "💬 Telegram"}, "url": "https://t.me/", "icon": "globe", "style": "rounded"}},
  {"type": "link", "overrides": {"title": {"ru": "🎬 YouTube", "en": "🎬 YouTube", "kk": "🎬 YouTube"}, "url": "https://youtube.com/", "icon": "youtube", "style": "rounded"}},
  {"type": "link", "overrides": {"title": {"ru": "🔗 Ваша ссылка", "en": "🔗 Your link", "kk": "🔗 Сіздің сілтемеңіз"}, "url": "https://example.com", "icon": "link", "style": "rounded"}},
  {"type": "socials", "overrides": {"platforms": [{"platform": "instagram", "url": "https://instagram.com/"}, {"platform": "telegram", "url": "https://t.me/"}, {"platform": "tiktok", "url": "https://tiktok.com/"}]}}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, blocks = EXCLUDED.blocks;

INSERT INTO public.templates (id, name, description, category, preview_image, is_premium, blocks) VALUES
('agency', 'Digital Агентство', 'Премиум дизайн, анимации, кейсы и команда', 'business', '🏆', true,
'[
  {"type": "profile", "overrides": {"name": {"ru": "EAGLE AGENCY", "en": "EAGLE AGENCY", "kk": "EAGLE AGENCY"}, "bio": {"ru": "🚀 Digital-агентство полного цикла\n💻 Web • Mobile • Branding • Marketing\n🏆 Золото Tagline 2023", "en": "🚀 Full cycle digital agency\n💻 Web • Mobile • Branding • Marketing\n🏆 Tagline Gold 2023", "kk": "🚀 Толық циклді digital-агенттік\n💻 Web • Mobile • Branding • Marketing\n🏆 Tagline 2023 Алтын"}}},
  {"type": "video", "overrides": {"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": {"ru": "🎬 Наш шоурил 2024", "en": "🎬 Our showreel 2024", "kk": "🎬 Біздің шоурил 2024"}}},
  {"type": "text", "overrides": {"content": {"ru": "🏆 Почему мы?", "en": "🏆 Why us?", "kk": "🏆 Неге біз?"}, "style": "heading", "alignment": "center"}},
  {"type": "messenger", "overrides": {"messengers": [{"platform": "telegram", "username": "eagle_agency_ceo"}, {"platform": "email", "username": "hello@eagle.agency"}]}}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, blocks = EXCLUDED.blocks;

INSERT INTO public.templates (id, name, description, category, preview_image, is_premium, blocks) VALUES
('influencer', 'Блогер / Инфлюенсер', 'Для контент-мейкеров и блогеров — полный набор', 'creators', '👤', false,
'[
  {"type": "profile", "overrides": {"name": {"ru": "Алина Lifestyle", "en": "Alina Lifestyle", "kk": "Алина Lifestyle"}, "bio": {"ru": "✨ Блогер • 500K подписчиков\n🎥 Влоги о путешествиях и моде\n📍 Алматы → Мир", "en": "✨ Blogger • 500K followers\n🎥 Travel & fashion vlogs\n📍 Almaty → World", "kk": "✨ Блогер • 500K жазылушы\n🎥 Саяхат және сән влогтары\n📍 Алматы → Әлем"}}},
  {"type": "link", "overrides": {"title": {"ru": "🎬 YouTube — новые влоги каждую неделю", "en": "🎬 YouTube — new vlogs weekly", "kk": "🎬 YouTube — жаңа влогтар апта сайын"}, "url": "https://youtube.com/@example", "icon": "youtube", "style": "rounded"}},
  {"type": "link", "overrides": {"title": {"ru": "📸 Instagram — бэкстейдж и stories", "en": "📸 Instagram — backstage & stories", "kk": "📸 Instagram — бэкстейдж және stories"}, "url": "https://instagram.com/example", "icon": "instagram", "style": "rounded"}}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, blocks = EXCLUDED.blocks;

INSERT INTO public.templates (id, name, description, category, preview_image, is_premium, blocks) VALUES
('barber', 'Барбершоп', 'Полный шаблон для барберов — прайс, галерея, запись', 'business', '💈', false,
'[
  {"type": "profile", "overrides": {"name": {"ru": "BLACKBEARD Barbershop", "en": "BLACKBEARD Barbershop", "kk": "BLACKBEARD Barbershop"}, "bio": {"ru": "✂️ Мужские стрижки в центре Алматы\n🏆 Лучший барбершоп 2023 по версии 2GIS\n⭐ 4.9 рейтинг • 500+ отзывов", "en": "✂️ Men''s haircuts in Almaty center\n🏆 Best barbershop 2023 by 2GIS\n⭐ 4.9 rating • 500+ reviews", "kk": "✂️ Алматы орталығында ерлер шаш қию\n🏆 2GIS бойынша 2023 үздік барбершоп\n⭐ 4.9 рейтинг • 500+ пікір"}}},
  {"type": "text", "overrides": {"content": {"ru": "⏰ Режим работы: Пн-Вс 10:00 - 21:00", "en": "⏰ Working hours: Mon-Sun 10:00 - 21:00", "kk": "⏰ Жұмыс уақыты: Дс-Жс 10:00 - 21:00"}, "style": "paragraph", "alignment": "center"}},
  {"type": "link", "overrides": {"title": {"ru": "📅 ЗАПИСАТЬСЯ ОНЛАЙН", "en": "📅 BOOK ONLINE", "kk": "📅 ОНЛАЙН ЖАЗЫЛУ"}, "url": "https://dikidi.net/blackbeard", "icon": "calendar", "style": "pill"}}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, blocks = EXCLUDED.blocks;

-- Seed page templates batch 1-5
INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES
('musician', 'Музыкант / Артист', 'Для музыкантов и исполнителей — концерты, музыка, мерч', 'creators',
'[
  {"type": "profile", "overrides": {"name": {"ru": "ARMAN", "en": "ARMAN", "kk": "ARMAN"}, "bio": {"ru": "🎤 Хип-хоп артист\n🏆 Лучший альбом 2023\n🎧 5M+ прослушиваний", "en": "🎤 Hip-hop artist\n🏆 Best Album 2023\n🎧 5M+ streams", "kk": "🎤 Хип-хоп әртіс\n🏆 2023 үздік альбом\n🎧 5M+ тыңдау"}}},
  {"type": "video", "overrides": {"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": {"ru": "🔥 Премьера клипа \"Жизнь\"", "en": "🔥 Music video premiere \"Life\"", "kk": "🔥 \"Өмір\" клипінің премьерасы"}}},
  {"type": "link", "overrides": {"title": {"ru": "🎧 Spotify — слушать новый альбом", "en": "🎧 Spotify — listen new album", "kk": "🎧 Spotify — жаңа альбомды тыңдау"}, "url": "https://open.spotify.com/artist/example", "icon": "globe", "style": "pill"}}
]'::jsonb,
'🎵', false, true, 2),
('designer', 'Дизайнер / Иллюстратор', 'Портфолио для творческих специалистов с примерами работ', 'creators',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Дария Ким", "en": "Dariya Kim", "kk": "Дария Ким"}}},
  {"type": "carousel", "overrides": {"title": {"ru": "🖼 Избранные работы", "en": "🖼 Featured works", "kk": "🖼 Таңдаулы жұмыстар"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Логотип", "en": "Logo", "kk": "Логотип"}, "price": 80000, "currency": "KZT"}]}}
]'::jsonb,
'🎨', false, true, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  blocks = EXCLUDED.blocks, preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium, is_public = EXCLUDED.is_public, sort_order = EXCLUDED.sort_order;

INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES
('streamer', 'Стример / Геймер', 'Для стримеров и киберспортсменов', 'creators',
'[
  {"type": "profile", "overrides": {"name": {"ru": "DarkNight", "en": "DarkNight", "kk": "DarkNight"}, "bio": {"ru": "🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримы: ПН-ПТ 20:00", "en": "🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Streams: MON-FRI 8PM", "kk": "🎮 Twitch Partner • 100K жазылушы\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримдер: ДС-ЖМ 20:00"}}},
  {"type": "link", "overrides": {"title": {"ru": "🟣 Twitch — смотреть стрим LIVE", "en": "🟣 Twitch — watch stream LIVE", "kk": "🟣 Twitch — LIVE стримді қарау"}, "url": "https://twitch.tv/darknight", "icon": "globe", "style": "pill"}}
]'::jsonb,
'🎮', false, true, 5),
('photographer', 'Фотограф', 'Полное портфолио — пакеты услуг, галерея, отзывы', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Анна Фото", "en": "Anna Photo"}}},
  {"type": "carousel", "overrides": {"title": {"ru": "📷 Портфолио"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Портрет"}, "price": 35000, "currency": "KZT"}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Асель и Арман"}, "text": {"ru": "Анна — волшебница!"}, "rating": 5}]}}
]'::jsonb,
'📷', false, true, 7),
('beauty', 'Салон красоты', 'Для салонов и бьюти-мастеров — полный прайс с бронированием', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "GLOW Beauty Studio"}}},
  {"type": "link", "overrides": {"title": {"ru": "📅 ЗАПИСАТЬСЯ ОНЛАЙН"}, "url": "https://dikidi.net/glow", "icon": "calendar", "style": "pill"}},
  {"type": "carousel", "overrides": {"title": {"ru": "✨ Наши работы"}}},
  {"type": "product", "overrides": {"name": {"ru": "Маникюр с покрытием"}, "price": 6000, "currency": "KZT"}}
]'::jsonb,
'💅', false, true, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  blocks = EXCLUDED.blocks, preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium, is_public = EXCLUDED.is_public, sort_order = EXCLUDED.sort_order;

INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES
('fitness', 'Фитнес-тренер', 'Для тренеров — программы, результаты, онлайн-курсы', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Артём Fitness", "en": "Artem Fitness", "kk": "Артём Fitness"}, "bio": {"ru": "💪 Сертифицированный тренер\n🏆 Мастер спорта • 8 лет опыта\n🔥 1000+ клиентов • 50 000 кг сброшено\n📍 World Class Almaty + Онлайн", "en": "💪 Certified trainer\n🏆 Master of Sports • 8 years exp\n🔥 1000+ clients • 50,000 kg lost\n📍 World Class Almaty + Online", "kk": "💪 Сертификатталған жаттықтырушы\n🏆 Спорт шебері • 8 жыл тәжірибе\n🔥 1000+ клиент • 50 000 кг тасталды\n📍 World Class Almaty + Онлайн"}}},
  {"type": "carousel", "overrides": {"title": {"ru": "🏆 Трансформации клиентов"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Абонемент"}, "price": 64000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Мадина"}, "text": {"ru": "За 3 месяца с Артёмом сбросила 15 кг!"}, "rating": 5}]}}
]'::jsonb,
'💪', false, true, 9),
('chef', 'Повар / Кондитер', 'Для кулинаров — меню, цены, доставка, FAQ', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Sweet Dreams"}, "bio": {"ru": "🍰 Торты и десерты на заказ\n✨ 100% натуральные ингредиенты\n🚗 Доставка по Алматы"}}},
  {"type": "product", "overrides": {"name": {"ru": "Бенто-торт"}, "price": 6000, "currency": "KZT"}},
  {"type": "product", "overrides": {"name": {"ru": "Торт на заказ (1 кг)"}, "price": 9000, "currency": "KZT"}},
  {"type": "faq", "overrides": {"items": [{"question": {"ru": "За сколько дней делать заказ?"}, "answer": {"ru": "Бенто-торты — за 1 день, торты от 2 кг — за 2-3 дня."}}]}}
]'::jsonb,
'👨‍🍳', false, true, 10),
('shop', 'Онлайн-магазин', 'Мини-витрина товаров с каталогом и доставкой', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "TREND Store"}, "bio": {"ru": "🛍️ Модная одежда из Кореи и Турции\n✈️ Доставка по Казахстану 1-3 дня"}}},
  {"type": "catalog", "overrides": {"title": {"ru": "👗 Каталог"}}},
  {"type": "faq", "overrides": {"items": [{"question": {"ru": "Как оплатить?"}, "answer": {"ru": "Kaspi перевод, Kaspi QR, наличные курьеру"}}]}}
]'::jsonb,
'🛍️', false, true, 11),
('realestate', 'Риелтор', 'Для агентов недвижимости — объекты, услуги, консультация', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Айгуль Риелтор"}, "bio": {"ru": "🏠 Риелтор • 10 лет на рынке\n🔑 500+ успешных сделок"}}},
  {"type": "carousel", "overrides": {"title": {"ru": "🏠 Актуальные объекты"}}},
  {"type": "product", "overrides": {"name": {"ru": "3-комн. квартира, Достык"}, "price": 85000000, "currency": "KZT"}},
  {"type": "messenger", "overrides": {"messengers": [{"platform": "whatsapp", "username": "+77011234567"}]}}
]'::jsonb,
'🏠', false, true, 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  blocks = EXCLUDED.blocks, preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium, is_public = EXCLUDED.is_public, sort_order = EXCLUDED.sort_order;

INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES
('wedding', 'Свадебные услуги', 'Для организаторов свадеб, ведущих, декораторов', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Wedding Dream"}, "bio": {"ru": "💍 Организация свадеб под ключ\n✨ 7 лет • 300+ свадеб"}}},
  {"type": "video", "overrides": {"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": {"ru": "🎬 Showreel 2024 — Наши свадьбы"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Полный пакет"}, "price": 500000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Асель и Арман"}, "text": {"ru": "Свадьба нашей мечты!"}, "rating": 5}]}}
]'::jsonb,
'💒', false, true, 13),
('psychologist', 'Психолог', 'Для психологов и терапевтов — полный профиль с записью', 'experts',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Айгерим Нурланова"}, "bio": {"ru": "🎓 Клинический психолог • КазНУ\n💼 12 лет практики • 3000+ клиентов"}}},
  {"type": "text", "overrides": {"content": {"ru": "💬 Каждый заслуживает быть услышанным и понятым"}, "style": "quote"}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Пакет 4 сессии"}, "price": 61200, "currency": "KZT", "isPopular": true}]}},
  {"type": "faq", "overrides": {"items": [{"question": {"ru": "Как проходит первая сессия?"}, "answer": {"ru": "Мы знакомимся, вы рассказываете о себе и запросе."}}]}}
]'::jsonb,
'🧠', false, true, 14),
('teacher', 'Репетитор', 'Для преподавателей — курсы, результаты, материалы', 'experts',
'[
  {"type": "profile", "overrides": {"name": {"ru": "English with Kate"}, "bio": {"ru": "🇬🇧 Преподаватель английского\n🎓 IELTS 8.5 • CELTA certified"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "IELTS Intensive"}, "price": 80000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Данияр"}, "text": {"ru": "Поднял балл с 6.0 до 7.5!"}, "rating": 5}]}}
]'::jsonb,
'📚', false, true, 15),
('marketer', 'SMM / Маркетолог', 'Для digital-специалистов — кейсы, услуги, результаты', 'experts',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Тимур Digital"}, "bio": {"ru": "📈 SMM-маркетолог • Таргетолог\n🏆 100+ проектов • ROI до 400%"}}},
  {"type": "product", "overrides": {"name": {"ru": "Ведение Instagram"}, "price": 180000, "currency": "KZT"}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Алия"}, "text": {"ru": "Тимур за 2 месяца увеличил наши продажи в 3 раза."}, "rating": 5}]}}
]'::jsonb,
'📊', false, true, 16)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  blocks = EXCLUDED.blocks, preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium, is_public = EXCLUDED.is_public, sort_order = EXCLUDED.sort_order;

INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES
('lawyer', 'Юрист / Консультант', 'Для юридических и консалтинговых услуг', 'experts',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Берик Смагулов"}, "bio": {"ru": "⚖️ Адвокат • Юридический консультант\n🎓 Магистр права • 15 лет опыта"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Полный разбор"}, "price": 60000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "ТОО Export Group"}, "text": {"ru": "Берик помог нам выиграть сложный спор с поставщиком."}, "rating": 5}]}}
]'::jsonb,
'⚖️', false, true, 17),
('restaurant', 'Ресторан / Кафе', 'Премиум шаблон для ресторанного бизнеса', 'business',
'[
  {"type": "profile", "overrides": {"name": {"ru": "MINT Restaurant"}, "bio": {"ru": "🌿 Современная авторская кухня\n🍷 Винная карта • Живая музыка"}}},
  {"type": "link", "overrides": {"title": {"ru": "📅 ЗАБРОНИРОВАТЬ СТОЛИК"}, "url": "https://restoplace.at/mint", "icon": "calendar"}},
  {"type": "catalog", "overrides": {"title": {"ru": "📖 Меню"}}}
]'::jsonb,
'🍽️', true, true, 19),
('portfolio-pro', 'Portfolio Pro', 'Профессиональное CV/Портфолио для топ-менеджеров', 'experts',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Александр Верников"}, "bio": {"ru": "💼 Product Lead • FinTech • Web3\n🚀 Ex-Revolut, Stripe, Kaspi"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Advisory 1h"}, "price": 100000, "currency": "KZT", "isPopular": true}]}},
  {"type": "link", "overrides": {"title": {"ru": "📄 Скачать полное CV (PDF)"}, "url": "https://example.com/cv.pdf", "icon": "file-text"}}
]'::jsonb,
'📁', true, true, 20),
('blank', 'Пустой холст', 'Начните с чистого листа и создайте свой уникальный дизайн', 'personal',
'[
  {"type": "profile", "overrides": {"name": {"ru": "Новая страница"}, "bio": {"ru": "Настройте этот профиль под себя"}}}
]'::jsonb,
'📝', false, true, 21)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  blocks = EXCLUDED.blocks, preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium, is_public = EXCLUDED.is_public, sort_order = EXCLUDED.sort_order;

-- Seed widget_templates batch 1 (games)
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES
('minesweeper', 'Minesweeper', 'Сапёр', 'games', 'Classic minesweeper game', 'Классическая игра сапёр', 'Bomb',
'<div class="game-app">
  <div class="game-glass">
    <div class="game-header">
      <h1>💣 Mines</h1>
      <div class="game-sub">Tap — open · Hold — flag</div>
    </div>
    <div id="grid" class="game-grid"></div>
    <div class="game-footer">
      <button onclick="startGame()">New Game</button>
      <div id="status" class="game-status"></div>
    </div>
  </div>
</div>',
':root {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
  --accent: #7b8cff;
}
.game-app { width: 100%; max-width: 380px; margin: 0 auto; padding: 12px; }
.game-glass { background: var(--glass-bg); backdrop-filter: blur(16px); border: 1px solid var(--glass-border); border-radius: 20px; padding: 14px; }
.game-header { text-align: center; margin-bottom: 10px; }
.game-header h1 { font-size: 18px; font-weight: 600; margin: 0; color: #fff; }
.game-sub { font-size: 12px; opacity: 0.7; color: #ccc; }
.game-grid { display: grid; gap: 5px; margin-top: 12px; touch-action: manipulation; }
.game-cell { aspect-ratio: 1; border-radius: 10px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: center; align-items: center; font-weight: 600; font-size: 14px; user-select: none; cursor: pointer; transition: all 0.15s; color: #fff; }
.game-cell:hover { background: rgba(255,255,255,0.2); }
.game-cell.open { background: rgba(255,255,255,0.25); transform: scale(0.96); }
.game-cell.flag { background: rgba(123,140,255,0.4); }
.game-cell.mine { background: rgba(255,92,92,0.5); }
.game-footer { margin-top: 12px; text-align: center; }
.game-footer button { width: 100%; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(135deg, #7b8cff, #9aa7ff); color: #fff; font-weight: 600; cursor: pointer; }
.game-status { font-size: 12px; opacity: 0.8; margin-top: 8px; color: #fff; }',
'let rows, cols, mines, grid = [], gameOver = false, longPress;
const gridEl = document.getElementById("grid"), statusEl = document.getElementById("status");
function calcGrid() { const size = Math.min(window.innerWidth - 60, 340); cols = 8; rows = 8; mines = 10; gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; }
function startGame() { calcGrid(); grid = []; gridEl.innerHTML = ""; gameOver = false; statusEl.textContent = "";
  for (let r = 0; r < rows; r++) { grid[r] = []; for (let c = 0; c < cols; c++) grid[r][c] = { mine:false, open:false, flag:false, count:0 }; }
  let placed = 0; while (placed < mines) { const r = Math.random() * rows | 0, c = Math.random() * cols | 0; if (!grid[r][c].mine) { grid[r][c].mine = true; placed++; } }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (grid[r][c].mine) continue; let n = 0; for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) { if (grid[r+dr]?.[c+dc]?.mine) n++; } grid[r][c].count = n; }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const el = document.createElement("div"); el.className = "game-cell"; el.oncontextmenu = e => { e.preventDefault(); flag(r,c); }; el.addEventListener("touchstart", () => { longPress = setTimeout(() => flag(r,c), 400); }); el.addEventListener("touchend", () => { clearTimeout(longPress); open(r,c); }); el.onclick = () => open(r,c); gridEl.appendChild(el); }
}
function open(r,c) { if (gameOver) return; const cell = grid[r][c], el = gridEl.children[r*cols+c]; if (cell.open || cell.flag) return; cell.open = true; el.classList.add("open"); if (cell.mine) { el.textContent = "💣"; el.classList.add("mine"); end(false); return; } if (cell.count) el.textContent = cell.count; else for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) grid[r+dr]?.[c+dc] && open(r+dr,c+dc); check(); }
function flag(r,c) { if (gameOver) return; const cell = grid[r][c]; if (cell.open) return; cell.flag = !cell.flag; const el = gridEl.children[r*cols+c]; el.classList.toggle("flag"); el.textContent = cell.flag ? "🚩" : ""; }
function end(win) { gameOver = true; statusEl.textContent = win ? "🏆 Victory!" : "💥 Game Over"; grid.flat().forEach((c,i)=>{ if(c.mine){ gridEl.children[i].textContent = "💣"; gridEl.children[i].classList.add("mine"); }}); }
function check() { let opened = 0; grid.flat().forEach(c => c.open && opened++); if (opened === rows*cols - mines) end(true); }
startGame();', false),

('slot-machine', 'Slot Machine', 'Слот-машина', 'games', 'Lucky slot machine game', 'Игровой автомат на удачу', 'Cherry',
'<div class="slot-container">
  <h2>🎰 Lucky Spin</h2>
  <div class="slot-machine">
    <div class="slot-window">
      <div class="slot-reel" id="reel1">🍒</div>
      <div class="slot-reel" id="reel2">🍋</div>
      <div class="slot-reel" id="reel3">🍊</div>
    </div>
  </div>
  <button class="slot-button" id="spinBtn" onclick="spin()">SPIN!</button>
  <div class="slot-result" id="result"></div>
</div>',
'.slot-container { text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; color: #fff; }
.slot-container h2 { margin: 0 0 20px; font-size: 22px; }
.slot-machine { background: linear-gradient(145deg, #2a2a4a, #1a1a3a); padding: 15px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.slot-window { display: flex; gap: 8px; background: #000; padding: 15px; border-radius: 12px; }
.slot-reel { width: 60px; height: 70px; background: linear-gradient(180deg, #2a2a4a, #1a1a3a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 36px; border: 2px solid #444; transition: transform 0.1s; }
.slot-reel.spinning { animation: slotSpin 0.1s infinite; }
@keyframes slotSpin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.slot-button { margin-top: 20px; padding: 14px 40px; font-size: 18px; font-weight: bold; background: linear-gradient(135deg, #ff6b6b, #ffa502); color: #fff; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 5px 20px rgba(255,107,107,0.4); transition: all 0.2s; }
.slot-button:hover { transform: scale(1.05); }
.slot-button:disabled { opacity: 0.6; cursor: not-allowed; }
.slot-result { margin-top: 15px; font-size: 18px; min-height: 30px; }',
'const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const reels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")];
const btn = document.getElementById("spinBtn");
const result = document.getElementById("result");
function spin() {
  btn.disabled = true; result.textContent = ""; reels.forEach(r => r.classList.add("spinning"));
  let spins = [0, 0, 0], final = [];
  reels.forEach((reel, i) => {
    const interval = setInterval(() => { reel.textContent = symbols[Math.floor(Math.random() * symbols.length)]; }, 80);
    setTimeout(() => { clearInterval(interval); reel.classList.remove("spinning"); final[i] = symbols[Math.floor(Math.random() * symbols.length)]; reel.textContent = final[i]; if (i === 2) checkWin(final); }, 500 + i * 400);
  });
}
function checkWin(final) {
  btn.disabled = false;
  if (final[0] === final[1] && final[1] === final[2]) { result.textContent = "🎉 JACKPOT! 🎉"; result.style.color = "#ffd700"; }
  else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) { result.textContent = "✨ Nice! ✨"; result.style.color = "#7bed9f"; }
  else { result.textContent = "Try again!"; result.style.color = "#fff"; }
}', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_ru = EXCLUDED.name_ru, category = EXCLUDED.category,
  description = EXCLUDED.description, description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon, html = EXCLUDED.html, css = EXCLUDED.css,
  javascript = EXCLUDED.javascript, is_premium = EXCLUDED.is_premium;

-- Seed widget_templates batch 2 (utilities)
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES
('qr-generator', 'QR Code Generator', 'Генератор QR-кодов', 'engagement', 'Simple QR code generator for links', 'Простой генератор QR-кодов для ссылок', 'QrCode',
'<div class="qr-widget">
  <div class="qr-card">
    <h3>🔗 QR Generator</h3>
    <input type="text" id="qrInput" placeholder="Enter URL or text..." oninput="updateQR()">
    <div id="qrOutput" class="qr-display"></div>
    <div class="qr-help">Scans instantly</div>
  </div>
</div>',
'.qr-widget { padding: 10px; width: 100%; max-width: 300px; margin: 0 auto; color: #fff; }
.qr-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 20px; text-align: center; }
.qr-card h3 { margin: 0 0 15px; font-size: 16px; font-weight: 600; }
.qr-card input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: #fff; font-size: 14px; margin-bottom: 20px; outline: none; transition: 0.2s; }
.qr-card input:focus { border-color: #7b8cff; }
.qr-display { background: #fff; padding: 10px; border-radius: 12px; display: inline-block; min-width: 120px; min-height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.qr-display img { max-width: 100%; height: auto; }
.qr-help { margin-top: 15px; font-size: 12px; opacity: 0.6; }',
'function updateQR() {
  const val = document.getElementById("qrInput").value || "inkmax.pro";
  const out = document.getElementById("qrOutput");
  out.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(val)}" alt="QR Code">`;
}
updateQR();', false),

('calculator', 'Profit Calculator', 'Калькулятор прибыли', 'engagement', 'Calculate your business profit', 'Рассчитайте прибыль вашего бизнеса', 'Calculator',
'<div class="calc-widget">
  <h3>📊 Profit Calc</h3>
  <div class="calc-row">
    <label>Revenue (KZT)</label>
    <input type="number" id="rev" value="100000" oninput="calc()">
  </div>
  <div class="calc-row">
    <label>Costs (%)</label>
    <input type="range" id="cost" min="0" max="100" value="30" oninput="calc()">
    <span id="costVal">30%</span>
  </div>
  <div class="calc-result">
    <div class="res-item">
      <span>Profit:</span>
      <b id="profit">70,000 ₸</b>
    </div>
    <div class="res-item">
      <span>Margin:</span>
      <b id="margin">70%</b>
    </div>
  </div>
</div>',
'.calc-widget { background: #111; border-radius: 24px; padding: 20px; color: #fff; border: 1px solid #222; }
.calc-widget h3 { margin: 0 0 20px; font-size: 18px; text-align: center; }
.calc-row { margin-bottom: 15px; }
.calc-row label { display: block; font-size: 12px; opacity: 0.6; margin-bottom: 5px; }
.calc-row input[type="number"] { width: 100%; background: #222; border: none; padding: 10px; border-radius: 8px; color: #fff; font-size: 16px; }
.calc-row input[type="range"] { width: 80%; }
#costVal { float: right; font-size: 14px; }
.calc-result { background: #1a1a1a; padding: 15px; border-radius: 12px; margin-top: 20px; }
.res-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
.res-item b { color: #7b8cff; }',
'function calc() {
  const r = +document.getElementById("rev").value || 0;
  const c = +document.getElementById("cost").value;
  document.getElementById("costVal").textContent = c + "%";
  const p = r * (1 - c/100);
  document.getElementById("profit").textContent = p.toLocaleString() + " ₸";
  document.getElementById("margin").textContent = (100 - c) + "%";
}
calc();', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_ru = EXCLUDED.name_ru, category = EXCLUDED.category,
  description = EXCLUDED.description, description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon, html = EXCLUDED.html, css = EXCLUDED.css,
  javascript = EXCLUDED.javascript, is_premium = EXCLUDED.is_premium;

-- Seed widget_templates batch 3 (engagement)
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES
('poll-widget', 'Quick Poll', 'Быстрый опрос', 'engagement', 'Simple voting poll', 'Простой опрос с голосованием', 'Vote',
'<div class="poll-widget">
  <h3 class="poll-question">What''s your favorite color? 🎨</h3>
  <div class="poll-options" id="pollOptions">
    <button class="poll-option" onclick="vote(0)"><span class="poll-emoji">🔴</span> Red<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(1)"><span class="poll-emoji">🔵</span> Blue<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(2)"><span class="poll-emoji">🟢</span> Green<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(3)"><span class="poll-emoji">🟡</span> Yellow<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
  </div>
  <div class="poll-total" id="pollTotal">0 votes</div>
</div>',
'.poll-widget { padding: 20px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 20px; color: #fff; }
.poll-question { margin: 0 0 20px; font-size: 18px; text-align: center; }
.poll-options { display: flex; flex-direction: column; gap: 10px; }
.poll-option { position: relative; display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: rgba(255,255,255,0.15); border: 2px solid transparent; border-radius: 12px; color: #fff; font-size: 16px; cursor: pointer; transition: all 0.2s; overflow: hidden; text-align: left; }
.poll-option:hover { background: rgba(255,255,255,0.25); }
.poll-option.voted { border-color: rgba(255,255,255,0.5); cursor: default; }
.poll-bar { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.2); transition: width 0.5s; width: 0%; z-index: 0; }
.poll-emoji { position: relative; z-index: 1; }
.poll-percent { margin-left: auto; font-weight: bold; position: relative; z-index: 1; opacity: 0; transition: opacity 0.3s; }
.poll-option.voted .poll-percent { opacity: 1; }
.poll-total { text-align: center; margin-top: 16px; font-size: 14px; opacity: 0.9; }',
'let votes = [5, 8, 3, 4], hasVoted = false;
function updatePoll() { const total = votes.reduce((a, b) => a + b, 0); const options = document.querySelectorAll(".poll-option"); options.forEach((opt, i) => { const percent = total > 0 ? Math.round((votes[i] / total) * 100) : 0; opt.querySelector(".poll-bar").style.width = percent + "%"; opt.querySelector(".poll-percent").textContent = percent + "%"; }); document.getElementById("pollTotal").textContent = total + " votes"; }
function vote(index) { if (hasVoted) return; hasVoted = true; votes[index]++; const options = document.querySelectorAll(".poll-option"); options.forEach(opt => opt.classList.add("voted")); updatePoll(); }
updatePoll();', false),

('reaction-widget', 'Reaction Widget', 'Виджет реакций', 'engagement', 'Emoji reaction buttons', 'Кнопки реакций с эмодзи', 'Smile',
'<div class="reaction-widget">
  <div class="reaction-question">How do you feel today?</div>
  <div class="reaction-buttons">
    <button class="reaction-btn" onclick="react(this, ''😍'')"><span>😍</span><span class="reaction-count">12</span></button>
    <button class="reaction-btn" onclick="react(this, ''😊'')"><span>😊</span><span class="reaction-count">28</span></button>
    <button class="reaction-btn" onclick="react(this, ''😐'')"><span>😐</span><span class="reaction-count">5</span></button>
    <button class="reaction-btn" onclick="react(this, ''😢'')"><span>😢</span><span class="reaction-count">3</span></button>
    <button class="reaction-btn" onclick="react(this, ''🔥'')"><span>🔥</span><span class="reaction-count">17</span></button>
  </div>
</div>',
'.reaction-widget { padding: 24px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 20px; text-align: center; }
.reaction-question { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 20px; }
.reaction-buttons { display: flex; justify-content: center; gap: 12px; }
.reaction-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 16px; background: rgba(255,255,255,0.25); border: 2px solid transparent; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
.reaction-btn span:first-child { font-size: 32px; transition: transform 0.2s; }
.reaction-btn:hover span:first-child { transform: scale(1.2); }
.reaction-btn.selected { background: rgba(255,255,255,0.4); border-color: #fff; transform: scale(1.1); }
.reaction-count { font-size: 14px; font-weight: bold; color: #fff; }',
'let reacted = false;
function react(btn, emoji) {
  if (reacted) { document.querySelectorAll(".reaction-btn").forEach(b => b.classList.remove("selected")); }
  btn.classList.add("selected");
  if (!reacted) { const countEl = btn.querySelector(".reaction-count"); countEl.textContent = parseInt(countEl.textContent) + 1; }
  reacted = true;
  btn.querySelector("span:first-child").style.transform = "scale(1.3)";
  setTimeout(() => { btn.querySelector("span:first-child").style.transform = ""; }, 200);
}', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_ru = EXCLUDED.name_ru, category = EXCLUDED.category,
  description = EXCLUDED.description, description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon, html = EXCLUDED.html, css = EXCLUDED.css,
  javascript = EXCLUDED.javascript, is_premium = EXCLUDED.is_premium;

COMMIT;
