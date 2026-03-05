

## Аудит текущих интеграций блоков с Бизнес-Зоной

### Что уже сделано
| Интеграция | Статус |
|---|---|
| Booking → Контакты CRM (DB триггер) | ✅ Готово |
| Event → Контакты CRM (DB триггер) | ✅ Готово |
| Newsletter → Контакты CRM (DB триггер) | ✅ Готово |
| Календарь записей (Outlook-стиль) | ✅ UI готово |
| Панель управления ивентами | ✅ UI готово |

### Что НЕ сделано (из согласованного плана)
| Интеграция | Статус |
|---|---|
| Form → Контакты CRM | ❌ Нет триггера |
| Product/Catalog → Сделки + Инвойсы | ❌ Не реализовано |
| Pricing → Zone Products синхронизация | ❌ Не реализовано |
| Event → Сделки (платные регистрации) | ❌ Не реализовано |
| Google Calendar sync (edge function — только заглушка) | ❌ Заглушка |
| Apple Calendar / ICS экспорт из зоны | ❌ Нет |

---

## План реализации

### 1. Form → Контакты CRM
Миграция: DB-триггер `trg_form_submission_sync_contact` на таблицу `form_submissions` (или `leads`), аналогичный существующим триггерам для booking/event/newsletter.

### 2. Event (платные) → Сделки
Миграция: DB-триггер на `event_registrations` — при `is_paid = true` и `payment_status = 'paid'` автоматически создавать запись в `zone_deals` со стадией «Оплачен».

### 3. Product/Catalog → Сделки + Инвойсы
Новый edge function `sync-product-purchase` — при покупке товара через блок Product/Catalog создавать сделку и инвойс в зоне. Фронтенд: кнопка «Создать сделку» в карточке продукта внутри зоны.

### 4. Pricing → Zone Products
Миграция: триггер на `blocks` — при сохранении блока `pricing` автоматически upsert записей в `zone_products` для синхронизации прайс-листа.

### 5. Google Calendar — полноценная синхронизация
**Архитектура:**
- Таблица `user_integrations` уже существует для хранения OAuth refresh-токенов
- Edge function `google-calendar-sync` — заменить заглушки реальными вызовами Google Calendar API
- Действия: `exchange_code` (OAuth flow), `push_booking` (создать событие при новом бронировании), `pull_busy_slots` (получить занятые слоты для блока Booking)
- Секреты: потребуются `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`
- UI: кнопка «Синхронизировать с Google Calendar» в ZoneBookingsCalendarScreen + индикатор статуса

### 6. Apple Calendar / ICS экспорт
- Утилита `calendar-utils.ts` уже содержит `generateICS`, `getGoogleCalendarUrl`, `getOutlookCalendarUrl`
- Добавить в ZoneBookingsCalendarScreen кнопки: «Экспорт .ics» (Apple Calendar), «Добавить в Google Calendar», «Добавить в Outlook»
- Подписка CalDAV (.ics feed): новый edge function `calendar-feed` — генерирует `.ics` фид по URL для подписки в Apple Calendar / Google Calendar (read-only)

### 7. Локализация
Все новые строки UI добавляются через `t()` с ключами `zone.calendar.*`, `zone.integrations.*`, `zone.sync.*`.

---

### Порядок реализации
1. Form → Контакты (миграция, 1 триггер)
2. Event → Сделки (миграция, 1 триггер)  
3. ICS экспорт из календаря зоны (UI кнопки, без бэкенда)
4. CalDAV feed edge function (подписка на календарь)
5. Google Calendar OAuth flow (секреты + edge function)
6. Product/Catalog → Сделки (триггер + UI)
7. Pricing → Zone Products (триггер)

### Технические требования
- **Google Calendar**: потребуется `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` через secrets
- **ICS feed**: публичный endpoint, JWT не требуется, доступ по уникальному токену зоны
- **Миграции**: 3 новых триггера + 1 edge function + обновление существующей edge function

