

# Полный UX/UI аудит Dashboard V2

## 1. Архитектура и навигация

### 1.1 DashboardLayout — ОК с замечаниями
- `bg-background` на контейнере контента — корректно (ранее исправлено с `bg-background/95`)
- `rounded-[2.5rem]` на контейнере контента — на мобильном создаёт ненужные скругления (контент уже edge-to-edge)
- `AnimatePresence mode="wait"` при смене табов — вызывает полную перемонтировку экранов (включая EditorScreen), что **теряет scroll-позицию** и **перезагружает lazy-компоненты**

**Рекомендация**: Для editor-таба использовать `display: none` вместо unmount, чтобы сохранять состояние редактора при переключении табов

### 1.2 DashboardSidebar — glass-эффекты на каркасе
- **Строка 218**: `bg-card/50 backdrop-blur-xl` — сайдбар полупрозрачный, через него просвечивает CanvasBackground
- **Строка 320**: Footer: `bg-card/30` — ещё более прозрачный
- **Нет tooltips** в collapsed-состоянии — пользователь видит только иконки без пояснений
- **Бизнес-зона**: 10+ пунктов в одном разделе — перегружено. `zone-calendar` и `events` дублируют функциональность

**Рекомендация**: Сайдбар должен использовать `bg-card` (непрозрачный). Добавить Tooltip для collapsed. Объединить Calendar/Events

### 1.3 DashboardBottomNav — glass на мобильной навигации
- **Строка 122**: `bg-liquid-mesh glass-strong border border-white/20` — навигация с blur, что может быть размытым на фоне CanvasBackground
- **Строка 153**: Текст `text-[8px]` — экстремально мелкий (нарушает стандарт 12px minimum)
- **5 колонок**: Editor, Activity, Insights, Settings, More — хороший набор

**Рекомендация**: Увеличить текст до `text-[10px]` минимум. Навигация `bg-card` непрозрачная

### 1.4 DashboardHeader — glass + backdrop-blur
- **Строка 36**: `glass-subtle backdrop-blur-3xl border-b border-white/5 shadow-glass` — тройной стеклоэффект на шапке КАЖДОГО экрана
- Этот header рендерится ВНУТРИ `bg-background` контейнера, но всё равно использует glass — визуальный конфликт

**Рекомендация**: `bg-background border-b border-border/10` — непрозрачный, чистый

---

## 2. Экраны

### 2.1 EditorScreen — ядро продукта ✅ с замечаниями
- **Header (337)**: `bg-background border-b border-border/10` — корректно (ранее исправлено)
- **Quick tools bar (401)**: `bg-card` — корректно. Но на мобильном занимает ~52px и НЕ скрывается
- **5 типов баннеров** между header и GridEditor (473-593):
  1. ActivationChecklist (474)
  2. ActivationCelebration (489)
  3. Intelligence hint (496)
  4. Friction recovery (524)
  5. Primary contextual tip (551)
  6. Onboarding hints (572)
  
  **Критично**: На мобильном это может занять 300-400px, оставляя минимум места для блоков

- **Publish button (389)**: `shadow-glass` — стеклянная тень на кнопке публикации

**Рекомендация**: Показывать максимум 1 баннер (приоритет: Activation > Friction > Intelligence > Tips). Скрыть quick tools bar на мобильном за toggle

### 2.2 HomeScreen — перегружен виджетами
- **Activation Checklist** + **Quick Impact Hub** + **Supplementary Widgets** + **Primary Page Card** + **Search Readiness** + **Quick Actions** + **Lifecycle Nudge** — 7 секций
- **Glass-эффекты**: `glass-subtle` на stat-картах (242, 249, 267), buttons (411, 439, 451, 458), page card (341: `glass shadow-glass-lg`)
- **Stat карты дублируются**: Quick Impact Hub (строки 241-271) показывает leads/views, Primary Page Card (374-402) показывает blocks/views/leads — те же данные дважды
- **WalletOverviewWidget, KaspiQRWidget, MetricsGrid, ConversionFunnelWidget, SourcesWidget** — слишком много для Home

**Рекомендация**: Home должен быть кратким: Status Card + 1 метрика + 2-3 Quick Actions. Остальное — в Insights. Убрать дублирование метрик

### 2.3 ActivityScreen — ОК
- Правильная структура с tabs, поиском, lead details
- Достаточно чистый

### 2.4 InsightsScreen — ОК с замечаниями
- Хорошая структура с period selector и chart tabs
- **613 строк** — крупный компонент, но логически обоснован

### 2.5 SettingsScreen — ОК (ранее рефакторен)
- Разделён на PageSettings + AccountSettings tabs — правильно

### 2.6 MonetizeScreen — ОК
- Чистая презентационная структура

