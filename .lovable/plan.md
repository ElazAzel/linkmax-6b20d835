## Цель

Сделать модуль «Бизнес-Зоны» полностью рабочим: устранить все ошибки 400 в network-логе, добавить недостающие таблицы, привести экраны в порядок, проверить безопасность (RLS) и edge-функции, обновить memory (Stop List сейчас официально замораживает зоны — но пользователь явно просит реактивировать).

## Что сейчас сломано (подтверждено)

В network-логах текущей сессии видны ошибки 400 от PostgREST:

```text
GET zone_deals?...&deleted_at=is.null  → 400  column zone_deals.deleted_at does not exist
GET zone_tasks?...&deleted_at=is.null  → 400  column zone_tasks.deleted_at does not exist
```

Дополнительный аудит хуков и БД выявил, что в коде используются **5 таблиц**, которых **нет в БД**, но коде они есть с приведением `as any`, поэтому ошибка вылезает только в рантайме:

- `zone_task_checklist`
- `zone_task_comments`
- `zone_deal_products`
- `zone_resources`
- (events/bookings таблицы зон — экраны существуют, но используют общие `bookings`/`events` без `zone_id`)

Из-за этого экраны Канбан, Задачи, Карточка сделки (товары/комментарии), Календарь ресурсов — пустые/падают.

Стратегический контекст: в memory зафиксирован «Stop List» по Бизнес-Зонам (заморожены, скрыты из навигации, фокус на Service Sales Workflow). Пользователь явно просит снова сделать рабочим — обновим memory.

## План работ (4 этапа)

### Этап 1. Миграция БД — фундамент

Создаём одну миграцию со всеми schema-изменениями.

1. **Soft-delete колонки** на основных таблицах:
   - `zone_deals.deleted_at timestamptz null`
   - `zone_tasks.deleted_at timestamptz null`
   - `zone_invoices.deleted_at timestamptz null`
   - `zone_documents.deleted_at timestamptz null`
   - `zone_contacts.deleted_at timestamptz null`
   - индексы `WHERE deleted_at IS NULL` для горячих выборок.

2. **Новые таблицы** (с RLS через `is_zone_member`/`is_zone_admin`, аналогично существующим политикам):
   - `zone_task_checklist (id, task_id, zone_id, title, is_done, order_index, created_at)`
   - `zone_task_comments (id, task_id, zone_id, user_id, content, created_at, updated_at)`
   - `zone_deal_products (id, deal_id, zone_id, product_id, quantity, unit_price, subtotal, created_at)`
   - `zone_resources (id, zone_id, name, type, color, capacity, created_at)` — для календаря ресурсов.

3. **RLS-политики** для каждой новой таблицы:
   - SELECT: `is_zone_member(zone_id, auth.uid())`
   - INSERT/UPDATE/DELETE: `is_zone_member` или `is_zone_admin` (по аналогии с существующими).

4. **Триггеры** `updated_at` где нужно (`zone_task_comments`).

### Этап 2. Синхронизация фронтенда с БД

1. **Хуки** — убедиться, что после миграции существующий код в `useZoneDeals`, `useZoneTasks`, `useZoneResources`, `useZoneDealProducts` и т. д. работает. Удалить `as any` каст там, где после регенерации типов он больше не нужен.

2. **Экраны зон** — пройти каждый и подтвердить рабочее состояние:
   - `ZoneDashboard` — KPI, последние сделки/задачи
   - `ZoneDealsScreen` — Канбан + bulk-операции + drag-and-drop стадий
   - `ZoneTasksScreen` — список + чек-листы + комментарии
   - `ZoneContactsScreen` — CRUD контактов
   - `ZoneInboxScreen` — Telegram-conversations
   - `ZoneInvoicesScreen` — Robokassa-инвойсы
   - `ZoneDocumentsScreen` — шаблоны и сгенерированные документы
   - `ZoneAutomationsScreen` — триггеры (run-zone-automations edge function)
   - `ZoneAnalyticsScreen` — графики
   - `ZoneSettingsScreen` — план, участники, инвайты, биллинг
   - `ZoneEventsScreen`, `ZoneProductsScreen`, `ZoneBookingsCalendarScreen` — связь с zone_id.

3. **Empty-states**: где данных нет — показать SmartEmptyState с CTA (по стандарту `mem://design/smart-empty-states-standard`), а не белый экран.

4. **Skeleton**: проверить, что во время загрузки нет «прыжков», все экраны имеют единый header (по стандарту `mem://design/dashboard-header-slots`).

### Этап 3. Возврат навигации + RLS-аудит

1. **Навигация Business-Zone** в `DashboardSidebar` и `DashboardBottomNav` уже жёстко закрыта `canUseBusinessZone()` — оставляем как есть (только Business-tier видит). Но убедимся, что для Business-пользователя пункты доступны и все табы (`zone-dashboard`, `zone-deals`, …, `zone-settings`) ведут на рабочие экраны.

2. **RLS-аудит**: запустим Supabase linter, прогоним RLS-проверки для всех `zone_*` таблиц, особенно для новых. Убедимся, что `is_zone_member` использует SECURITY DEFINER (предотвращение recursion).

3. **Edge-функции** `run-zone-automations` и `send-zone-notification` — проверим, что они находят существующие данные и не падают на новых таблицах.

### Этап 4. Memory & документация

1. Обновить `mem://product-strategy/development-stop-list-updated` — снять флаг «заморожены» с Бизнес-Зон, отметить, что теперь это рабочий B2B-модуль для Business-tier (>1 пользователя в команде).
2. Создать `mem://product/business-zones-active-2026` — короткое summary: что такое Бизнес-Зона, какие модули, какой тариф, какие RLS-предположения.
3. Краткая запись в `docs/features/` — список модулей зоны и edge-функций.

## Технические детали

- **Миграция SQL** — одна транзакция; все ALTER + CREATE TABLE + CREATE POLICY + CREATE INDEX.
- **Совместимость**: `deleted_at IS NULL` — все существующие строки автоматически попадут в выборку.
- **Типы Supabase** (`src/integrations/supabase/types.ts`) перегенерируются автоматически после миграции — далее `as any` касты в хуках можно убрать постепенно.
- **Тесты**: smoke-проверка вручную через preview (Канбан, добавление задачи, чек-лист, комментарий, инвойс, документ).
- **Не трогаем**: `zone_events`, `zone_bookings_calendar`, `zone_messages`/`zone_conversations` — они уже существуют и работают через свои таблицы (`bookings`/`events` с `zone_id` или собственные `zone_messages`).

## Что получит пользователь

- Канбан сделок открывается без ошибок 400, drag-and-drop работает.
- Задачи: создание, чек-листы, комментарии, удаление — рабочее.
- Карточка сделки: список товаров и комментарии не падают.
- Инвойсы и документы получают «корзину» (soft-delete).
- Контакты не теряются при удалении.
- Все экраны имеют единый header и пустые состояния.
- RLS чистая, проходит linter, изоляция между зонами гарантирована.
- Memory обновлена — будущие сессии знают, что Бизнес-Зоны снова активны.

## Ожидаемое время

Большой объём, ориентир: 1 миграция + ~10 файлов хуков/экранов + 2 memory-файла. Должно уложиться в одну итерацию default-mode.
