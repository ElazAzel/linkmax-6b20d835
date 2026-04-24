-- Seed 10 starter templates for missing niches
INSERT INTO public.templates (name, category, description, blocks, is_public, is_premium, sort_order) VALUES
('Преподаватель / Курс', 'education', 'Структура для преподавателей, репетиторов и онлайн-курсов', '[
  {"type":"profile","name":"Имя преподавателя","bio":"📚 Преподаватель | Помогаю достигать целей через знания"},
  {"type":"text","content":"О направлении","style":"heading"},
  {"type":"text","content":"Здесь короткое описание вашей методики и результата для ученика.","style":"paragraph"},
  {"type":"pricing","items":[{"id":"1","title":"Пробный урок","price":"0","description":"30 минут знакомства"},{"id":"2","title":"Индивидуальное занятие","price":"5000","description":"60 минут 1-на-1"},{"id":"3","title":"Пакет 8 занятий","price":"36000","description":"Скидка 10%"}]},
  {"type":"testimonial","testimonials":[{"name":"Айгуль","role":"Ученица","text":"Сдала экзамен на 95!","rating":5}]},
  {"type":"form","title":"Записаться на пробный","fields":[{"name":"name","label":"Имя"},{"name":"phone","label":"Телефон"}]},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 7),

('Медицина / Wellness', 'health', 'Шаблон для психологов, терапевтов и wellness-специалистов', '[
  {"type":"profile","name":"Имя специалиста","bio":"🌿 Психолог | Безопасное пространство для роста"},
  {"type":"text","content":"С чем работаю","style":"heading"},
  {"type":"text","content":"Тревога, отношения, выгорание, поиск себя.","style":"paragraph"},
  {"type":"pricing","items":[{"id":"1","title":"Консультация 50 мин","price":"15000","description":"Онлайн или офлайн"},{"id":"2","title":"Пакет 5 сессий","price":"65000","description":"Скидка для постоянных клиентов"}]},
  {"type":"booking","title":"Записаться на консультацию"},
  {"type":"faq","items":[{"id":"1","question":"Как проходит сессия?","answer":"50 минут в Zoom или у меня в кабинете."},{"id":"2","question":"Можно ли анонимно?","answer":"Да, конфиденциальность гарантирована."}]},
  {"type":"messenger","messengers":[{"platform":"telegram","username":"username"}]}
]'::jsonb, true, false, 8),

('Художник / Креатор', 'art', 'Шаблон для художников, иллюстраторов и креаторов', '[
  {"type":"profile","name":"Имя автора","bio":"🎨 Иллюстратор | Создаю миры в цвете"},
  {"type":"carousel","title":"Портфолио","images":[{"url":"https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800","alt":"Работа 1"},{"url":"https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800","alt":"Работа 2"}]},
  {"type":"text","content":"Что я делаю","style":"heading"},
  {"type":"pricing","items":[{"id":"1","title":"Цифровой портрет","price":"25000","description":"3-5 дней"},{"id":"2","title":"Иллюстрация на заказ","price":"50000","description":"Полный цикл с правками"}]},
  {"type":"socials","platforms":[{"name":"Instagram","url":"https://instagram.com/","icon":"instagram"},{"name":"Behance","url":"https://behance.net/","icon":"globe"}]},
  {"type":"messenger","messengers":[{"platform":"telegram","username":"username"}]}
]'::jsonb, true, false, 9),

