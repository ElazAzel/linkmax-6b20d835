# Активация Cloudflare SSR Worker

## Зачем это нужно

Сейчас Facebook, Telegram, WhatsApp, LinkedIn и часть AI-краулеров (Perplexity, ChatGPT-User) видят **один и тот же** статичный `index.html` для любой страницы — потому что они не выполняют JavaScript. Из-за этого:

- Превью ссылок на `lnkmx.my/<username>` показывает общее описание LinkMAX, а не конкретного эксперта.
- Google индексирует страницы дольше и хуже ранжирует, поскольку начальный HTML одинаковый.

Edge Function `generate-sitemap` уже генерирует полноценный HTML с per-page `<title>`, `description`, `canonical`, OG, Twitter Card и JSON-LD (Person / LocalBusiness / FAQPage / BreadcrumbList). Осталось включить роутинг через Cloudflare Worker.

## Что уже готово

- `cloudflare-worker/prerender-worker.js` — маршрутизация всех публичных путей в SSR.
- `cloudflare-worker/wrangler.toml` — routes для `lnkmx.my/*` и `www.lnkmx.my/*` активированы.
- `.github/workflows/deploy-cloudflare-worker.yml` — автодеплой при push в `cloudflare-worker/**`.

## Одноразовая активация (≈ 5 минут)

### 1. Включить Proxy на DNS-записи

В Cloudflare → DNS → `lnkmx.my` и `www`: переключить иконку с серого облака **DNS Only** на оранжевое **Proxied**.

> ⚠️ Проверьте, что Supabase Auth callback URL по-прежнему работает (`https://lnkmx.my/auth/callback`). Worker пропускает `/auth/*` и `/api/*` без обработки, так что CORS на `*.supabase.co` не затрагивается.

### 2. Создать Cloudflare API Token

Cloudflare → My Profile → API Tokens → **Create Token** → шаблон **Edit Cloudflare Workers**. Скопировать токен.

### 3. Добавить 4 GitHub Secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**:

| Secret                          | Значение                                                |
| ------------------------------- | ------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`          | токен из шага 2                                         |
| `CLOUDFLARE_ACCOUNT_ID`         | Cloudflare → правая колонка дашборда                    |
| `CF_WORKER_SUPABASE_PROJECT`    | `pphdcfxucfndmwulpfwv`                                  |
| `CF_WORKER_SUPABASE_ANON_KEY`   | anon ключ Lovable Cloud (Settings → Cloud → API keys)   |

### 4. Запустить деплой

GitHub → Actions → **Deploy Cloudflare SSR Worker** → Run workflow. Либо просто запушить любое изменение в `cloudflare-worker/**`.

## Проверка

```bash
# Должен прийти заголовок X-SSR-Rendered: true
curl -sI -A "facebookexternalhit/1.1" https://lnkmx.my/ | grep -i ssr

# Превью для соц-сетей: Facebook Debugger
open "https://developers.facebook.com/tools/debug/?q=https://lnkmx.my/<любой_username>"

# Превью для Telegram: отправить ссылку в @WebpageBot
```

В ответе должны быть `og:title`, `og:description`, `og:image` именно этой страницы, а не общие.

## Откат

Если что-то пошло не так — Cloudflare → DNS → вернуть **DNS Only**. Worker перестанет получать трафик мгновенно, поведение откатится к текущему.
