# Промт для Lovable: вернуть онлайн-запись (этап 1.1)

Вставь блок ниже в Lovable целиком. Это быстрый шаг: он возвращает запись без новых таблиц. Полный возврат (депозиты, ссылка «управлять записью», мастер для бьюти) — отдельной консолидированной миграцией на следующем шаге.

```
Контекст: публичная онлайн-запись, скорее всего, не работает давно. Edge-функция submit-booking проверяла двойную запись по колонке bookings.staff_id и создавала запись через RPC create_public_booking — ни колонки, ни функции в базе нет. Уведомление send-booking-notification тоже читает отсутствующие колонки и пишет в отсутствующую notification_queue. В коде (ветка lovable-fallback после мержа этого PR) submit-booking теперь сама создаёт запись существующими колонками, создаёт лид и шлёт владельцу Telegram, если нужных объектов нет.

ШАГ 1. Диагностика — выполни и покажи результат ДО деплоя:
  SELECT max(created_at) AS last_booking,
         count(*) FILTER (WHERE created_at > now() - interval '30 days') AS last_30_days
  FROM public.bookings;
  SELECT column_default FROM information_schema.columns
  WHERE table_schema='public' AND table_name='bookings' AND column_name IN ('status','payment_status');
И посмотри логи edge-функции submit-booking за последние 30 дней: сколько вызовов и с какой ошибкой они падали («Could not verify availability», «Authoritative booking RPC failed» и т.п.).

ШАГ 2. Задеплой обновлённые edge-функции: submit-booking и robokassa-webhook. Больше ничего не меняй — ни схему, ни другие функции.

ШАГ 3. Проверка:
  - открой публичную страницу с блоком «Запись» (без привязанных услуг), выбери слот, запишись тестовым клиентом;
  - в bookings появилась строка, в leads — лид с metadata.booking_id, владельцу пришёл Telegram (если бот привязан);
  - повторная запись на тот же слот возвращает «слот занят»;
  - удали тестовую запись и лид.

ШАГ 4. Правило на будущее: с 29.09 роль authenticated читает public.pages только по списку колонок (webhook_url/webhook_secret скрыты). Любая миграция, которая добавляет колонку в pages, обязана в той же миграции выдать её:
  GRANT SELECT (<колонка>) ON public.pages TO authenticated;
Иначе редактор и дашборд получат «permission denied». В репозитории это проверяет тест src/domain/pages/__tests__/pages-column-grants-sql-contract.test.ts.

ШАГ 5. Отчёт: результаты шага 1, что задеплоено, результат шага 3.
```
