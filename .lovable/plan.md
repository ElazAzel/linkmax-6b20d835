# План: LinkMAX → Полноценный конструктор сайтов (Tilda-like)

Цель: быстро и экономно эволюционировать LinkMAX из линк-ин-био в мульти-страничный сайт-конструктор, переиспользуя ~80% существующего кода (28+ блоков, редактор, SSR/SEO, CRM, платежи). Никаких переписываний — наращиваем слои.

---

## Текущая позиция (что уже есть)

- 28+ блоков, drag-n-drop редактор, темы, кастомный фон
- Multi-page (есть `PageSwitcher`, базовый роутинг по slug)
- SSR/AEO/SEO, sitemap, JSON-LD, Speakable
- CRM/сделки/инвойсы, платежи Robokassa/Kaspi
- Кастомные домены (`lnkmx.my` через Cloudflare)
- Editor v2: tihiy canvas + SmartActionDock + FloatingBlockToolbar

Чего не хватает для "Тильды":
1. Полноценные секции (Hero, Features, Pricing, Footer) — не как одиночные блоки, а как **готовые модули с настройками**
2. Многостраничность с навигацией (Header/Menu блок, связывание страниц)
3. Zero-block (свободное позиционирование) или хотя бы 12-колоночная сетка
4. Библиотека шаблонов целых сайтов (а не одной страницы)
5. Формы с интеграциями (lead → CRM/Email/Webhook) — частично есть
6. Кастомный код (HTML/CSS/JS embed) — критично для Tilda-аудитории

---

## Стратегия: 4 спринта × 1-2 недели

### Sprint 1 (1 неделя): **Multi-Page Foundation**
Превращаем "одна страница на юзера" в "сайт = коллекция страниц".

- **Header/Navigation блок** (новый, 1 шт): меню по страницам сайта, логотип, sticky, mobile-burger
- **Footer блок** (новый): копирайт, соцсети, мини-меню
- **Page Manager UI**: список страниц сайта в Dashboard, создание/удаление/переименование, выбор "главной"
- **Site-level settings**: общий header/footer, расшариваются между страницами (через `site_settings` jsonb)
- **Роутинг**: `/{username}` = главная, `/{username}/{page-slug}` = вложенные

Технически: добавить таблицу `sites` (1 user → 1 site → N pages), миграция текущих `pages` в эту модель с обратной совместимостью.

### Sprint 2 (1-2 недели): **Section Library + Templates**
Tilda сильна готовыми секциями. У нас 28 блоков — превращаем их в "секции".

- **Section presets**: 40-50 готовых композиций (Hero-01..10, Features-01..08, Pricing-01..05, About, Team, Contacts, CTA, Testimonials, Gallery, FAQ) — все на базе существующих блоков
- **Section Picker UI**: визуальная галерея с превью при вставке (заменит/дополнит текущий AddBlockSheet)
- **Site Templates**: 10-15 полных шаблонов сайтов (Landing SaaS, Restaurant, Photographer, Coach, Agency, Local Business, Event, Course, Portfolio, Shop)
- Шаблоны = JSON в `src/lib/site-templates/`, применяются через "Create from template" в onboarding

### Sprint 3 (1-2 недели): **Power-User Features**
То, без чего Tilda-аудитория не переедет.

- **HTML/CSS/JS Embed блок**: безопасная sandbox-вставка (iframe-srcdoc), для виджетов
- **Form Builder улучшения**: drag-drop полей, валидация, conditional logic, интеграции (Telegram, Email, Webhook, Google Sheets через edge-функцию)
- **Контейнеры/колонки**: 2/3/4-колоночная сетка внутри секции (расширение `GridConfig`)
- **Анимации на скролл**: fade-in/slide через `IntersectionObserver` + `data-animate` атрибут (без новых либ)
- **SEO per-page**: title/description/og:image на каждую страницу (расширить существующий `seo` объект)

### Sprint 4 (1 неделя): **Polish + Pricing Reposition**
- **Site Stats**: аналитика по страницам (трафик, конверсии) — расширение существующего трекинга
- **A/B тесты на уровне страницы** (сейчас на блоках)
- **Repositioning**: лендинг `/` обновить — "Конструктор сайтов и линк-в-био", добавить /websites сравнительную страницу vs Tilda/Wix
- **Pricing tweak**: Pro $13/мес — оставить, добавить лимит "до 5 страниц" на Starter, "безлимит" на Pro
- **Миграция onboarding**: AI Wizard спрашивает "линк-в-био или сайт" → разные стартовые шаблоны

---

## Технические решения (минимум риска)

1. **БД**: новая таблица `sites(id, user_id, name, primary_page_id, settings jsonb)`. `pages` получает `site_id` (nullable для обратной совместимости). Триггер `page_snapshots` сохраняем.
2. **Routing**: `App.tsx` — добавить `/:username/:pageSlug?` поверх существующего `/:username`. SSR-prerender worker расширить аналогично.
3. **Sections vs Blocks**: секция = массив блоков с предзаданными настройками + опциональный wrapper. Не вводим новую сущность в БД — секция это просто preset для вставки.
4. **Templates storage**: JSON-файлы в репо (не БД) — версионируются, легко обновлять, ноль латентности.
5. **Embed безопасность**: `<iframe sandbox="allow-scripts" srcdoc="...">`, CSP, лимит по размеру для Starter.
6. **i18n**: все новые UI-строки сразу в 4 локали (ru/en/kk/uz) — по memory rules.

---

## Что НЕ делаем (Stop List)

- Не пишем zero-block (свободное позиционирование) — дорого, мобайл-нестабильно. 12-колоночная сетка покроет 95% кейсов.
- Не делаем визуальный CSS-редактор à la Webflow — оставляем preset-стили + token-based theming.
- Не трогаем CRM/Business Zones — они уже работают.
- Не меняем стек (React 18, Vite, Tailwind, Supabase).

---

## KPI после внедрения

- Среднее число страниц на активного юзера: 1 → 3+
- Доля сайтов с custom header/footer: >60%
- Conversion Starter → Pro: +30% (за счёт лимита страниц)
- Новый сегмент: "малый бизнес ищет замену Tilda" — отслеживаем через UTM/ASK-в-onboarding

---

## Порядок старта

Начинаем со **Sprint 1** (Multi-Page Foundation) — без него остальные спринты не имеют смысла. Скажи "поехали" и я начну с миграции БД (`sites` table) и Header/Footer блоков.
