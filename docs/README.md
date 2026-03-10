# 📚 Индекс документации LinkMAX (ex-lnkmx)

**Версия:** 2.5.1
**Дата обновления:** 10 марта 2026
**Статус:** Updated ✅

Добро пожаловать в портал документации **LinkMAX**. Это единая точка входа для всех технических, архитектурных и продуктовых руководств.
Вместо множества разрозненных индексов (INDEX.md, DOCUMENTATION-INDEX-FULL.md), все ключевые ссылки теперь агрегированы здесь.

> [!IMPORTANT]
> **Текущая стратегия (Q1-Q2 2026):** Переход на модель **"Step-by-Growth"** (транзакционная монетизация через Kaspi/Robokassa) и позиционирование приложения как **"Anti-Bitrix/AmoCRM"** для соло-предпринимателей (Mobile First Business Zone).

---

## 🚀 Начните отсюда

### Для всех

1. **[PLATFORM_SNAPSHOT.md](PLATFORM_SNAPSHOT.md)** — **Единый источник истины.** Главный снимок текущего состояния платформы: архитектура, стек, база данных, фичи и известные риски.
2. **[CHANGELOG.md](CHANGELOG.md)** — Подробная история версий и изменений.
3. **[DEVELOPER-QUICKSTART.md](getting-started/DEVELOPER-QUICKSTART.md)** — Быстрый старт для разработчиков (установка, команды).
4. **[GLOSSARY.md](GLOSSARY.md)** — Глоссарий терминов проекта.
5. **[README.md](../README.md)** — Корневой README проекта (обзор платформы).

### Для разработчиков

1. **[COMPREHENSIVE_PLATFORM_GUIDE.md](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md)** — Подробнейшая документация по всем подсистемам платформы.
2. **[UI-COMPONENTS.md](features/UI-COMPONENTS.md)** — Компоненты UI (Liquid Glass Design System).
3. **[API.md](implementation/API.md)** — Edge Functions, RPCs, интеграции.
4. **[DATABASE_SCHEMA_GUIDE.md](implementation/DATABASE_SCHEMA_GUIDE.md)** — Схема БД, таблицы, RLS.

### Для тестировщиков и DevOps

1. **[TESTING.md](testing/TESTING.md)** — Стратегия тестирования.
2. **[DEPLOYMENT-CHECKLIST.md](deployment/DEPLOYMENT-CHECKLIST.md)** — Чеклист выкатки.
3. **[FULL_PLATFORM_AUDIT_2026_02_18.md](audits/FULL_PLATFORM_AUDIT_2026_02_18.md)** — Отчёт о полном аудите.

### Для Product-менеджеров

1. **[1_PRODUCT_VISION.md](product/1_PRODUCT_VISION.md)** — Видение продукта.
2. **[2_BUSINESS_FINANCIAL_MODEL.md](product/2_BUSINESS_FINANCIAL_MODEL.md)** — Финмодель (Step-by-Growth, транзакции).
3. **[STRATEGIC_PLAN_2026.md](product/STRATEGIC_PLAN_2026.md)** — План развития на 2026 год.
4. **[COMPETITIVE_NOTES.md](product/COMPETITIVE_NOTES.md)** — Анализ рынка и конкурентов.

---

## 📁 Структура \`docs/\`

| Директория | Описание |
| :--- | :--- |
| **`getting-started/`** | Онбординг, быстрый старт. |
| **`architecture/`** | Архитектура, стек, паттерны, производительность, граф зависимостей. |
| **`audits/`** | Архив аудитов, health-checks, отчёты о безопасности. |
| **`deployment/`** | Чек-лист деплоя, GitHub Actions, runbooks. |
| **`seo/`** | SEO, SSR для ботов (Cloudflare Workers), AEO/GEO интеграция. |
| **`security/`** | Безопасность, RLS политики. |
| **`features/`** | Работа фич, UI-компоненты, структура блоков. |
| **`implementation/`** | API доки, схема БД, процессы перевода (i18n), демо-аккаунты. |
| **`product/`** | Видение 6 Pillars, маркетинг, бизнес-модель, roadmap, презентации. |
| **`testing/`** | Стратегия QA. |
| **`operations/`** | Операционное руководство, tech debt, a11y, инструкции для AI агентов. |
| **`ADR/`** | Architecture Decision Records (Фиксация архитектурных изменений). |
| **`presentation/`** | Презентации и pitch-модули. |

---

## ⚡ Частые Вопросы (FAQ)

**Q: В каком файле описана база данных и таблицы?**
A: [DATABASE_SCHEMA_GUIDE.md](implementation/DATABASE_SCHEMA_GUIDE.md) и [PLATFORM_SNAPSHOT.md](PLATFORM_SNAPSHOT.md).

**Q: Как работает монетизация и комиссии (Kaspi/Robokassa)?**
A: Подробно в [2_BUSINESS_FINANCIAL_MODEL.md](product/2_BUSINESS_FINANCIAL_MODEL.md) и [ADR-0026](ADR/0026-monetization-step-by-growth.md).

**Q: Как добавить новый язык или обновить переводы?**
A: [translation_playbook.md](implementation/translation_playbook.md) и [i18n_ops.md](implementation/i18n_ops.md).
