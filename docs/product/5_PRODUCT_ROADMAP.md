# 5. Дорожная карта продукта lnkmx (2026-2027)

> **Статус**: Активно
> **Последнее обновление**: 7 марта 2026
> **Горизонт планирования**: 12-18 месяцев

---

## 1. Обзор этапов (Quarterly Themes)

| Квартал | Тема | Ключевые результаты |
| :--- | :--- | :--- |
| **Q1 2026** | **Business OS Foundation** (Завершено) | Запуск платформы, 28+ блоков, Бизнес-зоны (CRM, Сделки, Задачи, Инвойсы), Командная работа, SEO/SSR, A/B тесты. |
| **Q2 2026** | **The Monetization Pivot** | Запуск тарифа **Starter (0$ + %)**, Нативная оплата Kaspi/Robokassa (KZ), Исправление UX-долга (шрифты, доступность), PWA V2. |
| **Q3 2026** | **CRM Depth & Growth** | Множественные пайплайны, Кастомные поля, Экспорт данных/Отчеты, Нативное мобильное приложение (Capacitor), Реферальная система Pro. |
| **Q4 2026** | **Scale & Fintech Core** | Внутренние кошельки, Автоматизация выплат, Защищенная доставка цифровых товаров, AI-предиктивная аналитика продаж. |

---

## 2. Детальные приоритеты

### Q2 2026: Монетизация и Надежность

**Цель**: Обнулить барьер входа для новичков и довести UX до уровня "Business Ready".

* **Starter Tier Launch**: Техническая реализация автоматического удержания комиссии (Fee) через платежные шлюзы.
* **Native Payment Integration**: Бесшовный Kaspi QR и Robokassa "в один клик" из карточки сделки.
* **UX/UI Audit Remediation**:
  * Увеличение шрифтов (отказ от `text-[10px]` в пользу читаемых 12px+).
  * Исправление логики бронирований (Timezone support + защита от double-booking).
  * Улучшение Touch Targets для работы на ходу со смартфона.
* **PWA V2**: Полноценный оффлайн-режим для чтения списка контактов и задач.

### Q3 2026: Глубина продукта (CRM 2.0)

**Цель**: Удержание средних и крупных клиентов через "Data Lock-in" и расширенные функции управления.

* **Advanced CRM**:
  * Множественные воронки продаж (для разных продуктов в одной зоне).
  * Настраиваемые поля (Custom Fields) для Сделок и Контактов.
  * Глобальный поиск через Command Palette (Cmd+K).
* **Reporting & Analytics**:
  * Экспорт всей базы в Excel/CSV (запрос пользователей).
  * Генерация PDF инвойсов и Актов выполненных работ.
  * Дашборд воронки продаж и финансовый отчет P&L (Profit & Loss).
* **Mobile App**: Публикация в App Store / Google Play для повышения лояльности.

### Q4 2026: Fintech & Scale

**Цель**: Превращение lnkmx в полноценный финансовый хаб для соло-бизнеса.

* **Wallet & Ledger**: Внутренний учет средств пользователя с возможностью моментального вывода.
* **Digital Goods Engine**: Автоматизация продажи гайдов, пресетов и курсов с защитой ссылок.
* **AI Financial Advisor**: Анализ трат и доходов пользователя с рекомендациями по налоговой оптимизации (на базе локальных законов KZ).

---

## 3. СТРАТЕГИЯ: "Anti-Bitrix" (Competitive Moats)

| Этап | Фокус | Статус |
| :--- | :--- | :--- |
| **A** | **CRM Zero-Entry**: Сделать CRM бесплатным для всех (Starter), пока нет прибыли. | **Completed (Q2)** |
| **B** | **Mobile-First CRM**: Оптимизировать все интерфейсы под работу одной рукой "в поле". | **In Progress (continuous)** |
| **C** | **Product-Led Growth**: Вотермарка "Powered by" на Free-страницах как основной канал трафика. | **Active** |

---

## 4. Метрики успеха (KPIs)

1. **Retention Loop**: Рост удержания пользователей за счет накопления данных в CRM.
2. **Conversion to Pro**: Переход с тарифа Starter на Pro (3,045 ₸/мес) при достижении оборота >42,000 ₸.
3. **App Store Rating**: Оценка приложения >4.5 (фокус на надежность и дизайн Liquid Glass).

---
> Roadmap утвержден: 2026.03.07 | Команда lnkmx


## 5. Статус реализации (Execution Snapshot)

- Детальный срез выполнения и сопоставление roadmap ↔ кодовая база: `docs/product/ROADMAP_EXECUTION_2026-04-19.md`.
- На 19 апреля 2026 основные направления Q2-Q3 реализованы; в Q4 остаются расширения Digital Goods и AI Financial Advisor.

---

## 6. OSS Benchmark Overlay (P0 → P4, начиная с Q3 2026)

На основе deep-research по open-source рынку roadmap дополнен слоями «Micro-Business OS». Подробно — в [`OSS_BENCHMARK_STRATEGY_2026.md`](OSS_BENCHMARK_STRATEGY_2026.md).

| Фаза | Тема | Основные референсы | Ключевые результаты |
| :--- | :--- | :--- | :--- |
| **P0** | Платформенный каркас | Webstudio, GrapesJS, Plasmic, PostHog | Block schema с design tokens + data bindings, object graph (leads/bookings/orders/documents), единая event taxonomy, dual analytics. |
| **P1** | Acquisition OS | Dub, Formbricks, Cal.com, Twenty | SmartLink с атрибуцией, dynamic CTA, form/survey qualification, booking с routing traces, приземление в CRM-граф. |
| **P2** | Monetization & Fulfilment | Lago, Medusa, Saleor, Vendure, DocuSeal, Documenso | Product/Offer/Checkout, hybrid billing + metering, оффер→договор→счёт→акт→подпись без выхода из платформы. |
| **P3** | Operator Tooling | Activepieces, Chatwoot, Appsmith | Recipe-based automation, support inbox, backoffice, explainable routing trace, experiments/flags. |
| **P4** | Marketplace & Ecosystem | LinkStack themes, Saleor apps, Vendure plugins, Activepieces pieces | Marketplace блоков/шаблонов/recipes/connectors с manifest+versioning+permissions. |

**Порядок:** builder schema + event model → smart links + forms + booking + CRM → billing + checkout + docs → automation/support/admin → marketplace.
