# Глобальный план LinkMAX (12 недель + горизонт 6 мес)

## Где мы сейчас
- Multi-page builder (Sprint 1-4) реализован: `sites`, sub-pages, SectionPicker, лимит Starter=2.
- Главная переехала на Bento OS (`HeroBentoOS`), i18n ключи `landing.v5.*` добавлены для 4 языков.
- SEO/AEO: 11 лендингов, блог, sitemap, Speakable/HowTo schema.
- Backend: серверные RPC для админки, RLS hardened.
- Позиционирование: «Сайт + CRM + Платежи в одной OS».

## Цели горизонта
1. Закрепить переход «Link-in-bio → Site Builder» в продукте, маркетинге и продаже.
2. Закрыть Q3 roadmap: CRM Depth, native mobile, экспорт/отчёты.
3. Снять блокеры монетизации: Kaspi/Robokassa one-click, конверсия Starter→Pro.
4. Подготовить Q4 Fintech Core (Wallet, Digital Goods).

---

## Спринт 1 (нед 1-2): Закрепление Site Builder
**Цель:** довести multi-page до production-grade и сделать его очевидным в UI.

- Templates Gallery: 5-7 готовых многостраничных шаблонов (Услуги, Эксперт, Кафе, Магазин, Школа, Портфолио, Лендинг-продукт). Применение в 1 клик через `createSubPage` + seed blocks.
- Page Settings drawer: SEO (title/description/og-image), favicon, custom path validation, 301-редиректы при смене path.
- Navigation Builder: ручная сортировка пунктов меню, hide-from-nav флаг, группировка (dropdown).
- Footer Block (sitewide): один футер на все страницы сайта.
- Onboarding update: после регистрации — выбор «1 страница» vs «Сайт из шаблона».

## Спринт 2 (нед 3-4): Конверсия и монетизация
**Цель:** поднять Starter→Pro на multi-page лимите.

- Soft paywall: при попытке создать 3-ю страницу — модалка с превью Pro + триал 7 дней (одноразовый).
- Upgrade telemetry: события `paywall_shown`, `paywall_cta_click`, `trial_started` в analytics.
- Pricing page rewrite под новый Bento-стиль; FAQ с акцентом на «полноценный сайт за цену линка».
- Kaspi QR one-click из любой Pro-CTA (карточка сделки, paywall, settings).
- A/B тест: лимит Starter 2 vs 3 страницы — измерить conversion.

## Спринт 3 (нед 5-6): CRM Depth (Q3 roadmap)
- Multiple pipelines на зону + переключатель.
- Custom Fields для Deals и Contacts (text/number/select/date).
- Export: CSV/Excel для leads, deals, contacts, transactions.
- PDF-генерация инвойсов и актов (уже частично — допилить шаблоны и брендинг).
- Cmd+K Command Palette: проверка покрытия sub-pages и sections.

## Спринт 4 (нед 7-8): Mobile & PWA V2
- Capacitor 8: `@capacitor/haptics` на drag-n-drop в Kanban, `@capacitor/keyboard` для форм.
- Offline-first: `@tanstack/react-query-persist-client` + IndexedDB для CRM (контакты, задачи, сделки).
- App Store / Google Play submission (iOS bundle уже есть, нужны скриншоты, описания, privacy).
- Push-уведомления о лидах через Capacitor Push + существующий Telegram-канал как fallback.

## Спринт 5 (нед 9-10): SEO Scale & Content
- W5-W6 из старого SEO-плана: SSR-оптимизация для sub-pages (sitemap уже готов, нужен prerender), canonical/hreflang на каждой sub-page.
- 6 новых сравнительных лендингов (vs Tilda, vs Bitrix24, vs Notion Sites, vs Carrd, vs Beacons, vs Koji).
- 8 SEO-статей в блог по AEO-формату (question-led, Speakable).
- Локализация лендингов на kk/uz (сейчас только ru/en полностью).
- Customers page v2: реальные кейсы с метриками.

## Спринт 6 (нед 11-12): Q4 Fintech Foundation
- Internal Wallet: таблица `wallets` + `wallet_transactions` (уже есть, добавить UI).
- Payout request flow (manual approval на старте, автоматизация позже).
- Digital Goods MVP: загрузка файла → защищённая ссылка после оплаты (signed URL с TTL).
- AI Financial Insights v0: weekly digest «доход/расход/прогноз» через Gemini на агрегатах.

---

## Параллельные треки (всё время)
- **DX:** Lefthook git-hooks, React Compiler в report-mode, nuqs для URL-state в фильтрах CRM.
- **Observability:** Sentry Session Replay активация, PostHog при наличии ключа.
- **i18n hygiene:** автопроверка покрытия 4 языков на каждом PR.
- **Security:** ежемесячный security scan, audit RLS на новых таблицах.

## Технический контур (для разработки)
- Новые таблицы: `page_templates`, `nav_items`, `custom_fields`, `pipelines`, `wallets_payouts`, `digital_goods`.
- Новые RPC: `apply_page_template`, `request_payout`, `get_financial_insights`.
- Новые edge-функции: `signed-download` (digital goods), `apple-push` / `fcm-push`.
- Файлы UI: `SiteSettingsDrawer`, `NavigationBuilder`, `TemplateGallery`, `PaywallModal`, `WalletScreen`, `DigitalGoodsManager`.

## Метрики успеха (12 нед)
- Доля пользователей с ≥2 страницами: 5% → 25%.
- Conversion Starter→Pro: текущий baseline +50%.
- D30 retention: +10 п.п. за счёт CRM-данных и offline PWA.
- Органический трафик: +40% (sub-pages в индексе + новые лендинги).
- App Store rating: ≥4.5 на старте.

## Что НЕ делаем (Stop List)
- Не возвращаем Business Zones в Solo-UI (только Business-tier).
- Не добавляем токены/Linkkon в core-воронку оплат.
- Не переписываем editor engine — только расширяем.
- Не вводим 3-й тариф между Starter и Pro.

## Приоритет следующего шага
Старт со Спринта 1 (Templates + Page Settings) — это сразу повышает воспринимаемую ценность multi-page и питает paywall в Спринте 2.