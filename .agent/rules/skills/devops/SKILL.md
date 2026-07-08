---
name: devops
description: CI/CD, инфраструктура и деплой LinkMAX. Supabase, GitHub Actions, Cloudflare Worker, Vercel.
---

# DevOps Skill

Управление инфраструктурой: базы данных, Edge Functions, CI/CD, деплой.

## Когда использовать

- Создание и применение миграций Supabase
- Деплой Edge Functions
- Настройка GitHub Actions / CI-пайплайнов
- Деплой на Cloudflare Worker (SSR, sitemap)
- Управление переменными окружения
- Откат изменений

## Воркфлоу

### 1. Миграции Supabase

```bash
# Создать миграцию
npx supabase db diff -f feature_name

# Применить локально
npx supabase db push

# Применить на прод (после PR)
npx supabase db push --db-url "$PROD_DB_URL"

# Откат
npx supabase db diff -f rollback_feature_name
```

**Правила:**
- Одна миграция = одно изменение (не смешивать)
- RLS-политики всегда в той же миграции, что и таблица
- Перед деплоем: `npm run quality:gate`

**Ключевые файлы:**
- `supabase/migrations/` — все миграции
- `supabase/config.toml` — конфигурация
- `supabase/seed.sql` — тестовые данные

### 2. Edge Functions

```bash
# Создать
npx supabase functions new function_name

# Локальный запуск
npx supabase functions serve function_name

# Деплой
npx supabase functions deploy function_name

# Логи
npx supabase functions logs function_name
```

**Структура функции:**
```typescript
// supabase/functions/function_name/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  const authHeader = req.headers.get("Authorization")!;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  // ...
});
```

### 3. GitHub Actions

Основные workflow (`.github/workflows/`):

| Файл | Назначение |
|---|---|
| `ci.yml` | Lint, typecheck, test на каждый PR |
| `deploy-supabase.yml` | Деплой миграций + функций |
| `deploy-cf-worker.yml` | Деплой Cloudflare Worker |
| `release.yml` | Сборка релиза + changelog |

### 4. Cloudflare Worker

```bash
cd cloudflare-worker
npx wrangler deploy
```

Worker обслуживает:
- SSR для ботов (prerender)
- Sitemap.xml
- Redirects (lnkmx.my → страницы)

### 5. Переменные окружения

Проверить `.env.example` при добавлении новых переменных.
Синхронизировать между:
- `.env` (локально)
- GitHub Secrets
- Supabase Dashboard → Edge Function secrets
- Cloudflare Dashboard → Worker secrets

## Команды

```bash
npm run dev              # Локальная разработка
npm run build            # Prod-сборка
npm run quality:check    # Полная проверка качества
npm run e2e              # E2E тесты
```

## Связанные модули

- `testing` — запуск тестов перед деплоем
- `changelog` — генерация релиз-нот после деплоя