('Шеф / Кулинар', 'food', 'Шаблон для шефов, кондитеров и фуд-блогеров', '[
  {"type":"profile","name":"Имя шефа","bio":"🍳 Шеф-повар | Авторская кухня и мастер-классы"},
  {"type":"carousel","title":"Меню","images":[{"url":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800","alt":"Блюдо 1"},{"url":"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800","alt":"Блюдо 2"}]},
  {"type":"pricing","items":[{"id":"1","title":"Кейтеринг на 10 персон","price":"80000","description":"3-блюдное меню"},{"id":"2","title":"Мастер-класс","price":"15000","description":"2 часа с дегустацией"}]},
  {"type":"testimonial","testimonials":[{"name":"Ержан","role":"Гость","text":"Лучший ужин в жизни","rating":5}]},
  {"type":"form","title":"Заказать кейтеринг","fields":[{"name":"name","label":"Имя"},{"name":"phone","label":"Телефон"},{"name":"event","label":"Дата события"}]},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 10),

('Музыкант / Артист', 'music', 'Шаблон для музыкантов, DJ и артистов', '[
  {"type":"profile","name":"Имя артиста","bio":"🎵 Music producer | New track out now"},
  {"type":"video","url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","title":"Latest video"},
  {"type":"link","title":"🎧 Spotify","url":"https://open.spotify.com/","icon":"globe"},
  {"type":"link","title":"🍎 Apple Music","url":"https://music.apple.com/","icon":"globe"},
  {"type":"countdown","title":"Релиз нового альбома","targetDate":"2026-12-31T20:00:00Z"},
  {"type":"socials","platforms":[{"name":"Instagram","url":"https://instagram.com/","icon":"instagram"},{"name":"TikTok","url":"https://tiktok.com/","icon":"globe"}]},
  {"type":"messenger","messengers":[{"platform":"telegram","username":"username"}]}
]'::jsonb, true, false, 11),

('Стилист / Fashion', 'fashion', 'Шаблон для стилистов и модных экспертов', '[
  {"type":"profile","name":"Имя стилиста","bio":"👗 Персональный стилист | Подберу образ под вас"},
  {"type":"carousel","title":"Лук-бук","images":[{"url":"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800","alt":"Образ 1"},{"url":"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800","alt":"Образ 2"}]},
  {"type":"pricing","items":[{"id":"1","title":"Разбор гардероба","price":"30000","description":"2 часа онлайн или дома"},{"id":"2","title":"Шопинг-сопровождение","price":"45000","description":"3 часа с подбором"}]},
  {"type":"testimonial","testimonials":[{"name":"Аруна","role":"Клиентка","text":"Полностью изменила мой стиль!","rating":5}]},
  {"type":"booking","title":"Записаться"},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 12),

('Travel / Гид', 'travel', 'Шаблон для тревел-блогеров и гидов', '[
  {"type":"profile","name":"Имя гида","bio":"✈️ Travel guide | Авторские туры по Казахстану"},
  {"type":"carousel","title":"Маршруты","images":[{"url":"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800","alt":"Природа"},{"url":"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800","alt":"Горы"}]},
  {"type":"pricing","items":[{"id":"1","title":"Тур в Чарын","price":"25000","description":"1 день, группа до 6 человек"},{"id":"2","title":"3-дневный тур по Алматы","price":"95000","description":"Все включено"}]},
  {"type":"faq","items":[{"id":"1","question":"Что входит в тур?","answer":"Транспорт, гид, обед, страховка."},{"id":"2","question":"Можно ли с детьми?","answer":"Да, есть семейные маршруты."}]},
  {"type":"form","title":"Забронировать тур","fields":[{"name":"name","label":"Имя"},{"name":"phone","label":"Телефон"},{"name":"date","label":"Дата"}]},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 13),

('Недвижимость', 'realestate', 'Шаблон для риелторов и агентов недвижимости', '[
  {"type":"profile","name":"Имя риелтора","bio":"🏠 Риелтор | Помогу найти дом мечты"},
  {"type":"text","content":"Услуги","style":"heading"},
  {"type":"pricing","items":[{"id":"1","title":"Подбор квартиры","price":"50000","description":"Полное сопровождение сделки"},{"id":"2","title":"Оценка недвижимости","price":"15000","description":"Профессиональный отчёт"}]},
  {"type":"carousel","title":"Актуальные объекты","images":[{"url":"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800","alt":"Объект 1"},{"url":"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800","alt":"Объект 2"}]},
  {"type":"testimonial","testimonials":[{"name":"Семья Касымовых","role":"Покупатели","text":"Помог найти квартиру за 2 недели","rating":5}]},
  {"type":"form","title":"Оставить заявку","fields":[{"name":"name","label":"Имя"},{"name":"phone","label":"Телефон"},{"name":"need","label":"Что ищете"}]},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 14),

('События / Ивенты', 'events', 'Шаблон для организаторов событий и продажи билетов', '[
  {"type":"profile","name":"Название события","bio":"🎉 Главное событие года"},
  {"type":"countdown","title":"До начала события","targetDate":"2026-12-31T19:00:00Z"},
  {"type":"text","content":"О событии","style":"heading"},
  {"type":"text","content":"Краткое описание программы, спикеров и формата.","style":"paragraph"},
  {"type":"pricing","items":[{"id":"1","title":"Standard","price":"10000","description":"Доступ ко всему дню"},{"id":"2","title":"VIP","price":"25000","description":"Первые ряды + after-party"}]},
  {"type":"form","title":"Зарегистрироваться","fields":[{"name":"name","label":"Имя"},{"name":"email","label":"Email"},{"name":"phone","label":"Телефон"}]},
  {"type":"messenger","messengers":[{"platform":"telegram","username":"username"}]}
]'::jsonb, true, false, 15),

('Универсальный профиль', 'other', 'Универсальный шаблон для любой деятельности', '[
  {"type":"profile","name":"Ваше имя","bio":"✨ Расскажите коротко о себе"},
  {"type":"text","content":"Чем я занимаюсь","style":"heading"},
  {"type":"text","content":"Опишите вашу деятельность 2-3 предложениями.","style":"paragraph"},
  {"type":"link","title":"🌐 Мой сайт","url":"https://example.com","icon":"globe"},
  {"type":"socials","platforms":[{"name":"Instagram","url":"https://instagram.com/","icon":"instagram"},{"name":"Telegram","url":"https://t.me/","icon":"telegram"}]},
  {"type":"messenger","messengers":[{"platform":"whatsapp","username":"+77001234567"}]}
]'::jsonb, true, false, 16);