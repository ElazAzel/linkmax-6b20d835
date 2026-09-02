# Cloudflare Worker для SSR публичных страниц

Этот воркер отдает публичным маршрутам серверно-отрендеренный HTML через Edge Function `generate-sitemap`; sitemap и SSR живут в одном контуре, чтобы robots/canonical/schema-сигналы не расходились.

## Архитектура

```text
┌─────────────────┐
│  Входящий       │
│  запрос         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare Worker + Static Assets │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Public SSR route?   Private/static route?
    │                       │
    ▼                       ▼
┌─────────┐          ┌─────────────┐
│Supabase │          │ env.ASSETS  │
│Edge Fn  │          │ React SPA   │
└────┬────┘          └──────┬──────┘
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
npx --yes wrangler@4.127.1 --version
```

### 2. Авторизуйтесь в Cloudflare

```bash
npx --yes wrangler@4.127.1 login
```

### 3. Настройте wrangler.toml

```toml
name = "lnkmx-ssr-worker"
main = "prerender-worker.js"
compatibility_date = "2024-01-01"

[assets]
directory = "../dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = ["/*", "!/assets/*"]

routes = [
  { pattern = "lnkmx.my/*", zone_name = "lnkmx.my" }
]
```

### 4. Деплой

```bash
npm run build
npx --yes wrangler@4.127.1 versions upload --cwd cloudflare-worker
# Smoke-test the preview URL printed by Wrangler, then promote that version:
npx --yes wrangler@4.127.1 versions deploy <version-id>@100% --cwd cloudflare-worker --yes
```

## Тестирование

### Локальный запуск

```bash
npm run build
npx --yes wrangler@4.127.1 dev --cwd cloudflare-worker
```

### Проверка работы

```bash
# Googlebot - должен вернуть полный HTML
curl -H "User-Agent: Googlebot/2.1" https://lnkmx.my/elazart | head -50

# ChatGPT - должен вернуть полный HTML
curl -H "User-Agent: ChatGPT-User" https://lnkmx.my/elazart | head -50

# Публичный маршрут — SSR для любого user agent
curl https://lnkmx.my/elazart | head -50

# Приватный маршрут — SPA из Cloudflare Static Assets
curl https://lnkmx.my/dashboard | head -20

# Идентификатор работающего релиза
curl https://lnkmx.my/.well-known/linkmax-release.json

# Проверка заголовков для бота
curl -I -H "User-Agent: Googlebot" https://lnkmx.my/elazart
# Должен быть заголовок: X-SSR-Rendered: true
```

## Edge Function API

SSR контент генерируется через Edge Function:

```text
GET https://<project-ref>.supabase.co/functions/v1/generate-sitemap/ssr/{target}?lang={lang}
GET https://<project-ref>.supabase.co/functions/v1/generate-sitemap
POST https://<project-ref>.supabase.co/functions/v1/resolve-domain
```

Параметры:

- `target` - `landing`, `gallery`, `experts/{tag}`, `{slug}`, `{slug}/services/{serviceSlug}` или `{slug}/events/{eventId}`
- `lang` - язык (ru, en, kk), по умолчанию "ru"

Возвращает:

- `200` - полный HTML с meta тегами, JSON-LD и контентом
- `404` - страница не найдена или не опубликована

## SSR HTML включает

1. **Meta Tags**
   - `<title>` с именем и ролью
   - `<meta name="description">` из био
   - `<meta name="robots">` - `index, follow` или `noindex, follow` по quality gate и `is_indexable`
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

Воркер не отправляет следующие маршруты в SSR Edge Function, но обслуживает их через привязку `env.ASSETS`:

- `/api/*` - API эндпоинты
- `/dashboard` - Панель управления
- `/auth`, `/login`, `/signup` - Аутентификация
- `/editor` - Редактор
- Статические файлы (`.js`, `.css`, `.png`, `.jpg` и т. д.)
- SPA-маршруты, для которых `getSSRTarget` возвращает `null`

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
