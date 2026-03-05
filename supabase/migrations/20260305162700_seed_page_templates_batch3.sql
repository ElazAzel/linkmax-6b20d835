-- Seed templates Batch 3
INSERT INTO public.templates (id, name, description, category, blocks, preview_image, is_premium, is_public, sort_order)
VALUES 
('fitness', 'Фитнес-тренер', 'Для тренеров — программы, результаты, онлайн-курсы', 'business', 
'[
  {"type": "profile", "overrides": {"name": {"ru": "Артём Fitness", "en": "Artem Fitness", "kk": "Артём Fitness"}, "bio": {"ru": "💪 Сертифицированный тренер\n🏆 Мастер спорта • 8 лет опыта\n🔥 1000+ клиентов • 50 000 кг сброшено\n📍 World Class Almaty + Онлайн", "en": "💪 Certified trainer\n🏆 Master of Sports • 8 years exp\n🔥 1000+ clients • 50,000 kg lost\n📍 World Class Almaty + Online", "kk": "💪 Сертификатталған жаттықтырушы\n🏆 Спорт шебері • 8 жыл тәжірибе\n🔥 1000+ клиент • 50 000 кг тасталды\n📍 World Class Almaty + Онлайн"}}},
  {"type": "carousel", "overrides": {"title": {"ru": "🏆 Трансформации клиентов"}, "images": [{"url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop"}, {"url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop"}]}},
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
  {"type": "catalog", "overrides": {"title": {"ru": "👗 Каталог"}, "categories": [{"name": {"ru": "Одежда"}, "items": [{"name": {"ru": "Худи Oversize"}, "price": 12900}]}]}},
  {"type": "faq", "overrides": {"items": [{"question": {"ru": "Как оплатить?"}, "answer": {"ru": "Kaspi перевод, Kaspi QR, наличные курьеру, рассрочка Kaspi Red"}}]}}
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
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  blocks = EXCLUDED.blocks,
  preview_image = EXCLUDED.preview_image,
  is_premium = EXCLUDED.is_premium,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;