### 2.7 PagesScreen — ОК
- Чистая структура с поиском и фильтрами

---

## 3. Компоненты

### 3.1 ActionCard — glass на каркасе
- **Строка 36**: `glass hover:bg-white/10 shadow-glass hover:shadow-glass-lg` — все action-карты стеклянные
- В dashboard-контексте glass не нужен (контент уже на `bg-background`)

### 3.2 StatCard (common) — glass variant
- **Строка 69**: `glass border-white/20 shadow-glass-lg` — используется на HomeScreen
- Создаёт визуальный шум

### 3.3 Card (UI) — default variant с blur
- Default variant: `bg-card/85 backdrop-blur-xl shadow-glass` — каждая карта по умолчанию полупрозрачная
- В editor-block CSS override покрывает это, но **НЕ покрывает** карты вне editor (HomeScreen, Settings, Activity)

---

## 4. Критические UX-проблемы

### 4.1 CanvasBackground + полупрозрачные элементы
**Проблема**: `CanvasBackground` рендерится под всем дашбордом. Хотя контейнер контента теперь `bg-background`, сайдбар (`bg-card/50 backdrop-blur-xl`), BottomNav (`glass-strong`), и DashboardHeader (`glass-subtle backdrop-blur-3xl`) остаются полупрозрачными.

### 4.2 Перемонтировка EditorScreen при смене табов
**Проблема**: `AnimatePresence mode="wait"` с `key={activeTab}` полностью unmount-ит экран при смене таба. Для EditorScreen это означает:
- Потеря scroll-позиции
- Перезагрузка GridEditor (lazy)
- Перезагрузка intelligence/friction hooks
- Flash of loading state

### 4.3 Inconsistent navigation patterns
**Проблема в DashboardV2.tsx**:
- `handleTabChange('home')` → `navigate('/dashboard/home')` 
- `handleTabChange('editor')` → `navigate('/dashboard/home?tab=editor')`
- Все остальные → `navigate('/dashboard/${tabId}')`

Editor навигирует на `/dashboard/home?tab=editor` — это не интуитивно и может вызвать путаницу

### 4.4 `confirm()` нативный диалог
- **PagesScreen строка 557**: `confirm(t('dashboard.pages.deleteConfirm'...))` — нативный confirm, нарушает DS

---

## 5. Performance-проблемы

### 5.1 Excessive lazy imports в DashboardV2
- 25+ lazy imports в одном файле (строки 41-117)
- Каждый создаёт отдельный chunk — может создать waterfall загрузки

### 5.2 `useDashboard` hook instability
- Из аудит-документа: возвращает новый объект каждый рендер, побеждая `React.memo`

### 5.3 Global event listeners
- 5 `window.addEventListener` в DashboardV2 (строки 314-334) — fragile паттерн для связи sidebar → modals

---

## 6. Рекомендованный план исправлений

### Приоритет 1 (Критичный — визуал и UX)
1. **Убрать glass с каркаса дашборда**: DashboardHeader, DashboardSidebar, DashboardBottomNav → непрозрачные `bg-background`/`bg-card`
2. **Лимит на баннеры в EditorScreen**: показывать максимум 1, приоритизировать
3. **Сохранять EditorScreen при смене табов**: не unmount-ить, использовать `display:none`

### Приоритет 2 (UX polish)
4. **Упростить HomeScreen**: убрать дубли метрик, оставить Status + Quick Actions + 1 nudge
5. **Tooltip для collapsed sidebar**: показывать label при hover
6. **Заменить `confirm()` на AlertDialog** в PagesScreen
7. **Увеличить текст BottomNav** с 8px до 10px
8. **Унифицировать маршруты**: editor → `/dashboard/editor` (не `?tab=editor`)

### Приоритет 3 (Tech debt)
9. **Стабилизировать `useDashboard`**: обернуть return в `useMemo`
10. **Заменить global events** на React context или callback props
11. **Группировать lazy imports**: объединить zone-wrappers в один chunk

### Затрагиваемые файлы
- `src/components/dashboard-v2/layout/DashboardHeader.tsx` — убрать glass
- `src/components/dashboard-v2/layout/DashboardSidebar.tsx` — непрозрачный фон + tooltips
- `src/components/dashboard-v2/layout/DashboardBottomNav.tsx` — непрозрачный фон + текст 10px
- `src/components/dashboard-v2/layout/DashboardLayout.tsx` — сохранять editor при смене табов
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — лимит баннеров
- `src/components/dashboard-v2/screens/HomeScreen.tsx` — упрощение
- `src/pages/DashboardV2.tsx` — маршруты + confirm → AlertDialog
- `src/components/dashboard-v2/common/ActionCard.tsx` — убрать glass

