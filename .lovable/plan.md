

## Анализ и план: Аналитика + Бизнес-Зона

### Критические баги аналитики (найдены)

**1. `increment_block_clicks` — NO-OP**
Миграция `20260217` перезаписала рабочую функцию пустышкой (`null;`). Клики блоков **не инкрементируются** в таблице `blocks`. Нужна миграция с реальной логикой.

**2. `increment_view_count` — конфликт параметров**
Код вызывает `rpc('increment_view_count', { page_slug })`, но миграция `20260217` создала функцию с параметром `page_id uuid` — вызов с `page_slug` **молча падает**. Нужно пересоздать функцию с `page_slug TEXT`.

**3. `increment_block_clicks` — несовпадение параметра**
Код вызывает `{ block_uuid: blockId }`, но типы в `types.ts` тоже говорят `block_uuid`. Нужно убедиться, что DB-функция принимает `block_uuid` (а не `block_id`).

**4. Таблица `experiments` не существует**
Консоль: `Could not find the table 'public.experiments'`. Миграция существует, но таблица не создана. Нужно пересоздать.

### Что не реализовано в Бизнес-Зоне

| Модуль | Статус |
|---|---|
| Product/Catalog → Сделки при покупке | Нет UI-интеграции, триггер pricing→products есть |
| Каталог продуктов (UI экран в зоне) | Хук есть, UI экрана нет |
| Отчёты / экспорт аналитики зоны | Нет |
| Уведомления зоны (in-app) | Нет |
| Лог звонков / коммуникаций в контакте | Нет |

### План реализации

#### Фаза 1 — Починка аналитики (миграция)
Одна SQL-миграция:
- Пересоздать `increment_block_clicks(block_uuid TEXT)` с реальной логикой `UPDATE blocks SET click_count = click_count + 1`
- Пересоздать `increment_view_count(page_slug TEXT)` с `UPDATE pages SET view_count = view_count + 1 WHERE slug = page_slug`
- Создать таблицу `experiments` + `experiment_variants` (из существующей миграции) с RLS
- GRANT EXECUTE на все функции для `anon, authenticated, service_role`

#### Фаза 2 — Каталог продуктов в Зоне (UI)
- Новый `ZoneProductsScreen.tsx` — таблица продуктов зоны с CRUD (добавление/редактирование/удаление)
- Добавить вкладку «Продукты» в навигацию дашборда
- Хук `useZoneProducts` уже готов

#### Фаза 3 — Уведомления в зоне
- Таблица `zone_notifications` (zone_id, user_id, type, title, body, is_read, created_at)
- Колокольчик в header зоны с badge-счётчиком непрочитанных
- Триггеры для создания уведомлений при: новый контакт, новая сделка, просроченная задача

#### Фаза 4 — Лента коммуникаций на контакте
- Таблица `zone_contact_notes` (contact_id, zone_id, type: 'note'|'call'|'email'|'meeting', content, created_by)
- UI: timeline в карточке контакта для заметок, звонков, встреч

### Локализация
Все новые строки через `t()` с ключами `zone.products.*`, `zone.notifications.*`, `zone.contacts.notes.*`.

### Порядок
1. **Миграция** — починка `increment_block_clicks`, `increment_view_count`, создание `experiments`
2. **ZoneProductsScreen** — UI каталога + навигация
3. **zone_notifications** — таблица + UI колокольчика
4. **zone_contact_notes** — таблица + timeline в контакте

