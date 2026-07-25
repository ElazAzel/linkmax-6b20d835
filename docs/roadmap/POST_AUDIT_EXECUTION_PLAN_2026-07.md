# План после технического аудита

Дата: 2026-07-25

## Цель

Вернуть предсказуемые поставки LinkMAX: каждый pull request должен проходить
воспроизводимые проверки, а ключевые сценарии публичной страницы, редактора,
авторизации и платежей должны быть покрыты изолированными тестами.

## Текущее состояние

- CI был заблокирован рассинхронизацией `package.json` и `package-lock.json`.
- Quality и unit jobs использовали Node 20, хотя часть зависимостей требует Node 22.
- E2E setup предполагал автоматический redirect после входа, которого UI не делает.
- MCP code generation на Windows создаёт непереносимый `npm:` import с абсолютным путём.
- В кодовой базе остаётся накопленный долг: 1 243 lint warnings, 2 352 literal UI strings
  и 910 находок Knip. Базовые пороги отражают текущий факт, но не являются целевыми.

## Phase 0: Release Health (1 неделя)

1. Слить и запустить исправления CI: синхронизированный lockfile и Node 22 во всех jobs.
2. Проверить GitHub Actions после push: Quality Checks, Unit Tests, Build Check и Deploy.
3. Настроить отдельные GitHub Environments `staging` и `production`; проверить наличие
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_PROJECT_ID`, `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`.
4. Добавить health-check после каждого deployment: главная страница, `/auth`, MCP function
   и одна опубликованная страница.
5. Включить branch protection для `main`: обязательны quality, unit, build и быстрый E2E smoke.

Критерий готовности: `main` имеет зелёный CI на чистом `npm ci`, а deployment сообщает
действительную причину отсутствующего секрета или завершается успешно.

## Phase 1: Test Architecture (2 недели)

1. Разделить Playwright на `smoke`, `authenticated` и `visual` проекты.
2. Убрать зависимость обычного CI от живого demo-аккаунта: создавать тестового пользователя
   через service-role только в protected staging environment или использовать заранее
   подготовленное storage state с контролируемым TTL.
3. Запускать `smoke` на каждом PR, authenticated/visual - nightly и перед релизом.
4. Добавить тесты для OAuth consent: отсутствие `authorization_id`, отказ, approve и redirect.
5. Устранить предупреждения `act(...)` в Telegram tests и сделать console policy явной.

Критерий готовности: PR feedback до 10 минут, полный набор не зависит от ручного состояния
аккаунта и публикует trace/screenshot при ошибке.

## Phase 2: Quality Debt Burn-down (3-6 недель)

1. Зафиксировать инвентарь Knip по категориям: файлы, exports, dependencies, types,
   duplicates; удалить мёртвые модули небольшими PR.
2. Снижать лимит Knip минимум на 50 находок в неделю, не повышая baseline без RFC.
3. Заменять `any` на Supabase `Json`, DTO и narrow error types в сервисах и admin UI.
4. Исправить React Hook dependency warnings в hooks и async loaders.
5. Перевести literal UI strings в i18n по экранам: auth, dashboard, blocks, Telegram.
6. Снизить i18n baseline минимум на 200 строк за фазу и запретить рост в новых файлах.

Критерий готовности: lint warnings < 800, Knip < 600, hardcoded UI strings < 2 000.

## Phase 3: Performance and Frontend Reliability (2-4 недели)

1. Разбить `i18n-helpers`, `vendor-ui`, `exceljs`, `sentry` и Event Scanner на
   route-level/lazy chunks; установить бюджет initial JS и CI-report по bundle size.
2. Обновить Browserslist database контролируемым dependency PR.
3. Проверить CSP в dev: разрешить локальный HMR WebSocket либо отключать production CSP
   заголовок для development server.
4. Ввести visual regression только для стабильных экранов с локальными fixtures.
5. Протестировать mobile Capacitor sync после каждой существенной Vite/config change.

Критерий готовности: нет CSP ошибок HMR в локальной разработке, warning по bundle size
заменён измеряемым бюджетом, LCP основных публичных страниц отслеживается.

## Phase 4: Backend and Security (параллельно, 3-6 недель)

1. Сверить миграции Supabase с production history и добавить проверку порядка/дубликатов.
2. Покрыть RLS и SECURITY DEFINER RPC интеграционными тестами для events, leads,
   payments, reviews и MCP tools.
3. Убрать тестовые креденшелы из E2E-кода в GitHub secrets/staging fixtures.
4. Провести `npm audit` с triage: обновлять только пакеты с достижимой уязвимостью и
   сопровождать регрессионными тестами.
5. Закрыть lifecycle секретов: rotation runbook, минимальные scopes, audit log deploys.

Критерий готовности: migration dry-run и RLS suite обязательны перед production deploy;
в репозитории нет действующих логинов/паролей.

## Phase 5: Product Delivery (квартальный поток)

1. Завершить незакрытые направления из roadmap: защищённая выдача digital goods,
   AI Financial Advisor, CRM automation и аналитические эксперименты.
2. Каждую новую premium-функцию выпускать с feature flag, событиями canonical analytics,
   pricing gate, RLS contract и rollback plan.
3. Привести планы в `docs/product/` и `.lovable/plan.md` к единому источнику истины:
   статус, owner, метрика успеха, dependencies, дата проверки.
4. Публиковать changelog из понятных commit messages; заменить сообщения `Changes` и
   `Work in progress` на conventional commits.

Критерий готовности: у каждой инициативы есть измеримая метрика, технический контракт,
тестовый план и владелец.

## Порядок исполнения

Сначала Phase 0, затем Phase 1 и Phase 2 параллельно. Phase 3 начинается после зелёного
CI. Phase 4 не блокирует UI-работу, но блокирует production deployment для затронутых
таблиц и Edge Functions. Phase 5 выполняется только через feature flags и staging rollout.
