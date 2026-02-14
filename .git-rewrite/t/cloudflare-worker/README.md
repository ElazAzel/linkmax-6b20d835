# Cloudflare Worker для SSR публичных страниц

Этот воркер перенаправляет запросы от поисковых ботов и AI-краулеров на Edge Function `render-page` для получения серверно-отрендеренного HTML.

## Архитектура

```
┌─────────────────┐
│  Входящий       │
│  запрос         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare      │
│ Worker          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Bot?      Human
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ SSR     │ │ SPA     │
│ Edge Fn │ │ (React) │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────────────┐
│   HTML          │
│   Response      │
└─────────────────┘
```

## Поддерживаемые боты

### Поисковые системы
- Google (Googlebot)
- Bing (Bingbot)
- Yandex
- Baidu
- DuckDuckGo

### AI/Answer Engines (AEO/GEO)
- ChatGPT (GPTBot, ChatGPT-User)
- Claude (claude-web, anthropic-ai)
- Perplexity
- You.com
- Google Extended (Bard)
- Apple (Applebot)

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

### 3. Настройте wrangler.toml

```toml
name = "lnkmx-ssr-worker"
main = "prerender-worker.js"
compatibility_date = "2024-01-01"

routes = [
  { pattern = "lnkmx.my/*", zone_name = "lnkmx.my" }
]
```

### 4. Деплой

```bash
cd cloudflare-worker
wrangler deploy
```

## Тестирование

### Локальный запуск

```bash
wrangler dev
```

### Проверка работы

```bash
# Googlebot - должен вернуть полный HTML
curl -H "User-Agent: Googlebot/2.1" https://lnkmx.my/elazart | head -50

# ChatGPT - должен вернуть полный HTML
curl -H "User-Agent: ChatGPT-User" https://lnkmx.my/elazart | head -50

# Обычный пользователь - должен вернуть SPA
curl https://lnkmx.my/elazart | head -50

# Проверка заголовков для бота
curl -I -H "User-Agent: Googlebot" https://lnkmx.my/elazart
# Должен быть заголовок: X-SSR-Rendered: true
```

## Edge Function API

SSR контент генерируется через Edge Function:

```
GET https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/render-page?slug={slug}&lang={lang}
```

Параметры:
- `slug` - slug страницы (обязательно)
- `lang` - язык (ru, en, kk), по умолчанию "ru"

Возвращает:
- `200` - полный HTML с meta тегами, JSON-LD и контентом
- `404` - страница не найдена или не опубликована

## SSR HTML включает

1. **Meta Tags**
   - `<title>` с именем и ролью
   - `<meta name="description">` из био
   - `<meta name="robots">` - index, follow
   - Canonical URL
   - Hreflang (ru, en, kk, x-default)

2. **Open Graph**
   - og:title, og:description, og:image
   - og:url, og:type (profile)
   - og:site_name, og:locale

3. **Twitter Card**
   - summary_large_image
   - twitter:title, twitter:description
   - twitter:image

4. **JSON-LD Schema.org**
   - Person или LocalBusiness
   - WebPage
   - BreadcrumbList
   - FAQPage (если есть FAQ блок)
   - Service (если есть прайс)

5. **Видимый контент**
   - Имя и роль
   - Описание/био
   - Услуги/прайс
   - Ссылки
   - FAQ

## Исключения

Воркер НЕ обрабатывает:

- `/api/*` - API эндпоинты
- `/dashboard` - Панель управления
- `/auth`, `/login`, `/signup` - Аутентификация
- `/editor` - Редактор
- Статические файлы (.js, .css, .png, .jpg, etc.)
- Статические страницы (/, /gallery, /pricing) - уже имеют хороший HTML

## Мониторинг

В Cloudflare Dashboard → Workers → Analytics можно отслеживать:
- Количество запросов
- Процент ботов
- Время ответа
- Ошибки

## Troubleshooting

### Воркер не срабатывает
1. Проверьте routes в wrangler.toml
2. Убедитесь что DNS проксируется через Cloudflare (оранжевое облако)
3. Проверьте что домен добавлен в Cloudflare

### SSR возвращает ошибку
1. Проверьте Edge Function логи в Supabase Dashboard
2. Убедитесь что страница опубликована (is_published = true)
3. Проверьте slug - он должен совпадать точно

### Контент не обновляется
Edge Function кеширует ответ на 1 час. Для немедленного обновления:
- Измените slug страницы
- Дождитесь истечения TTL кэша (1 час)
