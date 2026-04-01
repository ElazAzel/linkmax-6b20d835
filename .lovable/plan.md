

# Исправление админ-панели: графики, 404-ошибки и дубли вкладок

## Обнаруженные проблемы

### 1. CartesianChart width/height = -1 (критично)
**Причина:** `AdminAnalyticsDashboard.tsx:207` использует `<ResponsiveContainer width="100%" height={350}>` без обёртки в `div` с фиксированной высотой. Когда вкладка скрыта (неактивный `TabsContent`), контейнер получает размеры -1. Recharts логирует warning на каждый рендер.

**Также:** Все графики внутри неактивных `TabsContent` (и вложенных `Tabs` внутри `AdminAnalyticsDashboard`) рендерятся с нулевыми размерами, вызывая 15+ warnings в консоли.

**Решение:**
- В `AdminAnalyticsDashboard.tsx:207` — обернуть `ResponsiveContainer` в `div` с `h-[350px]`
- Добавить `forceMount` или ленивую инициализацию: не рендерить графики пока вкладка не активна. Простейший вариант — `minHeight={0}` на `ResponsiveContainer` (подавляет warning, но графики всё равно не рисуются)

### 2. 404 ошибки: `bot_config` и `send_telegram_broadcast` (критично)
**Причина:** `AdminBroadcastTab.tsx` обращается к несуществующей таблице `bot_config` и несуществующей RPC-функции `send_telegram_broadcast`. Telegram-бот работает через connector gateway (`_shared/telegram.ts`), а не через `bot_config` таблицу.

**Решение:** Переписать `AdminBroadcastTab` — убрать `bot_config` и `send_telegram_broadcast` RPC. Broadcast должен вызывать существующую Edge Function `broadcast-update` через `supabase.functions.invoke('broadcast-update', { body: { text } })`.

### 3. Дубли вкладок в Admin (баг UI)
**Файл:** `src/pages/Admin.tsx:90-105`
- Вкладка `analytics` (строка 95) → рендерит `AdminCharts`
- Вкладка `charts` (строка 96) → рендерит `AdminCharts` **тот же самый компонент**
- Это дубль. Нужно убрать одну из вкладок.

### 4. `window.confirm()` в AdminBroadcastTab (UX)
**Файл:** `AdminBroadcastTab.tsx:65` — `if (!confirm(confirmMsg))` — нативный диалог.

---

## План исправлений

### Шаг 1. Убрать дубль вкладки `analytics`/`charts`
В `Admin.tsx`:
- Убрать вкладку `charts` (строка 96) и соответствующий `TabsContent` (строки 191-193)
- Вкладка `analytics` уже рендерит `AdminCharts` — этого достаточно

### Шаг 2. Исправить CartesianChart -1 dimensions
В `AdminAnalyticsDashboard.tsx:207`:
- Заменить `<ResponsiveContainer width="100%" height={350}>` на обёртку `<div className="h-[350px]"><ResponsiveContainer width="100%" height="100%">`
- Это стандартный паттерн, используемый во всех остальных графиках

### Шаг 3. Переписать AdminBroadcastTab
Убрать обращения к `bot_config` и `send_telegram_broadcast`. Вместо этого:
- Убрать секцию Bot Token (токен управляется через connector, не через таблицу)
- Broadcast вызывать через `supabase.functions.invoke('broadcast-update', { body: { text: message } })`
- Заменить `window.confirm()` на `AlertDialog`
- Показывать результат из ответа edge function (success/failed counts)

### Шаг 4. Проверить пользовательскую аналитику
`AnalyticsChart.tsx` и `InsightsScreen.tsx` используют правильный паттерн (`div.h-48 > ResponsiveContainer width="100%" height="100%"`) — тут проблем нет.

## Затронутые файлы
- `src/pages/Admin.tsx` — убрать дубль вкладки (~4 строки)
- `src/components/admin/AdminAnalyticsDashboard.tsx` — обернуть ResponsiveContainer (~2 строки)
- `src/components/admin/AdminBroadcastTab.tsx` — переписать (~100 строк)

