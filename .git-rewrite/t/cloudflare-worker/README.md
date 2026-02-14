# Cloudflare Worker для Prerender.io

Этот воркер перенаправляет запросы от поисковых ботов и AI-краулеров на Prerender.io для получения pre-rendered HTML.

## Поддерживаемые боты

### Поисковые системы
- Google (Googlebot)
- Bing (Bingbot)
- Yandex
- Baidu
- DuckDuckGo

### AI/Answer Engines (AEO/GEO)
- ChatGPT (GPTBot, ChatGPT-User)
- Claude (claude-web)
- Perplexity
- You.com
- Meta AI

### Социальные сети
- Facebook
- Twitter/X
- LinkedIn
- Pinterest
- Telegram
- WhatsApp
- Discord
- VK

## Установка

### 1. Установите Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Авторизуйтесь в Cloudflare

```bash
wrangler login
```

### 3. Добавьте секретный токен

```bash
cd cloudflare-worker
wrangler secret put PRERENDER_TOKEN
# Введите: 0viuc489f58Vc5A0G7q9
```

### 4. Настройте роутинг

Отредактируйте `wrangler.toml` и раскомментируйте routes:

```toml
routes = [
  { pattern = "lnkmx.my/*", zone_name = "lnkmx.my" }
]
```

### 5. Деплой

```bash
wrangler publish
```

## Тестирование

### Локальный запуск

```bash
wrangler dev
```

### Проверка работы

```bash
# Googlebot
curl -H "User-Agent: Googlebot/2.1" https://lnkmx.my/ | head -50

# ChatGPT
curl -H "User-Agent: ChatGPT-User" https://lnkmx.my/test-slug | head -50

# Perplexity
curl -H "User-Agent: PerplexityBot" https://lnkmx.my/ | head -50

# Проверка заголовков
curl -I -H "User-Agent: Googlebot" https://lnkmx.my/
# Должен быть X-Prerendered: true
```

## Логика работы

```
┌─────────────────┐
│  Incoming       │
│  Request        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check User-Agent│
│ (Bot detection) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Bot?      Human
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│Prerender│ │ Origin  │
│.io      │ │ Server  │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────────────┐
│   Response      │
└─────────────────┘
```

## Исключения

Воркер НЕ обрабатывает:

- `/api/*` - API эндпоинты
- `/dashboard` - Панель управления
- `/auth`, `/login`, `/signup` - Аутентификация
- `/editor` - Редактор
- Статические файлы (.js, .css, .png, .jpg, etc.)

## Мониторинг

В Cloudflare Dashboard → Workers → Analytics можно отслеживать:
- Количество запросов
- Процент ботов
- Время ответа
- Ошибки

## Инвалидация кэша

Для обновления кэша страницы после публикации:

```bash
curl -X POST "https://api.prerender.io/recache" \
  -H "Content-Type: application/json" \
  -d '{
    "prerenderToken": "0viuc489f58Vc5A0G7q9",
    "url": "https://lnkmx.my/your-slug"
  }'
```

## Troubleshooting

### Воркер не срабатывает
1. Проверьте routes в wrangler.toml
2. Убедитесь что DNS проксируется через Cloudflare (оранжевое облако)

### Prerender возвращает ошибку
1. Проверьте токен: `wrangler secret list`
2. Проверьте IP в белом списке Prerender.io
3. Проверьте лимиты аккаунта Prerender.io

### Контент не обновляется
Используйте API recache после публикации или подождите TTL кэша.
