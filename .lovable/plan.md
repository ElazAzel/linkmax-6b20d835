План полного аудита LinkMAX

Цель: провести не только скан, но и практический аудит с исправлениями: база данных/RLS, backend-функции, frontend-XSS/CSP, зависимости, CI/build и документация по остаточным рискам.

## 1. Зафиксировать текущую картину

- Перезапустить security scan и сохранить список активных findings.
- Разделить findings на 3 группы:
  - реальные уязвимости, которые надо исправить;
  - intentional/by design публичные данные, которые надо документировать и пометить как принятый риск;
  - ложные/информационные срабатывания.
- Проверить, что предыдущая ошибка `package.json`/`quality:baseline` не вернулась, и что production build устанавливается/собирается.

Уже видно по скану:
- error: `teams.invite_code` виден всем, кто может читать публичные команды;
- error: `zones.calendar_feed_token` виден всем участникам зоны;
- warn: `telegram_bot_settings` доступна только service-role, нужно подтвердить/закрепить модель доступа;
- warn: множество публично читаемых объектов видны через GraphQL introspection;
- warn: CSP сейчас содержит `unsafe-inline`, `unsafe-eval`, широкие `img-src https: http:`;
- info/by design: контактные поля published pages публичны как CTA бизнес-страницы.

## 2. Исправить критичные проблемы в базе данных

### 2.1 Team invite codes

- Убрать возможность читать `invite_code` через обычный `SELECT teams` для `anon`/`authenticated`.
- Перевести чтение invite-кода в безопасный backend/RPC-путь только для owner/admin/team member с нужными правами.
- Проверить и обновить клиентский код, если где-то ожидается `invite_code` напрямую из `teams`.
- Оставить публичное чтение безопасных полей команды: `id`, `name`, `slug`, `description`, `avatar_url`, `niche`, `is_public`.

### 2.2 Zone calendar feed token

- Запретить чтение `calendar_feed_token` обычным участникам зоны.
- Дать доступ к токену только owner/admin через отдельную безопасную функцию или отдельную защищённую таблицу настроек.
- Проверить `calendar-feed` backend-функцию: токен должен валидироваться server-side, без раскрытия всем участникам.
- При необходимости добавить функцию регенерации токена для owner/admin.

### 2.3 Telegram bot settings

- Проверить все записи/чтения `telegram_bot_settings`: сейчас они идут через backend-функцию Telegram bot webhook.
- Если пользовательский UI не управляет этими настройками напрямую — оставить таблицу service-only, добавить constraints/индексы и пометить finding как accepted/intentional.
- Если UI должен управлять настройками — добавить scoped RLS-политики `user_id = auth.uid()` и обновить код.

### 2.4 GraphQL introspection exposure

- Проверить, используется ли GraphQL endpoint в приложении.
- Если GraphQL не используется — ограничить/отключить публичную GraphQL introspection-доступность на уровне прав.
- Если часть публичных объектов нужна — оставить только безопасные public views вместо прямого доступа к таблицам с чувствительными колонками.
- Все intentional public objects задокументировать и пометить в security findings.

## 3. Проверить RLS и multi-tenant boundaries

- Полный проход по всем таблицам с чувствительными данными:
  - `user_profiles`
  - `billing_history`
  - `token_transactions`, `user_tokens`, wallet tables
  - zone CRM tables
  - bookings/leads/event registrations
  - realtime tables: `zone_conversations`, `zone_messages`, `zone_automations`
- Проверить, что:
  - владельцы видят только свои данные;
  - участники зоны видят только свою зону;
  - admin-доступ идёт через `user_roles` + `has_role`, не через client-side флаги;
  - функции `SECURITY DEFINER` имеют `SET search_path = public` и внутренние проверки `auth.uid()`.
- Для realtime: либо подтвердить per-row RLS-фильтрацию, либо убрать лишние таблицы из realtime publication / сузить подписки.

## 4. Backend-функции и публичные endpoints

- Проверить каждую public backend-функцию с `verify_jwt = false`:
  - lead/booking формы;
  - webhooks;
  - SEO/public endpoints;
  - tracking pixel;
  - translate/public content.
- Для каждой функции проверить:
  - input validation и length limits;
  - rate limiting;
  - CORS;
  - отсутствие service-role утечек в ответах;
  - webhook signature/API-key validation там, где нужно.
- Усилить endpoints, где есть gaps: Zod/manual validation, status codes, safe error responses.

## 5. Frontend security audit

- Найти и проверить все места с:
  - `dangerouslySetInnerHTML` / `innerHTML`;
  - пользовательским HTML;
  - custom widgets / embedded code;
  - URL construction для WhatsApp/email/external links;
  - direct localStorage/sessionStorage.
- Исправить рискованные места:
  - DOMPurify перед HTML render/PDF generation;
  - `encodeURIComponent` для внешних URL;
  - безопасная storage utility вместо прямого storage, кроме явно допустимых recovery/auth случаев.

## 6. CSP и browser hardening

- Ужесточить CSP в `index.html`:
  - убрать `unsafe-eval`, если production build проходит;
  - добавить `object-src 'none'`, `base-uri 'self'`, `frame-ancestors`/`form-action`;
  - сузить `img-src`, где возможно;
  - сохранить только реально используемые third-party origins.
- Проверить, не ломаются Telegram OAuth, analytics, CAPTCHA, fonts, Lovable Cloud, AI gateway.

## 7. Dependencies, CI и build

- Запустить dependency/security audit через доступный registry/tooling.
- Проверить lockfiles: сейчас есть `bun.lock` и `package-lock.json`; определить безопасный единый install path для production/CI.
- Запустить:
  - typecheck;
  - lint/security tests;
  - unit tests;
  - production build.
- Исправить найденные build/CI проблемы, не трогая auto-generated backend client/types files.

## 8. Документация и security findings

- Обновить security documentation:
  - что публично by design: published page contacts/media;
  - какие таблицы service-only;
  - какие endpoints public и почему;
  - residual risks.
- Через security findings отметить исправленные issues как fixed.
- Для intentional findings добавить clear ignore reason, чтобы следующие сканы не возвращали их как незакрытые проблемы.

## Технические изменения, которые ожидаются после approve

- Database migration для column-level/table-level access hardening:
  - safe access к `teams.invite_code`;
  - restricted access к `zones.calendar_feed_token`;
  - возможное ограничение GraphQL/public grants;
  - optional secure RPC для invite/calendar token flows.
- Code changes в React/backend-функциях для новых безопасных путей чтения данных.
- CSP update в `index.html`.
- Санитизация HTML/PDF/custom content flows.
- Финальная проверка: security scan + build + typecheck + targeted tests.