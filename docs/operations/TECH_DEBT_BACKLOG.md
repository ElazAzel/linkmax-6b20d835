# Технический долг и Критические уязвимости (Backlog)

> **Источник данных:** Стратегический аудит платформы от 18 февраля 2026 г.
> **Цель:** Устранение критических барьеров перед масштабированием и фандрейзингом.

## Критические задачи (P0 — Remediation Required)

### 1. Progressive Web App (PWA)

- **Проблема:** Платформа позиционировалась как mobile-first, но установка на смартфон была невозможна.
- **Статус:** ✅ **Файлы созданы** (Health Score: 8/10). `manifest.json` и `sw.js` присутствуют и подключены.
- **Что сделать:**
  - [x] Создать валидный `manifest.json` в корне.
  - [x] Реализовать `service-worker` (`sw.js`).
- [x] Провести нагрузочное тестирование офлайн-режима (Верифицировано 27.02.2026).

### 2. SEO & Organic Discovery

- **Проблема:** Блокировка индексации из-за отсутствия sitemap.
- **Статус:** ✅ **Исправлено** (Health Score: 9/10). `sitemap.xml` и `robots.txt` в `public/`.
- **Что сделать:**
  - [x] Восстановить работу `sitemap.ts` (заменено статическим xml в public).
- [x] Проверить индексацию поисковыми роботами (Интегрирован `AISearchOptimizer` 27.02.2026).

### 3. Monetization & Payments (Preparation)

- **Проблема:** Отсутствует интеграция с реальными фиатными платежами (Kaspi, Stripe).
- **Статус:** ⚠️ **Инфраструктура готова** (Health Score: 8/10). Добавлены таблицы Wallets, Ledger и RLS политики.
- **Что сделать:**
  - [x] Спроектировать слой транзакций для реальных денег (готово в БД).
  - [ ] Реализовать интеграцию с Kaspi API (или Robokassa).

## Высокий приоритет (P1 — UX & Stability)

### 4. Authentication (OAuth Redirects)

- **Проблема:** Параметр `returnTo` игнорируется при входе через Google/Apple, прерывая deep-linking.
- **Статус:** ✅ **Исправлено** (Audit 05.03.2026).
- **Что сделать:**
  - [x] Исправить логику обработки редиректов в `src/pages/Auth.tsx` и `AuthCallback.tsx`.

### 5. System Stability (Block Registry Drift & Heavy Templates)

- **Проблема:** Рассинхронизация `block-registry.ts`. Блок `search` есть в лимитах, но нет в реестре. Тяжелые шаблоны захардкожены (99KB+).
- **Статус:** ✅ **Исправлено** (Audit 05.03.2026).
- **Что сделать:**
  - [x] Синхронизировать реестр блоков.
  - [x] Вынести тяжелые шаблоны из кодовой базы в БД (Phase 2).

### 6. Telegram Bot Architecture

- **Проблема:** Отсутствуют команды `/stats` и `/publish` для админов. Настройки языка сбрасываются при "холодном старте" Edge Functions.
- **Статус:** ✅ **Исправлено** (Audit 05.03.2026). ADR 0025 принят.
- **Что сделать:**
  - [x] Перенести настройки бота в БД (таблица `telegram_bot_settings`).
  - [x] Реализовать команды `/stats` и `/publish`.

### 7. Documentation & Orchestration

- **Проблема**: Слабая связность между документами в `docs/` и правилами в `.agent/`. Отсутствие формализованного процесса Handoff.
| **Business Zone** | Рабочие пространства: Kanban сделок, задачи, контакты, счета и документы. |
| **Invoices / Счета** | Выставление счетов внутри зон (multi-item, авто-нумерация, статусы). |
| **EDO / ЭДО** | Генератор документов: акты, договоры и счета на базе HTML-шаблонов. |
| **Liquid Glass** | Дизайн-система платформы: glassmorphism, микро-анимации. |
| **Pixel Proxy** | Серверная отправка событий в рекламные системы (FB CAPI, TikTok) для обхода блокировщиков. |
- **Статус**: ✅ **Исправлено** (Audit 27.02.2026).
- **Что сделать**:
  - [x] Синхронизировать `ai-agent-rules.md` с ролями.
  - [x] Формализовать Handoff Protocol в `123role.md`.
  - [x] Интегрировать Roadmap CRM из `.lovable/plan.md` в Snapshot.
  - [x] Обновить всю документацию по модулям Business Zones (Invoices, EDO).

### 8. Frontend Hook Consistency (In-Progress)

- [x] **Frontend Hook Consistency**: Some hooks in `src/hooks/zones/` (e.g. `useZoneDocuments`) were using `useZoneContext` instead of taking `zoneId` as an argument. Fixed and updated call sites.
  - [ ] Провести глобальный аудит использования хуков в папке `src/components/zones/` на предмет обязательной передачи `zoneId`.

## Metadata

*Документ обновлен: 5 марта 2026 г. (Documentation Audit & EDO Update)*
