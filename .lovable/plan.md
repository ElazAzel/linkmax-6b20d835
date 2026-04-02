

# Полный аудит и исправление Telegram-бота

## Критические проблемы (бот полностью не работает)

### 1. `telegram-bot-webhook` — СЛОМАН (ReferenceError)
**Строка 405**: `createClient(supabaseUrl!, supabaseServiceKey!)` — переменные `supabaseUrl` и `supabaseServiceKey` **нигде не объявлены** в файле. Нет ни `const`, ни `Deno.env.get()`. Функция падает с ReferenceError на каждый входящий update.
**Результат**: Все команды (/start, /stats, /leads, /bookings и т.д.) не работают.
**Исправление**: Добавить `const supabaseUrl = Deno.env.get('SUPABASE_URL')` и `const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` перед строкой 405.

### 2. Gateway возвращает 401 Unauthorized
Логи показывают: `Telegram API sendMessage failed [401]: {"ok":false,"error_code":401,"description":"Unauthorized"}`. Это означает, что токен бота в коннекторе невалиден или истёк. Нужна **переподключение** Telegram коннектора с актуальным токеном от BotFather.

### 3. `broadcast-update` — СЛОМАН (sendMessage возвращает JSON, не Response)
**Строки 74-82**: `const response = await sendMessage(...)` — затем проверяется `response.ok` и вызывается `response.json()`. Но `sendMessage` из `_shared/telegram.ts` возвращает **parsed JSON** (через `callTelegram` → `response.json()`), а не Response объект. `response.ok` будет проверять `{ok: true}` из Telegram API (это случайно работает), но `response.json()` на строке 79 вызовет TypeError т.к. это уже не Response.
**Исправление**: Убрать `await response.json()`, использовать parsed data напрямую.

### 4. `send-zone-notification` — баг с res.ok
**Строка 134**: `if (res.ok) sentCount++` — `sendMessage` возвращает parsed JSON из Telegram API, где `ok` — boolean. Это **случайно работает**, но если sendMessage выбросит исключение (что она делает при !response.ok), то catch обработает. Этот код на самом деле корректен, но нужно учитывать что `sendMessage` бросает ошибку при неуспехе, а при успехе возвращает `{ok: true, result: {...}}`.

## Проблемы средней критичности

### 5. `broadcast-update` — нет webhook регистрации
Бот не получает updates потому что webhook не зарегистрирован через `setWebhook`. Telegram не знает куда отправлять сообщения. Нужно:
- Либо зарегистрировать webhook: `callTelegram('setWebhook', { url: 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/telegram-bot-webhook' })`
- Либо использовать polling (уже описан в ADR, но не реализован)

### 6. `userActionStore` — in-memory state в edge function
**Строка 271**: `const userActionStore: Record<string, string | null> = {}` — edge functions stateless, эта Map сбрасывается при каждом cold start. Команды `/edit_bio` и `/add_link` (которые ждут следующего сообщения) никогда не работают.
**Исправление**: Сохранять pending action в таблицу `telegram_bot_settings` (колонка `pending_action`).

### 7. `tempLanguageStore` — аналогично in-memory
**Строка 252**: Fallback для языка тоже не персистится.

## План исправлений

### Шаг 1: Переподключить Telegram коннектор
Попросить пользователя переподключить коннектор с валидным токеном от BotFather — это root cause для 401 ошибок.

### Шаг 2: Исправить `telegram-bot-webhook`
- Добавить `Deno.env.get()` для supabaseUrl и supabaseServiceKey
- Заменить in-memory `userActionStore` на DB-backed через `telegram_bot_settings.pending_action`
- Удалить `tempLanguageStore`

### Шаг 3: Исправить `broadcast-update`
- Убрать `response.ok` / `response.json()` проверки — `sendMessage` уже бросает ошибку при неуспехе, при успехе возвращает parsed JSON

### Шаг 4: Добавить edge function для регистрации webhook
- Создать утилитарный endpoint или добавить в webhook функцию обработку `?action=register` для вызова `setWebhook`

### Шаг 5: Миграция — добавить `pending_action` в `telegram_bot_settings`
- `ALTER TABLE telegram_bot_settings ADD COLUMN IF NOT EXISTS pending_action text`

### Шаг 6: Передеплоить все функции
- `telegram-bot-webhook`
- `broadcast-update`
- `send-social-notification` (работает, но 401 из-за токена)
- `send-lead-notification`
- `send-booking-notification`
- `send-team-notification`
- `send-zone-notification`

## Затронутые файлы
- `supabase/functions/telegram-bot-webhook/index.ts` — критический фикс + persistence
- `supabase/functions/broadcast-update/index.ts` — фикс response handling
- Миграция: `pending_action` column

