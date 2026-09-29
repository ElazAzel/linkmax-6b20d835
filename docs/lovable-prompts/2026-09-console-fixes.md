# Промт для Lovable: формы, аналитика посетителей (после PR с хотфиксами по консоли)

Вставь блок ниже в Lovable целиком. Код уже в ветке `lovable-fallback`. Нужны диагностика, деплой двух edge-функций и проверка.

```
Контекст: в консоли дашборда видны ошибки, за которыми стоят две поломки на проде.

1) Формы на публичных страницах, скорее всего, не сохраняют заявки. Edge-функция submit-lead
   (а) читала несуществующую колонку pages.content — запрос страницы падал;
   (б) вставляла в leads несуществующие колонки page_id, block_id, form_data и не передавала обязательные user_id, name, source.
   При этом посетитель видел «Форма отправлена». В коде функция теперь пишет в leads только живые колонки
   (user_id, name, email, phone, source='form', status='new'), а страницу, блок и поля формы — в metadata
   (metadata.page_id, metadata.block_id, metadata.form_data). FormBlock при ошибке показывает ошибку и не стирает введённое.

2) track-analytics-event отвечает 401 на события анонимных посетителей. Вероятная причина: функция задеплоена
   с verify_jwt = true, а в supabase/config.toml для неё verify_jwt = false. Клиент теперь дополнительно
   передаёт publishable key в Authorization, но правильная настройка — verify_jwt = false.

ШАГ 1. Диагностика — выполни и покажи результат ДО деплоя:
  SELECT count(*) AS form_leads_total,
         max(created_at) AS last_form_lead,
         count(*) FILTER (WHERE created_at > now() - interval '30 days') AS form_leads_30d
  FROM public.leads WHERE source = 'form';
  SELECT count(*) AS analytics_7d FROM public.analytics WHERE created_at > now() - interval '7 days';
И посмотри логи edge-функций за 7 дней:
  - submit-lead: сколько вызовов и с какой ошибкой («Page not found», column ... does not exist, null value in column ...);
  - track-analytics-event: коды ответов. Если тело 401 — {"code":401,"message":"Missing authorization header"}, это шлюз (verify_jwt).

ШАГ 2. Задеплой edge-функции submit-lead и track-analytics-event. У track-analytics-event должно быть verify_jwt = false
(как в supabase/config.toml). Больше ничего не меняй — ни схему, ни другие функции.

ШАГ 3. Проверка:
  - на демо-странице с блоком «Форма» отправь тестовую заявку (имя, телефон). В leads появилась строка:
    source='form', user_id = владелец страницы, metadata.page_id = id страницы, metadata.form_data с полями;
    владельцу пришёл Telegram (если бот привязан); заявка видна в дашборде во «Входящих».
  - открой любую опубликованную страницу в окне инкогнито → в analytics появилась строка event_type='view'
    (или аналогичная) за последние минуты; в консоли нет 401 на track-analytics-event.
  - удали тестовую заявку.

ШАГ 4. Отчёт: результаты шага 1, что задеплоено, результат шага 3.
```

Что уже исправлено в коде этим же PR (Lovable делать не нужно):
- превью блока «Свой код» в редакторе больше не выполняется от имени сайта (не может прочитать сессию);
- «Аналитика» считает конверсии из заявок по `metadata.page_id` (раньше запрос падал с 400);
- `widget_templates`, `expert_queries`, `product_events`: после первого ответа «таблицы нет» запросы прекращаются до конца сессии;
- CSP разрешает Google Maps и Vimeo — блоки «Карта» и Vimeo-видео снова показываются на публичных страницах.
