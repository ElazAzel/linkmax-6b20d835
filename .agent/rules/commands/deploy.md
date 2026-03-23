---
description: Развертывание приложения и Edge Functions
---

# Команда Deploy (Деплой)

Здесь описаны шаги для развертывания различных частей приложения lnkmx.my.

## 1. Деплой Фронтенда (обычно через CI/CD)

Фронтенд обычно развертывается через Vercel или Cloudflare Pages при пуше в ветку `main`.
- **Ручная сборка**: `npm run build`

## 2. Деплой Supabase Edge Functions

Чтобы развернуть функции в облако Supabase:
1. Убедитесь, что вы авторизованы: `npx supabase login`
2. Свяжите проект, если это не сделано: `npx supabase link --project-ref <project-id>`
3. Деплой конкретной функции: `npx supabase functions deploy <имя-функции> --no-verify-jwt` (если она публичная, например, вебхук).
   - *Пример*: `npx supabase functions deploy robokassa-webhook --no-verify-jwt`
4. Деплой всех функций: `npx supabase functions deploy`

## 3. Схема БД и Миграции

Чтобы отправить локальные миграции в удаленный проект:
1. Проверьте статус: `npx supabase status`
2. Отправьте миграции: `npx supabase db push`
