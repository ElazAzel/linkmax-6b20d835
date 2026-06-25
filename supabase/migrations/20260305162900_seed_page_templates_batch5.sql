-- Seed templates Batch 5
INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES 
('lawyer', 'Юрист / Консультант', 'Для юридических и консалтинговых услуг', 'experts', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "Берик Смагулов"}, "bio": {"ru": "⚖️ Адвокат • Юридический консультант\n🎓 Магистр права • 15 лет опыта"}}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "Полный разбор"}, "price": 60000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "ТОО Export Group"}, "text": {"ru": "Берик помог нам выиграть сложный спор с поставщиком."}, "rating": 5}]}}
]'::jsonb, 
'⚖️', false, true, 17),

('agency', 'Digital Агентство', 'Премиум шаблон для студий и команд', 'experts', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "NOVA Studio"}, "bio": {"ru": "🚀 Создаём цифровые продукты будущего\n✨ UI/UX • Web • Mobile"}}},
  {"type": "catalog", "overrides": {"items": [{"name": {"ru": "Web Development"}, "price": 1500000}]}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "MVP Build"}, "price": 3000000, "currency": "KZT", "isPopular": true}]}}
]'::jsonb, 
'🏢', true, true, 18),

('restaurant', 'Ресторан / Кафе', 'Премиум шаблон для ресторанного бизнеса', 'business', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "MINT Restaurant"}, "bio": {"ru": "🌿 Современная авторская кухня\n🍷 Винная карта • Живая музыка"}}},
  {"type": "link", "overrides": {"title": {"ru": "📅 ЗАБРОНИРОВАТЬ СТОЛИК"}, "url": "https://restoplace.at/mint", "icon": "calendar"}},
  {"type": "catalog", "overrides": {"title": {"ru": "📖 Меню"}, "categories": [{"name": {"ru": "Горячее"}, "items": [{"name": {"ru": "Стейк Рибай"}, "price": 12000}]}]}}
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
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  blocks = EXCLUDED.blocks,
  preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;
