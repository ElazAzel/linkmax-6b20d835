# План выявления и устранения ошибок LinkMAX

Цель: один сквозной проход по 4 слоям (статика, runtime, backend, E2E) с фиксами всего найденного и закреплением в CI/мониторинге, чтобы регрессии не возвращались.

## Этап 1. Статический анализ (день 1)

1. `npm run typecheck` — собрать все TS-ошибки в `tmp/typecheck.txt`, классифицировать (any, missing types, null-safety) и пофиксить по файлам.
2. `npm run lint` — прогон ESLint + плагинов `i18n` и `jsx-a11y`. Чинить error-level, warnings заносить в baseline (`config/quality-baseline.json`) и снижать порог `anyMax`/`consoleLogMax`.
3. `npm run analyze:cycles` (dependency-cruiser) — выявить циклы, нарушения слоёв Domain → UseCases → Repositories → UI; разорвать через интерфейсы.
4. `scripts/check-locale-coverage.mjs` + `scripts/audit-english.mjs` — найти хардкод-строки и пропуски `ru/en/kk/uz`, добавить ключи.
5. `scripts/quality-baseline-check.mjs` — зафиксировать новый baseline после фиксов.

## Этап 2. Runtime-ошибки в браузере (день 2)

1. Активировать Sentry Session Replay (DSN уже подключён в `src/lib/utils/sentry.ts`) — поднять `replaysOnErrorSampleRate` до 0.3 на prod, посмотреть топ-5 issues за 7 дней.
2. Прогон preview-вью ключевых маршрутов (`/`, `/dashboard`, `/editor/:id`, `/p/:slug`, `/crm`, `/zones`) с `code--read_console_logs` и `code--read_network_requests`; зафиксировать ошибки и 4xx/5xx запросы.
3. Проверить `BlockErrorBoundary` и `ScreenErrorBoundary` — добавить отчётность в Sentry там, где её нет, и fallback-UI для пустых экранов.
4. Прогнать `npm run test` (Vitest) — фиксы упавших unit-тестов.

## Этап 3. Backend и Edge Functions (день 3)

1. `supabase--linter` — устранить все security/perf warnings (особенно RLS, missing indexes).
2. `supabase--analytics_query` по `postgres_logs` уровня ERROR/FATAL за 7 дней — выявить медленные/падающие запросы.
3. `supabase--edge_function_logs` по критичным функциям: `lead-webhook`, `robokassa-webhook`, `telegram-bot`, `ai-generator`, `health-check`. Каждая ошибка → fix + Deno-тест.
4. Прогон `supabase--test_edge_functions` — добавить тесты для функций без покрытия.
5. Проверить `health-check` на проде через `supabase--curl_edge_functions` — должна возвращать 200.

## Этап 4. E2E-сценарии (день 4)

1. `npx playwright test` по существующим спекам (`e2e/auth-flow`, `page-creation`, `crm-workflow`, `fintech-flow`, `zone-upgrade`, `add-block-sheet`, `language-switch`).
2. Падения → фиксы кода или обновление селекторов.
3. Добавить smoke для непокрытых критичных флоу: публикация страницы, приём лида в Telegram, оплата Robokassa.
4. Visual regression (`e2e/visual-regression.spec.ts`) — обновить baseline после UI-правок только если diff осознанный.

## Этап 5. Закрепление в CI и мониторинге (день 5)

1. Установить `lefthook` (pre-commit: lint+typecheck изменённых файлов, pre-push: vitest).
2. Расширить `.github/workflows/ci.yml`: добавить шаги `analyze:cycles`, `check-locale-coverage`, `quality-baseline-check`, e2e smoke. Блокировать merge при падении.
3. Sentry: настроить алерты в Telegram-бот на new issue + error spike.
4. Создать дашборд ошибок в `Admin → Growth` (расширить `get_growth_metrics` RPC полем error_rate из Sentry API или собственной таблицы `app_errors`).
5. Документировать процесс в `docs/operations/RELIABILITY_REPEAT_BUG_PLAYBOOK.md` (обновить) и `docs/testing/TESTING.md`.

## Технические детали

- Baseline для регрессий: `config/quality-baseline.json` (anyMax, consoleLogMax) — снижаем после каждого этапа.
- Sentry фильтры в `src/lib/utils/sentry.ts` уже отсекают шум расширений и AbortError — не трогаем.
- Edge Functions используют ESM `npm:` импорты — соблюдаем стандарт из памяти `edge-functions-stability-standard`.
- RLS-фиксы через `SECURITY DEFINER` RPC (память `rls-recursion-prevention-standard`), миграции через `supabase--migration`.
- Не делаем manual chunks для React/Router в Vite (память `runtime-stability-and-hydration-standard`).
- i18n: новые ключи добавляются во все 4 локали (`ru` базовый), русский — fallback.

## Артефакты

- `docs/audits/ERROR_AUDIT_2026_05_16.md` — сводный отчёт с топ-ошибками по слоям, приоритетами и ссылками на фиксы.
- `.jules/error-hunt.md` — журнал найденных и закрытых проблем.
- Обновлённый `config/quality-baseline.json`.
- Обновлённый CI workflow.

## Порядок исполнения

```text
Day 1: Static  ──► фиксы TS/ESLint/cycles/i18n
Day 2: Runtime ──► Sentry triage + console/network sweep + Vitest
Day 3: Backend ──► linter + pg logs + edge logs + deno tests
Day 4: E2E     ──► Playwright прогон + новые smoke
Day 5: CI/Mon  ──► lefthook + CI gates + Sentry alerts + dashboard
```

После одобрения начну с Этапа 1 и буду отчитываться после каждого слоя.
