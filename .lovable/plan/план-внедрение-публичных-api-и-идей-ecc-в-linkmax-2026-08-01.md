# План: внедрение публичных API и идей ECC в LinkMAX

## Что изучено

**public-apis** — каталог бесплатных REST API с указанием Auth / HTTPS / CORS. Полезны те, что закрывают реальные дыры LinkMAX: медиа для редактора, валидация лидов, гео, превью ссылок, календарь-праздники, курсы валют.

**ECC** — «harness» для агентов: цикл plan → test → implement → review → verify, каталог скиллов и AgentShield (скан секретов/hooks/MCP). Полезна идея каталога и авто-валидации, а не сам код.

Что уже есть в проекте (не дублируем): `currency-rates` (Нацбанк РК + open.er-api.com фолбэк), гео по timezone с IP-фолбэком в `src/services/analytics.ts`, MCP-сервер с 5 инструментами, `.well-known/api-catalog`.

## Слой 1 — API-шлюз (единая обёртка)

Все внешние API вызываются только через edge-функции, никогда из браузера (ключи + CORS + кэш).

1. Новая функция `supabase/functions/external-api/index.ts` — прокси с allowlist провайдеров, таймаутом, кэшем в таблице `external_api_cache` (ключ + TTL) и лимитом на пользователя. Один код для всех интеграций ниже.

## Слой 2 — Конкретные API по фичам

2. **Медиа-библиотека в редакторе** — Unsplash + Pexels API: поиск бесплатных фото прямо в блоках Image/Cover/Hero, вместо только загрузки файла. Самая заметная фича для пользователя.
3. **Валидация лидов** — email через mailboxlayer (или бесплатный disify) + телефон через numverify: в `submit-lead`/`create-lead` помечать лид флагами `email_valid`, `phone_valid`, `phone_e164`, страна. Убирает спам-заявки и чинит формат номеров для WhatsApp-ссылок.
4. **Превью ссылок** — microlink.io: блок Link/SmartLink подтягивает title, favicon и картинку сайта → красивые карточки вместо голого URL.
5. **Скриншот-превью страниц** — thum.io / screenshotlayer: миниатюры пользовательских страниц для галереи шаблонов, дашборда и превью при шаринге.
6. **Праздники и часовые пояса** — Nager.Date + timezone-данные: блок Bookings автоматически закрывает нерабочие дни по стране (RU/KZ/UZ) и корректно считает слоты для клиента из другого часового пояса.
7. **Мультивалютные цены** — расширить существующий `currency-rates`: блоки Pricing/Offers показывают цену в валюте посетителя (KZT/RUB/UZS/USD) по гео, с фиксацией валюты расчёта в чеке.
8. **Гео-обогащение аналитики** — ipwho.is/ipapi как явный фолбэк с кэшем в `external-api`, чтобы город/страна в Insights не зависели только от timezone.
9. **Каталог стран/флагов** — restcountries: единый источник для селекторов страны и телефонных кодов в формах и настройках.

## Слой 3 — Каталог и открытость (формат public-apis)

10. **Страница `/integrations`** — каталог всех интеграций LinkMAX в стиле public-apis (категория, что даёт, нужен ли ключ, тариф), фильтры + JSON-LD. Даёт SEO-охват по запросам «LinkMAX + сервис».
11. **`public/.well-known/openapi.json` и страница `/docs/api`** — сейчас `api-catalog` и кнопка «View API Documentation» в настройках ведут на несуществующие `/docs/api` и `openapi.json`. Описать публичные endpoints (лиды, бронирование, события, health) + MCP-инструменты.
12. **CI-валидатор ссылок** (идея из public-apis) — `scripts/validate-api-catalog.mjs`: проверяет живость всех внешних и внутренних ссылок каталога, подключается в существующий quality gate.

## Слой 4 — Идеи ECC для процесса

13. **AgentShield-lite** — `scripts/agent-shield.mjs`: скан на секреты в коде, edge-функции без проверки JWT/подписи, лишние поля в MCP-манифесте. В CI как предупреждение.
14. **Skills-каталог** — добавить в `.agent/rules/skills/` домены под наш стек: `external-apis`, `seo-aeo`, `blocks-system`, `rls-security`.

## Технические детали

- Новые файлы: `supabase/functions/external-api/index.ts`, `src/lib/integrations/catalog.ts`, `src/pages/Integrations.tsx`, `src/pages/ApiDocs.tsx`, `public/.well-known/openapi.json`, `scripts/validate-api-catalog.mjs`, `scripts/agent-shield.mjs`, хук `src/hooks/useStockPhotos.ts`.
- Миграция: таблица `external_api_cache` (RLS: только service_role) + новые колонки валидации в `leads`.
- Ключи (Unsplash, Pexels, mailboxlayer, numverify, microlink) запрашиваются как секреты по мере включения фич; без ключа фича мягко отключается.
- Весь UI-текст через i18n (ru базовый + en/kk/uz), новые страницы добавляются в `scripts/generate-sitemap.mjs`.

## Порядок

Сначала слой 1 + пункты 2–4 (медиа-библиотека, валидация лидов, превью ссылок) — максимальная польза пользователю. Затем 5–9. Потом слой 3 (каталог и битые ссылки на API-докcы) и в конце слой 4.
