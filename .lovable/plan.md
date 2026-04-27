
# UX/UI Аудит LinkMAX

Ниже — структурный аудит платформы по экранам, с обнаруженными проблемами и приоритетом фиксов. Аудит основан на чтении исходников ключевых экранов (`Index`, `DashboardV2`, `HomeScreen`, `EditorScreen`, `LeadsScreen`, `PagesScreen`, `InsightsScreen`, `SettingsScreen`, `PublicPage`, `DashboardLayout`, `DashboardBottomNav`, `DashboardSidebar`).

---

## 1. Landing (`/`)

**Сильные стороны**
- Чёткий «Premium / Living Canvas» стиль, Dynamic Island навигация, Bento-grid, Sticky Mobile CTA.
- SEO/AEO-стек на месте (Speakable, GEO, AISearchOptimizer).
- Революня calc + Comparison + Testimonials = хорошая воронка убеждения.

**Проблемы**
- **Когнитивная перегрузка above-the-fold на мобильных (393×573)**: hero + DynamicIsland + LiquidCursor (десктоп) + GrainOverlay + CanvasBackground + Sticky CTA одновременно создают визуальный шум, на маленьких экранах CTA «теряется».
- **Двойные CTA**: nav-signup + hero-signup + sticky-mobile-CTA + bottom-CTA — пользователь видит 4 одинаковых призыва, без явной приоритезации (primary vs secondary).
- **LogoTicker / social proof** иногда грузится позже hero — мелькание layout shift.
- **Pricing «Aurora»** красиво, но цена/фичи сравниваются по двум планам Starter/Pro — отсутствует явный «recommended» бейдж и якорный pricing (старая цена → новая).
- **FAQ** не имеет inline-search/раскрытия по группам — длинный аккордеон на мобильных.

**P0 фиксы**
- Привести CTA к одному primary-стилю на странице и одному вторичному (Outline). Sticky Mobile CTA = только когда hero ушёл за viewport.
- Зарезервировать высоту LogoTicker (CLS).
- Добавить «Most popular» бейдж и якорную цену в Pricing.

---

## 2. Dashboard (`/dashboard/*`)

**Архитектура**
- Mobile: Bottom nav (5 кнопок) + «Ещё» Sheet с 6 пунктами.
- Desktop: Sidebar с группами (Pages, Business tools, Settings).
- Контент в карточке `rounded-[2.5rem] border-border/5` внутри `max-w-7xl`.

**Проблемы**
- **Несимметрия mobile vs desktop nav**: на мобильном «Главная/Обзор» спрятан в «Ещё», хотя это логичный home → пользователь, попав в `editor` сразу, не видит активацию/чек-лист без открытия sheet. Это ломает onboarding-loop.
- **`p-2 md:p-8` + внутренний `rounded-[2.5rem]` + `border-border/5`**: на мобильном двойной контейнер съедает горизонтальное пространство (~12px каждый край) и даёт «карточка в карточке» эффект. Контент и так узкий.
- **DashboardBottomNav: текст `text-[10px] uppercase tracking-tighter font-bold`** + `whitespace-normal break-words` — на 393px «Аналитика» переносится, теряя выравнивание иконок.
- **`AnimatePresence mode="wait"` + `y: 12 → -12`** на каждое переключение таба — ощущается медленно (500ms easing curve), особенно с lazy-loading скрина.
- **HomeScreen**: одновременно показывает Activation Checklist + StatusBadge + Page Card + MetricsGrid + ConversionFunnel + Sources + Operator + Wallet + RepeatCustomers. На мобильном это длинный скролл без иерархии — нет «above-the-fold value».
- **InsightsScreen**: 5 табов (overview, traffic, blocks, funnel, experiments) в одном `TabsList` — на 393px не помещается, появляется нечитаемый горизонтальный скролл.
- **LeadsScreen**: фильтр статусов (`all/new/contacted/qualified/converted/lost`) — 6 чипов в строку на мобильном неудобны; нет «save view» / «default = только new+contacted».
- **PagesScreen**: лимиты (`Progress` + `currentPages/maxPages`) и upgrade-CTA не закреплены — теряются при скролле длинного списка.
- **SettingsScreen**: 30+ пропсов в одном экране, нет навигационной hierarchy («где я?») кроме 2 табов «Page / Account». При большом количестве полей нужны якорные подгруппы и search.
- **DashboardHeader дублируется в каждом screen** — вместо одного top-bar в layout. Это ведёт к разным title/back-логикам.
- **Скелетоны разные на каждом экране** — отсутствует единый стандарт `LoadingSkeleton`.

