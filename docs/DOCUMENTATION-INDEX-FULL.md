# 📚 Индекс документации InkMax

**Версия:** 2.4  
**Дата обновления:** 5 марта 2026  
**Статус:** Updated ✅

Документы в `docs/` разнесены по смыслу по подпапкам (см. [Структура docs](#-структура-docs)).  
**Точка входа:** [README.md](README.md). **Термины:** [GLOSSARY.md](GLOSSARY.md).

---

## 🚀 Начните отсюда

### Для всех

1. **[DEVELOPER-QUICKSTART.md](getting-started/DEVELOPER-QUICKSTART.md)** — быстрый старт (15 мин)
   - Что такое InkMax
   - Stack технологий
   - 28 блоков (список)
   - Как добавить блок
   - Полезные ссылки

2. **[README.md](../README.md)** — главная страница
   - Обзор проекта, Quick start, ключевые фичи, структура БД

### Для разработчиков

3. **[COMPREHENSIVE_PLATFORM_GUIDE.md](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md)** — документация платформы (30 мин)
2. **[UI-COMPONENTS.md](features/UI-COMPONENTS.md)** — UI-компоненты (30 мин)

### Для архитекторов

5. **[FULL_PLATFORM_AUDIT_2026_02_18.md](audits/FULL_PLATFORM_AUDIT_2026_02_18.md)** — полный аудит платформы (1 час)
2. **[AUDIT_REPORT_2026_02_27.md](audits/AUDIT_REPORT_2026_02_27.md)** — итоговый отчёт (20 мин)

---

## 📁 Структура docs

| Папка | Содержимое |
|-------|------------|
| **getting-started/** | Онбординг: быстрый старт |
| **architecture/** | Архитектура, стек, паттерны, производительность, граф зависимостей |
| **audits/** | Аудиты, отчёты, health-check, платформа snapshot |
| **deployment/** | Деплой, CI/CD, runbooks |
| **seo/** | SEO/SSR, GEO/AEO, индексация |
| **security/** | Безопасность, RLS |
| **features/** | Фичи, UI, блоки, мультистраничность |
| **implementation/** | API, БД, i18n, демо-аккаунты |
| **product/** | Видение, маркетинг, инвестиции, roadmap, pitch |
| **testing/** | Стратегия тестирования |
| **operations/** | Операционное руководство, tech debt, a11y, changelog, агенты |
| **ADR/** | Architecture Decision Records |
| **presentation/** | Презентации |

---

## 📖 Полный каталог по папкам

### Корень docs/

| Документ | Назначение |
|----------|------------|
| **README.md** | Точка входа в документацию, навигация по папкам |
| **INDEX.md** | Краткий индекс по разделам |
| **GLOSSARY.md** | Глоссарий терминов проекта и ссылка на переводы |

### getting-started/

| Документ | Назначение |
|----------|------------|
| **DEVELOPER-QUICKSTART.md** | Быстрый старт для разработчиков |

### architecture/

| Документ | Назначение |
|----------|------------|
| **README.md** | Обзор раздела и навигация по документам архитектуры |
| **COMPREHENSIVE_PLATFORM_GUIDE.md** | Полная документация платформы |
| **architecture.md** | Архитектура системы |
| **ARCHITECTURE_PATTERNS.md** | Паттерны архитектуры |
| **2_PLATFORM_ARCHITECTURE.md** | Архитектура платформы |
| **STACK_REFERENCES.md** | Стек и библиотеки |
| **FUTURE_STACK.md** | Планируемый стек |
| **DEPENDENCY_MAP.md** | Граф зависимостей |
| **PERFORMANCE_GUIDE.md** | Руководство по производительности |
| **graphs/** | Диаграммы (dependency-graph и др.) |

### audits/

| Документ | Назначение |
|----------|------------|
| **README.md** | Актуальные vs исторические аудиты, источник истины (PLATFORM_SNAPSHOT) |
| **FULL_PLATFORM_AUDIT_2026_02_18.md** | Полный аудит платформы |
| **AUDIT_REPORT_2026_02_18.md**, **AUDIT_REPORT_2026_02_27.md** | Отчёты аудита |
| **DEEP_SECURITY_AUDIT_2026_02_18.md** | Аудит безопасности |
| **FULL_AUDIT_REPORT.md** | Сводный аудит |
| **PLATFORM_SNAPSHOT.md** | Снимок состояния платформы |
| **EDO_MODULE_AUDIT_2026_03_05.md** | Аудит модуля ЭДО (Business Zones) |
| **RULES_AUDIT_2026_02_20.md**, **PRESENTATION_AUDIT.md** | Аудиты правил и презентаций |
| **health-check-2026-02-14.md** | Health-check |
| + прочие отчёты в папке **audits/** | |

### deployment/

| Документ | Назначение |
|----------|------------|
| **DEPLOYMENT-CHECKLIST.md** | Чек-лист деплоя |
| **GITHUB_ACTIONS_SETUP.md** | Настройка GitHub Actions |
| **runbooks/DEPLOYMENT.md** | Runbook деплоя |
| **runbooks/LOCAL_DEVELOPMENT.md** | Локальная разработка |

### seo/

| Документ | Назначение |
|----------|------------|
| **README.md** | Обзор раздела SEO/SSR/AEO/GEO и навигация |
| **SEO-SSR.md** | SSR и бот-рендеринг |
| **aeo-geo-implementation.md** | AEO/GEO реализация |
| **QUICK-START-SEO-GEO-AEO.md** | Краткий старт (ссылки на основные документы) |
| **INDEXING.md**, **PRERENDER.md**, **search-console.md**, **CHECKLIST.md** | Технические SEO-документы |

### security/

| Документ | Назначение |
|----------|------------|
| **SECURITY.md** | Меры безопасности |
| **SECURITY_OPS.md** | Операции по безопасности |
| **RLS_VERIFICATION.sql** | Проверка RLS |

### features/

| Документ | Назначение |
|----------|------------|
| **Features.md** | Список фич |
| **UI-COMPONENTS.md** | UI-компоненты |
| **multi-page.md** | Мультистраничность |
| **event-block.md** | Блок событий |
| **dashboard-redesign.md** | Редизайн дашборда |

### implementation/

| Документ | Назначение |
|----------|------------|
| **API.md** | API и Edge Functions |
| **DATABASE_SCHEMA_GUIDE.md** | Схема БД |
| **i18n_ops.md** | i18n-операции |
| **translation_playbook.md** | Playbook переводов (глоссарий RU/KK/EN, стиль) |
| **demo-accounts.md** | Демо-аккаунты |
| **README.md** | Обзор раздела API, БД, i18n |

### product/

| Документ | Назначение |
|----------|------------|
| **1_PRODUCT_VISION.md** | Видение продукта |
| **3_MARKETING_STRATEGY.md** | Маркетинговая стратегия |
| **4_INVESTMENT_MEMO.md** | Инвестиционный меморандум |
| **5_PRODUCT_ROADMAP.md** | Дорожная карта |
| **PITCH_DECK.md** | Питч-дек |
| **COMPETITIVE_NOTES.md** | Конкуренты и рынок |

### testing/

| Документ | Назначение |
|----------|------------|
| **TESTING.md** | Стратегия тестирования |

### operations/

| Документ | Назначение |
|----------|------------|
| **6_OPERATIONAL_HANDBOOK.md** | Операционное руководство |
| **TECH_DEBT_BACKLOG.md** | Tech debt |
| **A11Y_CHECKLIST.md** | Чек-лист доступности |
| **CHANGELOG.md** | История изменений |
| **ai-agent-rules.md** | Правила для AI-агентов |

---

## 🎯 Документы по ролям

### Я новый в команде

1. 👀 [README.md](../README.md) — узнать о проекте (5 мин)
2. 🚀 [DEVELOPER-QUICKSTART.md](getting-started/DEVELOPER-QUICKSTART.md) — начать разработку (15 мин)
3. 🧩 [COMPREHENSIVE_PLATFORM_GUIDE.md](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md) — изучить платформу (1 час)

### Я разработчик

1. 🏗️ [COMPREHENSIVE_PLATFORM_GUIDE.md](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md) — архитектура (30 мин)
2. 🧩 [UI-COMPONENTS.md](features/UI-COMPONENTS.md) — UI (30 мин)
3. 🔒 [SECURITY.md](security/SECURITY.md) — безопасность (20 мин)
4. 🔍 [aeo-geo-implementation.md](seo/aeo-geo-implementation.md) — SEO/AEO (15 мин)

### Я тестер

1. 🧪 [TESTING.md](testing/TESTING.md) — стратегия (20 мин)
2. 📋 [FULL_PLATFORM_AUDIT_2026_02_18.md](audits/FULL_PLATFORM_AUDIT_2026_02_18.md) — аудит (1 час)
3. 🚀 [DEPLOYMENT-CHECKLIST.md](deployment/DEPLOYMENT-CHECKLIST.md) — чек-лист (10 мин)

### Я DevOps/архитектор

1. 🏗️ [architecture.md](architecture/architecture.md) — архитектура (30 мин)
2. 🚀 [6_OPERATIONAL_HANDBOOK.md](operations/6_OPERATIONAL_HANDBOOK.md) — операции (30 мин)
3. 📊 [FULL_PLATFORM_AUDIT_2026_02_18.md](audits/FULL_PLATFORM_AUDIT_2026_02_18.md) — аудит (1 час)
4. ⚡ [PERFORMANCE_GUIDE.md](architecture/PERFORMANCE_GUIDE.md) — производительность (15 мин)

### Я продакт-менеджер

1. 📚 [1_PRODUCT_VISION.md](product/1_PRODUCT_VISION.md) — видение (30 мин)
2. 📋 [5_PRODUCT_ROADMAP.md](product/5_PRODUCT_ROADMAP.md) — roadmap (20 мин)
3. 🎯 [Features.md](features/Features.md) — фичи (15 мин)

---

## ⚡ Быстрые ссылки

### Core

- 🏠 [Home](../README.md)
- 🚀 [Quick Start](getting-started/DEVELOPER-QUICKSTART.md)
- 📖 [Platform Docs](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md)

### Features & UI

- 🧩 [UI Components](features/UI-COMPONENTS.md)
- 📊 [Performance](architecture/PERFORMANCE_GUIDE.md)
- 🔐 [Security](security/SECURITY.md)

### Audit & Reports

- 📋 [Platform Audit](audits/FULL_PLATFORM_AUDIT_2026_02_18.md)
- 📊 [Latest Audit](audits/AUDIT_REPORT_2026_02_27.md)

### Operations

- 🧪 [Testing](testing/TESTING.md)
- 🔧 [Operational Handbook](operations/6_OPERATIONAL_HANDBOOK.md)
- 🚀 [Deployment](deployment/DEPLOYMENT-CHECKLIST.md)

---

## ❓ FAQ

**Q: С чего начать?**  
A: [DEVELOPER-QUICKSTART.md](getting-started/DEVELOPER-QUICKSTART.md)

**Q: Где информация о блоках?**  
A: [COMPREHENSIVE_PLATFORM_GUIDE.md](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md), [Features.md](features/Features.md)

**Q: Где информация о безопасности?**  
A: [SECURITY.md](security/SECURITY.md)

**Q: Как развернуть приложение?**  
A: [DEPLOYMENT-CHECKLIST.md](deployment/DEPLOYMENT-CHECKLIST.md), [runbooks/DEPLOYMENT.md](deployment/runbooks/DEPLOYMENT.md)

**Q: Где глоссарий терминов?**  
A: [GLOSSARY.md](GLOSSARY.md); для переводов RU/KK/EN — [translation_playbook.md](implementation/translation_playbook.md)

---

**Версия:** 2.3 · **Дата:** 28 февраля 2026 · **Статус:** ✅ Актуально
