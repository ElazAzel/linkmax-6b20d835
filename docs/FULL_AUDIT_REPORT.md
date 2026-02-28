# Полный аудит платформы inkmax (lnkmx)

**Дата:** 28 февраля 2026  
**Версия:** React 18.3.1 · Vite 6.1.0 · TypeScript 5.8.3 · Supabase  
**Области:** Код · i18n · UX/UI · Производительность · Безопасность · Документация · Агенты · CI/CD

---

## Оглавление

1. [Общая архитектура](#1-общая-архитектура)
2. [CRITICAL — Безопасность](#2-critical--безопасность)
3. [Качество кода](#3-качество-кода)
4. [Интернационализация (i18n)](#4-интернационализация-i18n)
5. [UX/UI и адаптивность](#5-uxui-и-адаптивность)
6. [Производительность и оптимизация](#6-производительность-и-оптимизация)
7. [Конфигурации и совместимость](#7-конфигурации-и-совместимость)
8. [Документация](#8-документация)
9. [Агенты и оркестрация](#9-агенты-и-оркестрация)
10. [CI/CD и деплой](#10-cicd-и-деплой)
11. [Тесты](#11-тесты)
12. [Сводная таблица проблем](#12-сводная-таблица-проблем)
13. [Рекомендованный план действий](#13-рекомендованный-план-действий)

---

## 1. Общая архитектура

| Параметр | Значение |
|---|---|
| Фреймворк | React 18.3.1 + TypeScript |
| Сборка | Vite 6.1.0 (SWC) |
| UI | shadcn/ui (Radix UI) + Tailwind CSS 3.4.17 |
| Роутинг | React Router DOM 6.30.1 |
| Серверная часть | Supabase (PostgreSQL + Edge Functions) |
| Стейт-менеджмент | React Query 5.83 + Zustand + React Context |
| Мобильные приложения | Capacitor 8.1.0 (Android / iOS) |
| Тестирование | Vitest 3.2.0 + Playwright 1.57.0 |
| Мониторинг | Sentry + Web Vitals |
| i18n | i18next (16 языков) |
| 3D | Three.js + React Three Fiber |
| Экспорт | jsPDF + ExcelJS + html2canvas |

**Архитектурный паттерн:** Clean Architecture (domain → use-cases → repositories → services → components).

**Структура `src/`:** ~600+ файлов TypeScript/TSX, организованных по фичам: `components/`, `hooks/`, `pages/`, `services/`, `domain/`, `use-cases/`, `repositories/`, `lib/`, `types/`, `i18n/`, `platform/`.

---

## 2. CRITICAL — Безопасность

### 2.1. API-токен Cloudflare в открытом виде
**Файл:** `GITHUB_ACTIONS_SETUP.md`, строка 15  
**Проблема:** Cloudflare API Token `T7pmsB-i1p59KXslYhlQoL8RIEoi4SJ3jvgm1J3h` записан прямо в документации.  
**Последствия:** Любой с доступом к репозиторию может управлять Workers, DNS, Pages.  
**Действие:**
1. Немедленно удалить токен из файла (заменить на `<YOUR_CLOUDFLARE_API_TOKEN>`)
2. Ротировать токен в Cloudflare Dashboard
3. Обновить секрет в GitHub Actions

### 2.2. Cloudflare Account ID в документации
**Файл:** `GITHUB_ACTIONS_SETUP.md`, строка 22 и `cloudflare-worker/wrangler.toml`  
**Проблема:** Account ID `9058b638459bffbf366813802933852b` в открытом виде.  
**Действие:** Менее критично, чем API-токен, но лучше вынести в переменные окружения.

### 2.3. Supabase Edge Functions без JWT-верификации
**Файл:** `supabase/config.toml`  
**Проблема:** 28 функций настроены с `verify_jwt = false` без документированного обоснования.  
**Действие:** Провести ревью каждой функции, включить JWT для всех, кроме публичных эндпоинтов, и задокументировать причину для каждого исключения.

---

## 3. Качество кода

### 3.1. Использование `any` — 100+ мест

| Файл | Контекст |
|---|---|
| `src/services/pages.ts:29,84,85` | `any[]` для данных из БД |
| `src/components/form-fields/FileUpload.tsx:125` | Event handler |
| `src/components/editor/BlockEditorV2.tsx:144,160` | Block data |
| `src/components/zones/ZoneDealsScreen.tsx:63,84,105` | CRM данные |
| `src/components/dashboard-v2/analytics/ExperimentsList.tsx:42,54,66` | A/B тесты |

**Рекомендация:** Заменять `any` на типизированные интерфейсы. Строгий tsconfig (`tsconfig.strict.json`) покрывает только `src/lib/` — расширить покрытие.

### 3.2. `console.log` в продакшн-коде — 100+ мест

| Файл | Строки |
|---|---|
| `src/main.tsx` | 130, 132 |
| `src/i18n/validation.ts` | 169, 175, 188, 190, 191, 216, 227, 230, 238, 243–248 |
| `src/i18n/config.ts` | 173, 174, 197 |
| `src/pages/DashboardV2.tsx` | 580 |

**Рекомендация:** Заменить на logger-утилиту с гейтом `import.meta.env.DEV`.

### 3.3. Хардкод URL-ов — 50+ мест

| URL | Файлы |
|---|---|
| `https://lnkmx.my` | `DashboardV2.tsx`, `SEOLandingHead.tsx`, `geo-schemas.ts` |
| Unsplash URL | `src/lib/constants.ts:9` |
| Демо-аватар | `src/components/profile/FrameSelector.tsx:26` |

**Рекомендация:** Вынести базовый домен в `VITE_APP_DOMAIN` и использовать во всех местах.

### 3.4. Пустые catch-блоки

| Файл | Строка | Контекст |
|---|---|---|
| `src/lib/analytics.ts` | 47 | fire-and-forget |
| `src/pages/PublicPage.tsx` | 157 | — |
| `src/components/landing/LandingFeaturedPages.tsx` | 30 | — |

**Рекомендация:** Как минимум логировать ошибки через Sentry или logger.

### 3.5. Крупные файлы (>300 строк) — 200+ файлов

Наиболее критичные:
- `src/pages/DashboardV2.tsx` — ~783 строк
- `src/components/seo/SEOLandingHead.tsx` — очень большой
- Многие компоненты в `components/dashboard-v2/`, `components/editor/`

**Рекомендация:** Разбить на подкомпоненты. DashboardV2.tsx можно декомпозировать на хуки + рендер-компоненты.

### 3.6. TypeScript-строгость

| Параметр | tsconfig.json | tsconfig.strict.json |
|---|---|---|
| `strict` | `true` | `true` |
| `noImplicitAny` | **`false`** | `true` |
| `strictNullChecks` | **`false`** | `true` |
| Покрытие | весь `src/` | только `src/lib/` |

**Рекомендация:** Постепенно расширять зону strict до всего `src/`.

---

## 4. Интернационализация (i18n)

### 4.1. Поддерживаемые языки — 16

| Загрузка | Языки |
|---|---|
| Eager (основные) | `ru`, `en`, `kk` |
| Lazy | `de`, `uk`, `uz`, `be`, `es`, `fr`, `it`, `pt`, `zh`, `tr`, `ja`, `ko`, `ar` |

### 4.2. Хардкод русского текста вместо ключей

| Файл | Строки | Текст |
|---|---|---|
| `src/components/zones/tasks/TaskKanbanColumn.tsx` | 18–19 | `'Готово'`, `'Отменено'` |
| `src/components/zones/tasks/TaskDetailSheet.tsx` | 21–29, 122 | Приоритеты, описание |
| `src/components/zones/tasks/TaskCard.tsx` | 15–18 | Приоритеты |
| `src/pages/Terms.tsx` | 15–24 | SEO-заголовки на русском/казахском |

### 4.3. Отсутствующие ключи

Файл `i18n_worklist.json` трекает недостающие ключи:
- `en`: `landing.v6.hero.titleSuffix`, `landing.v6.hero.titleBrand`, `eventBuilder.fieldPlaceholder` и др.
- `kk`: Множество ключей `settings.linkedAccounts.*`, `landing.*`
- Другие языки: неполное покрытие относительно `en.json`

### 4.4. Инструменты i18n

Имеющиеся скрипты: `find_missing_translations.mjs`, `compare_locales.ts`, `check-code-keys.mjs`, `i18n-manager.mjs` — **хорошо**, но нужно запускать регулярно (в CI).

**Рекомендации:**
1. Заменить все хардкод-строки на ключи `t()`
2. Добавить `scripts/check-code-keys.mjs` в CI-пайплайн
3. Завершить ключи из `i18n_worklist.json`
4. Рассмотреть разделение больших файлов переводов по фичам

---

## 5. UX/UI и адаптивность

### 5.1. Адаптивность — хорошо, но с пробелами

**Сильные стороны:**
- Мобильная навигация: `DashboardBottomNav`, `AppTabBar`
- Responsive-классы Tailwind (`sm:`, `md:`, `lg:`) используются
- Touch-friendly: минимум 44px для tap-target (index.css)
- Safe-area insets для notched-устройств

**Проблемы:**
- Нет `srcset` / `sizes` в компоненте `LazyImage` — изображения не адаптивные
- Непоследовательное использование breakpoints: некоторые компоненты используют только `sm:`, пропуская `md:`, `lg:`
- Padding контейнера фиксированный (`2rem`) на всех размерах

### 5.2. Доступность (a11y)

**Сильные стороны:**
- ARIA-атрибуты в формах (`aria-describedby`, `aria-invalid`)
- `role="img"` и `aria-label` на background-изображениях
- Focus-стили: `focus-visible:ring-2`
- `prefers-reduced-motion` поддержка

**Критические пробелы:**
- **Нет skip-to-content ссылки** — нужна для keyboard-навигации
- Не все icon-only кнопки имеют `aria-label`
- Модальные окна: не проверено наличие focus trap
- Контраст цветов: нужно ручное тестирование по WCAG AA

### 5.3. UI-консистентность

**Сильные стороны:**
- shadcn/ui + Radix UI используются системно
- Skeleton-загрузки: `LoadingSkeleton`, `PublicPageSkeleton`
- Error boundary: `BlockErrorBoundary`, `ScreenErrorBoundary`
- Empty state: `EmptyState` компонент
- `prefers-reduced-motion` support

**Проблемы:**
- Микс inline-стилей и Tailwind-классов для анимаций
- Не все async-операции имеют loading-состояние

### 5.4. PWA

**Реализовано:** manifest.json, service worker (sw.js), PWAInstallPrompt, PWAUpdatePrompt  
**Проблемы:**
- В `manifest.json` пустой массив `screenshots`
- Иконки для shortcuts отсутствуют
- Service Worker использует базовую стратегию кеширования

---

## 6. Производительность и оптимизация

### 6.1. Сборка (Vite)

**Сильные стороны:**
- Manual chunks: Three.js → `vendor-3d`, jsPDF/ExcelJS → `vendor-export`, Recharts → `vendor-charts`, Radix → `vendor-ui`
- `modulePreload: false` — правильно для lazy-чанков
- Non-blocking CSS plugin в продакшене
- i18n-локали в отдельных чанках

**Проблемы:**
- Нет лимита размера чанков (`chunkSizeWarningLimit`)
- Sourcemaps **всегда** включены — должны зависеть от `SENTRY_AUTH_TOKEN`
- Нет явной CSS code splitting конфигурации

### 6.2. Lazy Loading

**Сильные стороны:**
- Все страницы lazy-loaded в `main.tsx`
- Экраны dashboard lazy-loaded в `DashboardV2.tsx`
- jsPDF загружается динамически (`src/lib/export/pdf-export.ts`)
- PWA-компоненты и CookieConsent — lazy в `App.tsx`

**Проблемы:**
- **Recharts (~200KB) загружается eager** — нужно lazy-загрузить
- `Hero3D.tsx` (Three.js) — не lazy, возможно не используется
- Некоторые блок-редакторы можно lazy-загрузить агрессивнее

### 6.3. React Performance

**Сильные стороны:**
- `React.memo` — 100+ компонентов мемоизированы
- `useMemo` и `useCallback` активно используются
- `usePerformanceMonitor` хук

**Проблемы:**
- **Нет виртуализации списков** — Gallery, Templates, Pages с большими списками будут тормозить
- `React.startTransition` не используется
- **QueryClient без default options** — нет глобального `staleTime`, `retry`, `refetchOnWindowFocus`

```typescript
// App.tsx:20 — текущее:
const queryClient = new QueryClient();

// Рекомендуется:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 6.4. Изображения

- Нет WebP/AVIF — только оригинальные форматы
- Нет `srcset` в `LazyImage`
- Нет Image CDN интеграции

### 6.5. Мониторинг

- Web Vitals деferred-загрузка через `requestIdleCallback` — **хорошо**
- Sentry: `tracesSampleRate: 0.2` — **адекватно**
- Но Web Vitals хук не вызывается активно в компонентах

---

## 7. Конфигурации и совместимость

### 7.1. Несоответствие портов

| Компонент | Порт |
|---|---|
| Vite dev server (`vite.config.ts`) | **8080** |
| Playwright baseURL | **5173** |
| Playwright webServer | **5173** |

**Действие:** Обновить `playwright.config.ts` — изменить `5173` → `8080`.

### 7.2. ESLint

- ESLint 8.57.0 (устаревший) + TypeScript ESLint 8.38.0 (новый)
- **Рекомендация:** Обновить до ESLint 9.x для совместимости

### 7.3. Лишние файлы в корне

В tsconfig.json исключены: `pages_vite_backup`, `tmp_backup` — артефакты миграции.  
Также в корне: `final_lint_results.json`, `lint_errors*.txt`, `missing.txt`, `ru-queue.json` — временные файлы.

**Рекомендация:** Удалить или добавить в `.gitignore`.

---

## 8. Документация

### 8.1. Критические проблемы

| # | Файл | Проблема |
|---|---|---|
| 1 | `GITHUB_ACTIONS_SETUP.md` | API-токен в открытом виде (см. секцию 2) |
| 2 | `DOCUMENTATION-INDEX-FULL.md` | Ссылки на несуществующие файлы: `docs/BLOCKS-REFERENCE.md`, `docs/PLATFORM-DOCUMENTATION.md` |
| 3 | `docs/SSR-DOCS-INDEX-DRAFT.md` | 6+ отсутствующих файлов: `SSR-IMPLEMENTATION.md`, `DEPLOYMENT-GUIDE.md`, `SSR-TESTING.md`, `ARCHITECTURE-DIAGRAM.md`, `IMPLEMENTATION-SUMMARY.md`, `TESTING-STRATEGY.md` |
| 4 | `docs/SSR-DOCS-INDEX-DRAFT.md:6` | Опечатка: `SSR-GEO-AEO-AEO-QUICK-START.md` (двойное "AEO") |

### 8.2. Средние проблемы

- **Дата устарела:** `DEPLOYMENT-CHECKLIST.md` — "January 31, 2026"
- **Дублирование:** 4 документа покрывают одну тему SSR/SEO с разных сторон
- **Несоответствие env-переменных:** README vs .env.example
- **Нет документации** по мобильному деплою (Capacitor)
- **Нет документации** по мониторингу и алертингу

---

## 9. Агенты и оркестрация

### 9.1. Структура

```
.agent/rules/
├── 123role.md
├── ANTIGRAVITY_CONFIG.md
├── agents/        (orchestrator, implementer, frontend_specialist, backend_specialist, arch-reviev)
├── commands/      (dev, deploy, build, test, database, lint, clean)
├── hooks/         (pre_push)
├── rules/         (general, cursor, windsurf)
└── skills/        (react/SKILL.md, supabase/SKILL.md)
```

### 9.2. Проблемы

| # | Проблема | Серьёзность |
|---|---|---|
| 1 | Дублированные trigger-заголовки (`---`) в файлах agents/ | Medium |
| 2 | `arch-reviev.md` — опечатка (должно быть "review") | Low |
| 3 | `123role.md` — неясное назначение | Low |
| 4 | Все агенты требуют ответ на русском, но документация на английском | Medium |
| 5 | Все ссылки на файлы в ANTIGRAVITY_CONFIG.md валидны | OK |

---

## 10. CI/CD и деплой

### 10.1. GitHub Actions

- `deploy.yml` — деплой на Cloudflare Workers (Node 20)
- `ci.yml` — quality gates (lint, typecheck, tests)
- Конфигурация **корректная**

### 10.2. Cloudflare Worker

- `wrangler.toml` настроен правильно
- Routes закомментированы — нужна документация когда раскомментировать
- README Worker-а не совпадает с кодом (`render-page` vs `generate-sitemap`)

### 10.3. Supabase

- 28 Edge Functions
- Миграции БД присутствуют
- `verify_jwt = false` на всех функциях — требует ревью (см. секцию 2.3)

### 10.4. Мобильные приложения

- Capacitor: Android и iOS настроены
- App ID: `com.lnkmx.app`
- **Нет CI/CD для мобильных сборок**
- **Нет документации** по мобильному релизу

---

## 11. Тесты

### 11.1. Unit-тесты (Vitest)

- Setup: `src/testing/setup.ts`
- Тесты найдены в: `domain/entities/__tests__/`, `domain/value-objects/__tests__/`, `lib/blocks/__tests__/`, `lib/seo/__tests__/`, `platform/robokassa/__tests__/`, `services/__tests__/`, `use-cases/**/__tests__/`, `pages/__tests__/`
- **Покрытие:** Domain и use-cases покрыты, но UI-компоненты — минимально

### 11.2. E2E-тесты (Playwright)

- Каталог: `e2e/`
- Проекты: Chromium, Firefox, Mobile Chrome, Mobile Safari
- **Проблема:** Порт 5173 не совпадает с Vite (8080)
- Retries: 2 в CI — **хорошо**

### 11.3. Рекомендации

- Добавить тесты на UI-компоненты (React Testing Library)
- Исправить порт в Playwright
- Добавить coverage reporting в CI

---

## 12. Сводная таблица проблем

### CRITICAL (немедленно)

| # | Проблема | Файл |
|---|---|---|
| C1 | API-токен Cloudflare в открытом виде | `GITHUB_ACTIONS_SETUP.md:15` |
| C2 | 28 Edge Functions без JWT-верификации | `supabase/config.toml` |

### HIGH (эта неделя)

| # | Проблема | Файл |
|---|---|---|
| H1 | Порт Playwright не совпадает с Vite | `playwright.config.ts` |
| H2 | QueryClient без default options | `src/App.tsx:20` |
| H3 | Recharts ~200KB загружается eager | `vite.config.ts` |
| H4 | 100+ мест с типом `any` | Множество файлов |
| H5 | 100+ console.log в продакшн-коде | Множество файлов |
| H6 | Хардкод URL `https://lnkmx.my` в 50+ местах | Множество файлов |
| H7 | 8+ отсутствующих файлов документации по ссылкам | `DOCUMENTATION-INDEX-FULL.md`, `docs/SSR-DOCS-INDEX-DRAFT.md` |
| H8 | Хардкод русского текста в task-компонентах | `components/zones/tasks/*` |

### MEDIUM (этот спринт)

| # | Проблема | Файл |
|---|---|---|
| M1 | Нет skip-to-content ссылки | Глобально |
| M2 | Нет srcset/sizes в LazyImage | `src/components/ui/lazy-image.tsx` |
| M3 | Нет виртуализации для длинных списков | Gallery, Templates, Pages |
| M4 | Sourcemaps всегда включены | `vite.config.ts` |
| M5 | `noImplicitAny: false` в основном tsconfig | `tsconfig.json` |
| M6 | Пустой screenshots в PWA manifest | `public/manifest.json` |
| M7 | Временные файлы в корне репо | Корень проекта |
| M8 | Дублированные SSR/SEO документы | 4 файла |
| M9 | Cloudflare Worker README не совпадает с кодом | `cloudflare-worker/README.md` |
| M10 | Нет документации по мобильному деплою | — |

### LOW (бэклог)

| # | Проблема | Файл |
|---|---|---|
| L1 | ESLint 8.x — обновить до 9.x | `eslint.config.js` |
| L2 | Опечатка `arch-reviev.md` | `.agent/rules/agents/` |
| L3 | Web Vitals хук не вызывается активно | `src/App.tsx` |
| L4 | Нет WebP/AVIF для изображений | Глобально |
| L5 | Container padding не адаптивный | `tailwind.config.ts` |
| L6 | Нет CI/CD для мобильных сборок | `.github/workflows/` |
| L7 | Нет тестов на UI-компоненты | `src/components/` |

---

## 13. Рекомендованный план действий

### Фаза 1 — Критичное (1–2 дня)
1. Удалить API-токен из `GITHUB_ACTIONS_SETUP.md` и ротировать его в Cloudflare
2. Провести ревью JWT-настроек в Supabase Edge Functions
3. Исправить порт в `playwright.config.ts` (5173 → 8080)

### Фаза 2 — Высокий приоритет (1 неделя)
4. Настроить default options для QueryClient
5. Lazy-загрузить Recharts
6. Создать `VITE_APP_DOMAIN` env-переменную и заменить хардкод URL-ов
7. Заменить console.log на logger-утилиту
8. Заменить хардкод русских строк в task-компонентах на i18n-ключи
9. Создать/удалить отсутствующие файлы документации

### Фаза 3 — Средний приоритет (2–3 недели)
10. Добавить skip-to-content и aria-label на icon-only кнопки
11. Добавить srcset/sizes в LazyImage
12. Внедрить виртуализацию для длинных списков (@tanstack/react-virtual)
13. Сделать sourcemaps условными
14. Расширить зону strict TypeScript
15. Очистить временные файлы и обновить .gitignore
16. Консолидировать документацию по SSR/SEO

### Фаза 4 — Бэклог
17. Обновить ESLint до 9.x
18. Добавить WebP/AVIF поддержку
19. Добавить CI/CD для мобильных сборок
20. Расширить покрытие тестами (UI-компоненты)
21. Добавить PWA screenshots и shortcut icons

---

*Отчёт сгенерирован автоматически на основе анализа кодовой базы. Рекомендуется ручная верификация критических находок.*