**P0 фиксы**
- Перенести `home` в bottom nav (Главная вместо «Аналитика» как 1-й таб) и в desktop sidebar в `MAIN_ITEMS`. Аналитику оставить второстепенной.
- Сократить `p-2` до `p-0` на mobile + убрать внутренний `border` карточки (или layout-карточка ИЛИ screen-карточка, не оба).
- Bottom nav: не uppercase, `text-[11px]`, без `tracking-tighter`, без `break-words` (truncate ellipsis).
- Снизить переход экрана до 200ms `ease-out`, без `y` — только opacity.
- InsightsScreen: tabs → `Select` на mobile, `TabsList` только на md+.
- LeadsScreen: дефолтный фильтр «активные» (new+contacted) и собранный «Filter» Sheet вместо ряда чипов.

**P1 фиксы**
- Единый `DashboardHeader` в `DashboardLayout` с slot’ами (title, actions).
- Поиск в SettingsScreen + collapsible подгруппы.
- HomeScreen: чек-лист в свернутом виде (collapse), когда активация ≥ 80%; KPIs выше fold.

---

## 3. Editor (`/dashboard/home?tab=editor`)

**Сильные стороны**
- Mobile-first GridEditor, Structure View, Friction Recovery, Activation Checklist на месте.
- Undo/Redo, History, AI generator, Templates — мощный функционал.

**Проблемы**
- **Top bar сильно перегружен**: Preview + Share + Templates + AI + Undo + Redo + Versions + Structure + Lightbulb + Layers (≥10 кнопок). На 393px они уезжают за край или схлопываются в иконки без подписей — без tooltip'ов на тач-устройствах непонятно, что они делают.
- **«MousePointerClick» / «AlertCircle» / «Lightbulb»** — без явного значения для нового пользователя.
- **Friction Recovery banner** показывается над холстом, но иногда закрывает первую секцию.
- **Add block UI**: floating «+» vs slot-based vs preset-based — три ментальные модели одновременно.
- **Editor + Settings + Theme + Versions** — все в виде drawer’ов, но открываются с разных сторон (`right`, `bottom`, `dialog`), без общего паттерна.

**P0 фиксы**
- Сгруппировать тулбар: `[Preview] [Share]` слева, `[Undo Redo]` центр, `[…]` справа (overflow menu для AI/Templates/Versions/Structure).
- Tooltip + label-on-hover на десктопе и aria-label на мобильном; на длинном тапе — подсказка.
- Friction Recovery → toast или нижний bar, не over-canvas.

**P1 фиксы**
- Единая ментальная модель Add Block: «Inline +» между блоками + «Insert Sheet» с поиском. Убрать второй вход.
- Унифицировать drawers: на mobile все side="bottom", на desktop side="right".

---

## 4. Public Page (`/{slug}`)

**Сильные стороны**
- Корректный SEO/AEO, JSON-LD, Speakable, share-dialog с QR.
- Animations через framer-motion, Heatmap tracking.
- Skeleton + ErrorState на месте.

**Проблемы**
- **Контент-лимит ширины**: рендер блоков в одну колонку без `max-w` может растягивать text-blocks на больших экранах (>700px), плохо для читаемости.
- **Watermark «Made on LinkMAX»** на free tier — не перепроверял, но обычно это поглощается контентом и пользователи путают с реальным CTA.
- **Share Dialog**: copy + QR + ExternalLink — но нет «Поделиться в WhatsApp/Telegram» прямой кнопкой (хотя это primary-канал распространения для целевой аудитории KZ/RU).
- **Language switcher** lazy-loaded — мелькание при первой загрузке.

**P0 фиксы**
- Ограничить content width до `max-w-[680px] mx-auto` на text/long-form блоках.
- В Share Dialog добавить native share + WhatsApp/Telegram кнопки.

**P1 фиксы**
- Префетч language switcher или статичный fallback на сервере.

---

## 5. Auth & Onboarding

