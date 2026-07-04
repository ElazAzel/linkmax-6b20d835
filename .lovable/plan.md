## Цель

Снять «сложность» и привести 4 поверхности (Dashboard, Editor, Blocks, Public Page) к одному визуальному языку — **Quiet Bento**: тишина и порядок Apple/Linear + смысловая плотность Bento.me. Ликвид-стекло остаётся, но только как акцент, а не как фон всего интерфейса.

## Принципы (применяются ко всем 4 поверхностям)

1. **Один радиус**: `--radius-card: 28px`, `--radius-control: 14px`, `--radius-pill: 999px`. Убрать зоопарк `rounded-xl/2xl/3xl`.
2. **Одна тень**: `--shadow-soft` (для карточек) + `--shadow-lift` (для hover/active). Убрать `shadow-lg/xl/2xl` россыпью.
3. **Стекло — точечно**: только top-bar, bottom nav, command palette, floating toolbars. Контентные карточки — **плотные**, без `backdrop-blur`.
4. **Цвет**: 1 нейтральная база + 1 акцент. Спрятать второстепенные tinted-градиенты в карточках статистики.
5. **Типографика**: одна шкала (12/14/16/20/28/40), `tracking-tight` на заголовках, `font-medium` (не bold) для UI-надписей.
6. **Состояния**: единый `SmartEmptyState` (уже есть), единый `LoadingSkeleton`, единый `ErrorState`. Запретить ad-hoc спиннеры.

## Этапы

### Sprint A — Design tokens (фундамент, 1 проход)
- `src/index.css`: добавить новые semantic-токены (`--radius-card`, `--shadow-soft`, `--shadow-lift`, `--surface-quiet`, `--surface-raised`, `--surface-glass`).
- `tailwind.config.ts`: пробросить `rounded-card`, `shadow-soft`, `shadow-lift`, `bg-surface-quiet`, `bg-surface-raised`, `bg-surface-glass`.
- Файл `src/styles/quiet-bento.css` с утилитами `.qb-card`, `.qb-card-raised`, `.qb-glass`, `.qb-control`.

### Sprint B — Dashboard shell
- `DashboardLayout.tsx`: убрать «карточку-контейнер» `rounded-[2.5rem] border` вокруг контента — она дублирует фон и создаёт «коробку в коробке». Контент кладётся прямо на `--surface-quiet`.
- `DashboardSidebar`: уменьшить иконки до 18px, убрать активный «pill»-фон → заменить на тонкую левую черту 2px + увеличенный `font-medium`.
- `DashboardBottomNav`: стекло остаётся, но контраст активной иконки делается через цвет, не через капсулу.
- `HomeScreen`: 1 главная Bento-карточка (статус страницы + Edit/Publish/Share как chips), 3 KPI в одной строке, секция «Что улучшить» (AI-рекомендации) — без декоративных градиентов.
- `PagesScreen` / `InsightsScreen`: единый header через `DashboardHeader` слоты, карточки `.qb-card`.

### Sprint C — Editor canvas
- `EditorTopBar`: высота h-14, только Health/Save/Preview/Publish; убрать дубль-кнопки.
- `SmartActionDock`: одна плавающая капсула снизу `+ Блок · AI · Превью · Опубликовать`, glass.
- `GridEditor`: спрятать сетку (dots) по умолчанию, показывать при drag. Hover-state блока — только outline 1px + `shadow-lift`, без подсветки фона.
- `FloatingBlockToolbar`: появляется только на selected, не на hover (меньше шума).
- Add Block Sheet: убрать вкладки → одна вертикальная лента категорий слева + grid справа, поиск всегда фокусирован.

### Sprint D — Сами блоки (внутренняя вёрстка)
- Единый `BlockShell` (обёртка): `.qb-card`, padding по пресету (`sm/md/lg`), консистентные `title`/`subtitle`/`media`/`cta` слоты.
- Привести `LinkBlock`, `ButtonBlock`, `ProductBlock`, `MessengerBlock`, `TestimonialBlock`, `FAQBlock`, `PricingBlock`, `EventBlock` к этому shell.
- Иконки соцсетей в `SocialsBlock` — монохром по умолчанию, цветные только на hover.
- `ProfileBlock`: убрать тяжёлый glass-фон, оставить аватар + имя + bio + 1 ряд chip-actions.

### Sprint E — Публичная страница
- `GridBlocksRenderer`: интеллектуальная Bento-раскладка уже есть → добавить «дыхание» (28px gap на мобиле уменьшить до 12px, между секциями — 32px), плавный fade-in (stagger 40ms, не 100ms).
- `SiteHeaderNav`: компактный, стекло только при скролле > 8px.
- `SiteFooter`: минимальный, 1 строка, без декоративных блоков.
- CTA-блок (tel/wa/tg) — закрепить как `sticky bottom-4` на мобиле, но визуально как `.qb-glass` капсула.

### Sprint F — Чистка
- Удалить устаревшие `shadow-lg`/`rounded-3xl`/`bg-gradient-to-*` в дашборде и редакторе через codemod (`scripts/quiet-bento-codemod.mjs`).
- Прогнать `npm run lint`, исправить i18n-ключи если ломаются.

## Технические детали

- Токены HSL (как требует design-system standard), все цвета только семантические.
- Сохранить совместимость с тёмной темой (`.dark` уже есть).
- Никаких миграций БД, никаких изменений бизнес-логики.
- E2E (`e2e/editor-add-block-sheet.spec.ts`, `e2e/page-creation.spec.ts`) проходят без правок — селекторы по `data-testid` уже стоят.

## Что НЕ делаем сейчас

- Не трогаем CRM/Zones/Billing UI (вне 4 поверхностей).
- Не меняем структуру роутов и i18n-ключи.
- Не вводим новые шрифты.

## Порядок выполнения

A → B → C → D → E → F. После каждого спринта — короткое демо-скриншот в чат, чтобы вы могли сказать «дальше» или «откатить».