-- Alter id column to text to support string IDs from legacy templates
ALTER TABLE public.templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.templates ALTER COLUMN id TYPE text;

-- Insert 'personal' template
INSERT INTO public.templates (id, name, description, category, preview, is_premium, blocks)
VALUES (
  'personal',
  'Личная страница',
  'Простая страница со ссылками для всех',
  'other',
  '👤',
  false,
  '[
    {"type": "profile", "overrides": {"name": {"ru": "Ваше имя", "en": "Your Name", "kk": "Сіздің атыңыз"}, "bio": {"ru": "✨ Расскажите о себе\n📍 Ваш город\n💼 Чем занимаетесь", "en": "✨ Tell about yourself\n📍 Your city\n💼 What you do", "kk": "✨ Өзіңіз туралы айтыңыз\n📍 Сіздің қалаңыз\n💼 Не істейсіз"}}},
    {"type": "link", "overrides": {"title": {"ru": "📱 Instagram", "en": "📱 Instagram", "kk": "📱 Instagram"}, "url": "https://instagram.com/", "icon": "instagram", "style": "rounded"}},
    {"type": "link", "overrides": {"title": {"ru": "💬 Telegram", "en": "💬 Telegram", "kk": "💬 Telegram"}, "url": "https://t.me/", "icon": "globe", "style": "rounded"}},
    {"type": "link", "overrides": {"title": {"ru": "🎬 YouTube", "en": "🎬 YouTube", "kk": "🎬 YouTube"}, "url": "https://youtube.com/", "icon": "youtube", "style": "rounded"}},
    {"type": "link", "overrides": {"title": {"ru": "🔗 Ваша ссылка", "en": "🔗 Your link", "kk": "🔗 Сіздің сілтемеңіз"}, "url": "https://example.com", "icon": "link", "style": "rounded"}},
    {"type": "socials", "overrides": {"platforms": [{"platform": "instagram", "url": "https://instagram.com/"}, {"platform": "telegram", "url": "https://t.me/"}, {"platform": "tiktok", "url": "https://tiktok.com/"}]}}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  blocks = EXCLUDED.blocks;

-- Insert 'agency' template
INSERT INTO public.templates (id, name, description, category, preview, is_premium, blocks)
VALUES (
  'agency',
  'Digital Агентство',
  'Премиум дизайн, анимации, кейсы и команда',
  'business',
  '🏆',
  true,
  '[
    {"type": "profile", "overrides": {"name": {"ru": "EAGLE AGENCY", "en": "EAGLE AGENCY", "kk": "EAGLE AGENCY"}, "bio": {"ru": "🚀 Digital-агентство полного цикла\n💻 Web • Mobile • Branding • Marketing\n🏆 Золото Tagline 2023", "en": "🚀 Full cycle digital agency\n💻 Web • Mobile • Branding • Marketing\n🏆 Tagline Gold 2023", "kk": "🚀 Толық циклді digital-агенттік\n💻 Web • Mobile • Branding • Marketing\n🏆 Tagline 2023 Алтын"}}},
    {"type": "video", "overrides": {"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": {"ru": "🎬 Наш шоурил 2024", "en": "🎬 Our showreel 2024", "kk": "🎬 Біздің шоурил 2024"}}},
    {"type": "text", "overrides": {"content": {"ru": "🏆 Почему мы?", "en": "🏆 Why us?", "kk": "🏆 Неге біз?"}, "style": "heading", "alignment": "center"}},
    {"type": "text", "overrides": {"content": {"ru": "Мы создаем продукты, которые меняют рынок. Глубокая аналитика, смелый дизайн и передовые технологии.", "en": "We create products that change the market. Deep analytics, bold design and advanced technologies.", "kk": "Біз нарықты өзгертетін өнімдер жасаймыз. Терең аналитика, батыл дизайн және озық технологиялар."}, "style": "paragraph", "alignment": "center"}},
    {"type": "messenger", "overrides": {"messengers": [{"platform": "telegram", "username": "eagle_agency_ceo"}, {"platform": "email", "username": "hello@eagle.agency"}]}}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  blocks = EXCLUDED.blocks;

-- Insert 'influencer' template
INSERT INTO public.templates (id, name, description, category, preview, is_premium, blocks)
VALUES (
  'influencer',
  'Блогер / Инфлюенсер',
  'Для контент-мейкеров и блогеров — полный набор',
  'creators',
  '👤',
  false,
  '[
    {"type": "profile", "overrides": {"name": {"ru": "Алина Lifestyle", "en": "Alina Lifestyle", "kk": "Алина Lifestyle"}, "bio": {"ru": "✨ Блогер • 500K подписчиков\n🎥 Влоги о путешествиях и моде\n📍 Алматы → Мир", "en": "✨ Blogger • 500K followers\n🎥 Travel & fashion vlogs\n📍 Almaty → World", "kk": "✨ Блогер • 500K жазылушы\n🎥 Саяхат және сән влогтары\n📍 Алматы → Әлем"}}},
    {"type": "link", "overrides": {"title": {"ru": "🎬 YouTube — новые влоги каждую неделю", "en": "🎬 YouTube — new vlogs weekly", "kk": "🎬 YouTube — жаңа влогтар апта сайын"}, "url": "https://youtube.com/@example", "icon": "youtube", "style": "rounded"}},
    {"type": "link", "overrides": {"title": {"ru": "📸 Instagram — бэкстейдж и stories", "en": "📸 Instagram — backstage & stories", "kk": "📸 Instagram — бэкстейдж және stories"}, "url": "https://instagram.com/example", "icon": "instagram", "style": "rounded"}}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  blocks = EXCLUDED.blocks;

-- Insert 'barber' template
INSERT INTO public.templates (id, name, description, category, preview, is_premium, blocks)
VALUES (
  'barber',
  'Барбершоп',
  'Полный шаблон для барберов — прайс, галерея, запись',
  'business',
  '💈',
  false,
  '[
    {"type": "profile", "overrides": {"name": {"ru": "BLACKBEARD Barbershop", "en": "BLACKBEARD Barbershop", "kk": "BLACKBEARD Barbershop"}, "bio": {"ru": "✂️ Мужские стрижки в центре Алматы\n🏆 Лучший барбершоп 2023 по версии 2GIS\n⭐ 4.9 рейтинг • 500+ отзывов", "en": "✂️ Men''s haircuts in Almaty center\n🏆 Best barbershop 2023 by 2GIS\n⭐ 4.9 rating • 500+ reviews", "kk": "✂️ Алматы орталығында ерлер шаш қию\n🏆 2GIS бойынша 2023 үздік барбершоп\n⭐ 4.9 рейтинг • 500+ пікір"}}},
    {"type": "text", "overrides": {"content": {"ru": "⏰ Режим работы: Пн-Вс 10:00 - 21:00", "en": "⏰ Working hours: Mon-Sun 10:00 - 21:00", "kk": "⏰ Жұмыс уақыты: Дс-Жс 10:00 - 21:00"}, "style": "paragraph", "alignment": "center"}},
    {"type": "link", "overrides": {"title": {"ru": "📅 ЗАПИСАТЬСЯ ОНЛАЙН", "en": "📅 BOOK ONLINE", "kk": "📅 ОНЛАЙН ЖАЗЫЛУ"}, "url": "https://dikidi.net/blackbeard", "icon": "calendar", "style": "pill"}}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  blocks = EXCLUDED.blocks;
