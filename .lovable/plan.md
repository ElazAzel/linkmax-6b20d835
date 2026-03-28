

# Анализ аналитики профиля — найденные проблемы и план исправлений

## Найденные баги и проблемы

### 1. КРИТИЧНО: `sendBeacon` для `session_end` не работает
**Файл:** `src/services/analytics.ts:152-155`

`sendBeacon` отправляет POST на `/rest/v1/analytics` без заголовков авторизации (`apikey`, `Authorization`). Supabase требует как минимум `apikey` в query-параметрах. Результат: все `session_end` события молча теряются, и `avgSessionDuration` в дашборде всегда показывает дефолтное значение 45 секунд.

Для сравнения, `useLandingAnalytics.ts:272-273` делает это правильно — добавляет `?apikey=...` к URL.

**Исправление:** Добавить `?apikey=${VITE_SUPABASE_PUBLISHABLE_KEY}` к URL в `sendBeacon`, а также заголовок `Prefer: return=minimal`.

### 2. КРИТИЧНО: Конверсии всегда = 0
**Файл:** `src/hooks/analytics/usePageAnalytics.ts:331-351`

Три запроса на конверсии используют `.contains('metadata', { pageId: pageId })`:
- `leads` — имеет `metadata` JSONB, но `pageId` туда никогда не записывается (в `submit-lead` нет такого поля в metadata)
- `bookings` — вообще **не имеет** столбца `metadata` в схеме. Запрос падает молча.
- `event_registrations` — тоже **не имеет** `metadata`. Запрос падает молча.

**Исправление:** 
- Для `leads`: фильтровать по `user_id` (уже есть) без `contains`
- Для `bookings`: использовать `.eq('page_id', pageId)` вместо `contains`
- Для `event_registrations`: использовать `.eq('page_id', pageId)` вместо `contains`

### 3. ПРОБЛЕМА: `analytics_block_id_fkey` всё ещё в types.ts
Типы показывают FK `analytics.block_id → blocks.id`, хотя миграция `20260308010000` его удалила. Это может приводить к ошибкам INSERT если block_id не совпадает с реальным UUID из таблицы blocks (content-based IDs типа `profile-xxx`). Нужно проверить актуальное состояние БД.

### 4. ПРОБЛЕМА: `usePageAnalytics` берёт только первую страницу пользователя
**Файл:** `src/hooks/analytics/usePageAnalytics.ts:89-93`

`.maybeSingle()` возвращает первую страницу. Если у пользователя несколько страниц (pro-план до 6), аналитика показывается только для одной, произвольной.

**Исправление:** Передавать `pageId` явно из контекста дашборда, а не автоопределять.

### 5. ПРОБЛЕМА: Bounce Rate считается неверно
**Файл:** `src/hooks/analytics/usePageAnalytics.ts:288-291`

```ts
const bounceRate = ((totalViews - sessionsWithClicks) / totalViews) * 100
```

Это считает "просмотры без кликов" как отказы, но один пользователь может сгенерировать несколько view-событий. Правильнее считать по уникальным сессиям: сессия без клика = bounce.

### 6. ПРОБЛЕМА: Unique Visitors — ненадёжное вычисление
**Файл:** `src/hooks/analytics/usePageAnalytics.ts:181-184`

Считает уникальных по `metadata.ip`, но IP никогда не записывается в metadata (проверено в `trackEvent`). Фолбек `Math.ceil(totalViews * 0.7)` — грубая оценка. Реально нужно считать по `metadata.visitorId`.

### 7. МЕЛОЧЬ: Returning Visitors считается по view-событиям, а не сессиям
Если один visitorId имеет 2+ view-событий в одном визите, он уже считается "returning". Нужно группировать по `sessionId`.

### 8. МЕЛОЧЬ: `_sessionDurationTracked` — глобальный флаг
Если пользователь навигируется между страницами (SPA), `initSessionDurationTracking` вызовется только для первой страницы. Длительность сессии для последующих страниц не трекается.

## План исправлений

### Шаг 1. Починить `sendBeacon` для session_end
В `src/services/analytics.ts` — добавить apikey к URL и `Content-Type` через `Blob` headers.

### Шаг 2. Починить запросы конверсий  
В `src/hooks/analytics/usePageAnalytics.ts` — заменить `.contains('metadata', { pageId })` на `.eq('page_id', pageId)` для bookings и event_registrations, и убрать `contains` для leads (оставить только `user_id` фильтр).

### Шаг 3. Исправить подсчёт уникальных посетителей
Считать по `metadata.visitorId` вместо `metadata.ip`.

### Шаг 4. Исправить bounce rate
Группировать по `sessionId`: bounce = сессия с view но без click.

### Шаг 5. Исправить returning visitors
Считать visitorId, у которых >1 уникальных sessionId.

### Шаг 6. Передавать pageId явно в usePageAnalytics
Добавить параметр `pageId` в хук вместо автоопределения через запрос.

### Шаг 7. Сбросить `_sessionDurationTracked` при смене страницы
Привязать флаг к конкретному pageId.

### Оценка
- Шаги 1-2: критические, без них данные просто отсутствуют
- Шаги 3-5: метрики показывают мусор
- Шаги 6-7: edge cases для мультистраничных пользователей

