-- Alter templates table to use TEXT ID and seed it
DO $$ 
BEGIN
    -- Change ID column type if it's currently UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.templates ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Seed templates with data from HARDCODED_TEMPLATES
INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES 
('influencer', 'Блогер / Инфлюенсер', 'Для контент-мейкеров и блогеров — полный набор', 'creators', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "Алина Lifestyle", "en": "Alina Lifestyle", "kk": "Алина Lifestyle"}, "bio": {"ru": "✨ Блогер • 500K подписчиков\n🎥 Влоги о путешествиях и моде\n📍 Алматы → Мир", "en": "✨ Blogger • 500K followers\n🎥 Travel & fashion vlogs\n📍 Almaty → World", "kk": "✨ Блогер • 500K жазылушы\n🎥 Саяхат және сән влогтары\n📍 Алматы → Әлем"}}},
  {"type": "countdown", "overrides": {"title": {"ru": "🔥 Новый влог через:", "en": "🔥 New vlog in:", "kk": "🔥 Жаңа влог:"}, "endDate": "2026-12-31T23:59:59Z", "style": "modern"}},
  {"type": "link", "overrides": {"title": {"ru": "🎬 YouTube — новые влоги каждую неделю", "en": "🎬 YouTube — new vlogs weekly", "kk": "🎬 YouTube — жаңа влогтар апта сайын"}, "url": "https://youtube.com/@example", "icon": "youtube", "style": "rounded"}},
  {"type": "product", "overrides": {"name": {"ru": "Реклама в сторис", "en": "Story ad placement", "kk": "Stories-те жарнама"}, "price": 150000, "currency": "KZT"}}
]'::jsonb, 
'👤', false, true, 1),

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
'🎨', false, true, 3),

('personal', 'Личная страница', 'Простая визитка для ссылок в био (Linktree style)', 'personal', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "Твоё Имя", "en": "Your Name", "kk": "Сенің есімің"}}},
  {"type": "link", "overrides": {"title": {"ru": "Мой Telegram-канал", "en": "My Telegram channel"}, "url": "https://t.me/example", "icon": "globe", "style": "pill"}}
]'::jsonb, 
'✨', false, true, 4)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  blocks = EXCLUDED.blocks,
  preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;
