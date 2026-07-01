-- Seed templates Batch 2
INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES 
('streamer', 'Стример / Геймер', 'Для стримеров и киберспортсменов', 'creators', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "DarkNight", "en": "DarkNight", "kk": "DarkNight"}, "bio": {"ru": "🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримы: ПН-ПТ 20:00", "en": "🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Streams: MON-FRI 8PM", "kk": "🎮 Twitch Partner • 100K жазылушы\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримдер: ДС-ЖМ 20:00"}}},
  {"type": "countdown", "overrides": {"title": {"ru": "⏰ Следующий стрим через:", "en": "⏰ Next stream in:", "kk": "⏰ Келесі стрим:"}, "endDate": "2026-12-31T23:59:59Z", "style": "modern"}},
  {"type": "link", "overrides": {"title": {"ru": "🟣 Twitch — смотреть стрим LIVE", "en": "🟣 Twitch — watch stream LIVE", "kk": "🟣 Twitch — LIVE стримді қарау"}, "url": "https://twitch.tv/darknight", "icon": "globe", "style": "pill"}},
  {"type": "video", "overrides": {"url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": {"ru": "🔥 Лучший момент недели — ACE на Inferno", "en": "🔥 Best moment — ACE on Inferno", "kk": "🔥 Аптаның үздік сәті — Inferno-да ACE"}}}
]'::jsonb, 
'🎮', false, true, 5),

('barber', 'Барбершоп', 'Полный шаблон для барберов — прайс, галерея, запись', 'business', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "BLACKBEARD Barbershop", "en": "BLACKBEARD Barbershop", "kk": "BLACKBEARD Barbershop"}}},
  {"type": "text", "overrides": {"content": {"ru": "⏰ Режим работы: Пн-Вс 10:00 - 21:00"}}},
  {"type": "link", "overrides": {"title": {"ru": "📅 ЗАПИСАТЬСЯ ОНЛАЙН"}, "url": "https://dikidi.net/blackbeard", "icon": "calendar", "style": "pill"}},
  {"type": "carousel", "overrides": {"title": {"ru": "💈 Наши работы"}}},
  {"type": "product", "overrides": {"name": {"ru": "Мужская стрижка"}, "price": 4000, "currency": "KZT"}}
]'::jsonb, 
'💈', false, true, 6),

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
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  blocks = EXCLUDED.blocks,
  preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;
