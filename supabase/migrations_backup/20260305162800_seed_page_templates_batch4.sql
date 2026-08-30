-- Seed templates Batch 4
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
  {"type": "text", "overrides": {"content": {"ru": "🏆 Результаты учеников"}, "style": "heading"}},
  {"type": "pricing", "overrides": {"plans": [{"name": {"ru": "IELTS Intensive"}, "price": 80000, "currency": "KZT", "isPopular": true}]}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Данияр"}, "text": {"ru": "Поднял балл с 6.0 до 7.5!"}, "rating": 5}]}}
]'::jsonb, 
'📚', false, true, 15),

('marketer', 'SMM / Маркетолог', 'Для digital-специалистов — кейсы, услуги, результаты', 'experts', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "Тимур Digital"}, "bio": {"ru": "📈 SMM-маркетолог • Таргетолог\n🏆 100+ проектов • ROI до 400%"}}},
  {"type": "text", "overrides": {"content": {"ru": "🏆 Результаты"}, "style": "heading"}},
  {"type": "product", "overrides": {"name": {"ru": "Ведение Instagram"}, "price": 180000, "currency": "KZT"}},
  {"type": "testimonial", "overrides": {"testimonials": [{"name": {"ru": "Алия"}, "text": {"ru": "Тимур за 2 месяца увеличил наши продажи в 3 раза."}, "rating": 5}]}}
]'::jsonb, 
'📊', false, true, 16)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  blocks = EXCLUDED.blocks,
  preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;