- `Auth.tsx` — реэкспорт из `components/screens/Auth`. Не аудировал детально, но проверить:
  - **Двухступенчатая активация**: после регистрации сразу AI Builder Wizard (мемори-правило). На мобильном Wizard должен быть полноэкранный, без ухода в скролл.
  - **OAuth кнопки**: Google primary, не утоплены.
  - **Email confirm**: должен быть ясный экран «проверьте почту» с resend.

**P1 фиксы**
- Провести отдельный аудит Auth-экрана и Wizard’а после P0.

---

## 6. Кроссэкранные UX-стандарты

**Проблемы**
- **Иконки lucide импортируются по одной (`from 'lucide-react/dist/esm/icons/...'`)** — корректно для бандла, но дублирование в каждом файле снижает читабельность. Рассмотреть `@/components/icons` барель.
- **Empty States**: внедрены `SmartEmptyState` (хорошо!), но соседствуют со старыми `EmptyState` в одних и тех же файлах — фрагментация. Завершить миграцию.
- **Toasters**: используется `sonner` — хорошо, но нет единого правила длительности/позиции.
- **Цветовые токены**: `text-muted-foreground/60`, `border-border/5`, `border-border/10` — слишком много альфа-вариантов. Свести к 2-3 семантическим уровням.
- **Шрифт CTA**: смесь `font-bold uppercase tracking-tighter` (bottom nav) и `font-medium` (cards) — нет typography scale.
- **Доступность (a11y)**: на bottom-nav кнопках нет `aria-label` (только текст внутри), кнопки иконок в editor без aria. Контрастность `text-muted-foreground/60` на тёмном фоне ниже WCAG AA.

**P0 фиксы**
- Единый компонент `EmptyState` (мигрировать всё в `SmartEmptyState`, удалить старый).
- Sonner: единый конфиг (`position="top-center" duration={3000}` на mobile).
- Аудит `aria-label` на всех icon-only кнопках.

**P1 фиксы**
- Зачистить альфа-токены, оставить `border-border`, `border-border-strong`, `text-muted`, `text-muted-strong`.

---

## Приоритезированный план реализации

### Спринт 1 (P0) — «Quick wins»
1. **Bottom Nav redesign**: home → 1-й таб; tabs `text-[11px]` без uppercase/break-words; единые `aria-label`.
2. **Dashboard layout cleanup**: убрать двойной padding/border (`p-2`+`rounded-[2.5rem]`+`border`) → один контейнер.
3. **Tab transition**: 500ms y-translate → 200ms opacity-only.
4. **Editor toolbar**: сгруппировать в 3 кластера, overflow menu для редкой части.
5. **Insights tabs**: на mobile → `Select`, на desktop → `TabsList`.
6. **Leads filter**: дефолт «активные» + filter Sheet вместо ряда чипов.
7. **Landing CTA**: один primary, один secondary; Sticky CTA только после hero.
8. **Public Page share**: добавить WhatsApp/Telegram кнопки + native share.

### Спринт 2 (P1) — «Системные стандарты»
9. **Единый `DashboardHeader`** в layout со slot-ами.
10. **HomeScreen иерархия**: KPIs above the fold; чек-лист сворачиваемый.
11. **Settings**: search + collapsible подгруппы.
12. **Drawers унификация**: mobile=bottom, desktop=right.
13. **Empty States**: завершить миграцию на `SmartEmptyState`, удалить старый.
14. **Editor add-block**: одна модель (inline + Insert Sheet).
15. **Public Page max-width** на текстовых блоках.

### Спринт 3 (P2) — «Polish»
16. Цветовые/типографические токены: свести альфа-варианты, ввести typography scale.
17. A11y-аудит icon-only кнопок (aria-label, focus rings).
18. Auth/Wizard отдельный аудит и оптимизация.
19. Pricing: «Most popular» бейдж, якорная цена.
20. CLS на Landing (LogoTicker, lazy-блоки).

---

## Что делать дальше

После одобрения этого плана я начну со **Спринта 1 (P0)** — это 8 задач, которые дадут самый заметный UX-улучшения за минимум кода. Если хочешь, могу начать только с 1–4 (Dashboard core), либо с 7–8 (Landing/Public), либо целиком — скажи приоритет.
