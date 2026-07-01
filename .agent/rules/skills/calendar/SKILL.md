---
name: calendar
description: Google Calendar и бронирования в LinkMAX. Слоты, синхронизация, события.
---

# Calendar Skill

Интеграция календарей: создание слотов для блока Bookings, синхронизация с Google Calendar.

## Когда использовать

- Настройка блока Bookings на странице пользователя
- Создание событий в Google Calendar
- Проверка свободных слотов (free/busy)
- Синхронизация расписания

## Воркфлоу

### 1. Настройка Bookings-блока

Блок `bookings` позволяет клиентам бронировать слоты:

```typescript
interface BookingsBlock {
  type: 'bookings';
  settings: {
    duration: 30 | 60;        // минут на встречу
    daysAhead: number;        // на сколько дней вперёд
    workingHours: { start: string; end: string };
    calendarIntegration: 'google' | 'none';
  };
}
```

**Ключевые файлы:**
- `src/components/block-editors/calendar/` — редактор
- `src/components/blocks/BookingsBlock.tsx` — публичный вид
- `supabase/functions/check-availability/` — проверка слотов

### 2. Google Calendar API

Edge Function `sync-calendar`:
```typescript
// supabase/functions/sync-calendar/index.ts
// Использует googleapis для OAuth2 + создание событий
```

**Поток:** User OAuth → Refresh Token → Создание/обновление событий

### 3. Проверка слотов

```sql
-- booked_slots view
SELECT * FROM bookings
WHERE page_id = $1
  AND status = 'confirmed'
  AND start_time >= now()
  AND start_time < now() + interval '30 days';
```

## Связанные модули

- `content-creation` — описание услуг в слотах
- `communications` — уведомления о бронированиях
- `analytics` — события конверсии бронирований
