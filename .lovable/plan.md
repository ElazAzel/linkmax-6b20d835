# План: лучшие идеи из public-apis и ECC для LinkMAX

## Что реально даёт каждый репозиторий

**public-apis** — не библиотека, а образцовый каталог: строгий формат записи (Auth / HTTPS / CORS / описание), категории, авто-валидация ссылок в CI. Идея для нас: превратить LinkMAX в машиночитаемую, публично документированную платформу и одновременно получить SEO-каталог интеграций.

**ECC** — «операционная система» для AI-агентов: цикл `plan → test → implement → review → verify → remember → improve`, набор специализированных агентов/скиллов, hooks, память, и AgentShield (скан промптов, hooks, MCP-конфига, секретов). Идея для нас: усилить уже существующие `.agent/rules/*` и MCP-слой дисциплиной и безопасностью.

## Track 1 — Публичный API + каталог интеграций (из public-apis)

Сейчас `public/.well-known/api-catalog` ссылается на `https://lnkmx.my/docs/api` и `/.well-known/openapi.json`, но ни файла спецификации, ни страницы документации в проекте нет — ссылки битые.

1. **OpenAPI 3.1 спека** `public/.well-known/openapi.json` — описать публичные endpoints (публичная страница, отправка лида, бронирование, регистрация на событие, health) + существующие MCP-инструменты.
2. **Страница `/docs/api`** — человекочитаемая документация в стиле public-apis: таблица endpoint / auth / CORS / описание, примеры curl, локализация через i18n.
3. **`/integrations` каталог** — страница-каталог всех интеграций LinkMAX (Telegram, WhatsApp, Robokassa, Google Calendar, DocuSeal, Resend, MCP-агенты) в формате public-apis, с фильтрами по категории и JSON-LD. Даёт SEO-охват по запросам «X интеграция».
4. **CI-валидатор каталога** (по образцу их link-checker) — скрипт, проверяющий, что все ссылки из `api-catalog`, `llms.txt` и `/integrations` живые; подключить в существующий quality gate.

## Track 2 — Дисциплина агентов и безопасность (из ECC)

5. **Единый цикл в `.agent/rules`** — привести существующие роли к ECC-циклу `plan → test → implement → review → verify → remember`: у каждой роли явные входы, критерии приёмки и обязательное «доказательство» (тест/сборка).
6. **Skills-first**: добавить в `.agent/rules/skills/` отсутствующие домены под наш стек — `seo-aeo`, `blocks-system`, `rls-security`, `i18n` — по нашему же формату SKILL.md.
7. **AgentShield-lite** — скрипт `scripts/agent-shield.mjs`: скан репозитория на секреты в коде, небезопасные паттерны в edge-функциях (отсутствие проверки подписи/JWT), и проверка MCP-манифеста на утечку приватных полей. В CI как предупреждение.
8. **Memory-дисциплина** — правило: после каждой значимой задачи фиксировать решение в docs/ADR или память проекта, чтобы не повторять уже отменённые идеи.

## Track 3 — Публичный «MCP-каталог» LinkMAX (пересечение обеих идей)

9. Описать наши MCP-инструменты (`list_my_pages`, `list_my_leads`, `get_analytics_summary`, `mcp_create_user_page`, `get_page_structure`) в публичном каталоге + `llms.txt`, чтобы ChatGPT/Perplexity/Claude могли обнаруживать LinkMAX как инструмент, а не только как сайт.

## Технические детали

- Новые файлы: `public/.well-known/openapi.json`, `src/pages/ApiDocs.tsx`, `src/pages/Integrations.tsx`, `src/lib/integrations/catalog.ts`, `scripts/validate-api-catalog.mjs`, `scripts/agent-shield.mjs`.
- Роутинг через `react-router-dom` в `src/App.tsx`; весь текст — через i18n (ru базовый, en/kk/uz).
- Новые страницы добавляются в `scripts/generate-sitemap.mjs`.
- Изменений схемы БД и бизнес-логики нет — только документация, публичные страницы и dev-скрипты.

## Порядок реализации

Сначала Track 1 (пункты 1–4) — закрывает битые ссылки и даёт SEO-эффект. Затем Track 3 (9). Track 2 (5–8) — отдельным проходом, без влияния на прод.
