## Цель

Превратить редактор блоков из «панели управления с кнопками везде» в **тихий канвас + контекстный интеллект**, по паттернам 2026 (Framer, Notion, Figma Sites, Linear): минимум хрома по умолчанию, всё нужное появляется по контексту, первое действие — за один тап, ценность («ты ближе к первому лиду») всегда на виду.

## Что не так сейчас

1. **Шум в шапке**: 4 фильтр-чипа (Шаблоны/История/Структура/Проблемные/CTA) + квадрат иконок + Publish + Live-pill — всё конкурирует за внимание.
2. **Шум на блоках**: на каждом блоке постоянно видны drag-handle, type-label, 3–4 кнопки в правом углу, hover-overlay.
3. **Дублирующиеся точки добавления**: Insert-divider между каждой парой + большой dashed «add» снизу + FAB на мобайле + ещё `BlockInsertButton` в empty-state. Пользователь не знает, какой использовать.
4. **Нет «продающего» сигнала прогресса**: блоки добавлены, но не видно «насколько готова страница к продажам».
5. **Превью прячется** за иконкой глаза — на мобайле нет split-view.
6. **Нет inline-правки заголовков** на видном уровне; все клики ведут в bottom-sheet.

## Новая архитектура — три слоя

```text
┌───────────────────────────────────────────────────┐
│ Top Bar (compact, 56px)                           │
│  [Back] [Page name ▾]   [progress·preview]  [⚡]  │
├───────────────────────────────────────────────────┤
│                                                   │
│         CANVAS (тихий, без хрома)                 │
│                                                   │
│   • Hover/tap → floating BlockToolbar (popover)   │
│   • Selected block → bottom contextual bar        │
│   • Insert → only between hover + sticky "+ Add"  │
│                                                   │
├───────────────────────────────────────────────────┤
│ Smart Action Dock (sticky bottom, 64px)           │
│  [+ Block] [✨ AI] [👁 Preview] [🚀 Publish ▸]    │
└───────────────────────────────────────────────────┘
```

## Компоненты

### 1. `EditorTopBar` (новый, заменяет actions+bottomSlot в DashboardHeader)

- Высота 56px, sticky, `bg-background/80 backdrop-blur-md`.
- Слева: back + **page switcher** с inline-edit названия страницы.
- Центр: **PageHealthMeter** — компактная полоска прогресса «3 из 5 шагов до продаж» (использует существующий `useActivationChecklist`); клик → раскрывает чек-лист в popover. Это и есть «продающий сигнал».
- Справа: **Preview** (iconButton, на ≥md показывает label), **Publish/Share** (primary, gradient если не опубликовано, secondary если опубликовано → меняется на «Поделиться»).
- Undo/Redo, Структура, Версии, Review-modes уезжают в **overflow-menu (⋯)** + работают через keyboard shortcuts (`⌘Z`, `⌘⇧Z`, `⌘K` уже есть).

### 2. `EditorCanvas` (рефактор GridEditor)

- Убрать постоянно видимые: drag-handle, type-label, кнопки edit/duplicate/delete на каждом блоке.
- На hover (desktop) / single-tap (mobile): показать **`FloatingBlockToolbar`** (popover, 5 иконок: edit, duplicate, transform, AI-improve, delete) над блоком — паттерн Notion/Framer.
- Long-press / multi-select: подсветить + показывать существующий `BulkActionBar`.
- Type-label оставить, но только для **selected/hover** блока (бейдж в углу появляется fade-in 150ms).
- **Empty hint chip** (амбер «нужен URL») остаётся — это product critical.
- **Insert-divider**: показывать только между hover-парой + один в самом низу. Убрать дубль внизу-FAB-empty-state.

### 3. `SmartActionDock` (новый, sticky bottom)

- Высота 64px на мобайле, 56px десктоп.
- 4 кнопки равной важности: **+ Add Block** (primary, hint label «Что добавить?»), **AI Improve** (если ≥1 блок: «Улучшить страницу»), **Preview** (toggle split-view на десктопе), **Publish** (primary CTA после готовности; меняется на Share после публикации).
- При публикации → micro-celebration animation (scale-in + emerald check).
- На мобайле заменяет текущий FAB + bottom dashed «add» + bottom DashboardBottomNav поднимается над ним (z-index согласован).

### 4. `PageHealthMeter` (новый виджет в TopBar)

- Источник: `useActivationChecklist` (уже есть).
- Видно: `▓▓▓░░ 3/5 · Готова на 60%` + tooltip «следующее: добавить контактную кнопку».
- Клик → popover со списком шагов с иконками (galочки + remaining).
- Цвет: muted при <60%, primary при 60–99%, emerald + confetti-ping при 100%.
- Это создаёт «продающий» loop: пользователь видит, что ещё нужно сделать, чтобы получать лиды.

### 5. `FloatingBlockToolbar` (новый, заменяет absolute-кнопки в SortableGridBlockItem)

- Появляется над выделенным/hover блоком, position: floating-ui (`@floating-ui/react` уже в зависимостях через radix).
- 5 иконок: Edit · Duplicate · Transform (rename type) · AI-Improve · Delete.
- Mobile: при long-press/edit-tap раскрывается как bottom action sheet (используем уже существующий `MobileBlockActions`).
- Drag-handle превращается в **hold-anywhere-on-block** (сразу drag после 200ms hold) — паттерн Linear/Notion.

### 6. Inline-edit заголовков

- Расширить `InlineTextEditor` так, чтобы в блоках с `title`/`subtitle` (button, link, header, profile) клик по тексту прямо в канвасе → contenteditable, без открытия sheet.
- Уже есть `supportsInlineEdit` — добавить туда text-block + header + button.

### 7. Превью

- Десктоп: добавить toggle «Split View» (canvas | live preview iframe `FramePreview` уже есть). 50/50 layout, sticky.
- Мобайл: Preview = full-screen sheet с устройством-frame (iPhone-like), кнопкой share.

## Поведение и микровзаимодействия

- Все transitions ≤200ms ease-out, opacity-only (по Sprint 1 стандарту).
- Drag-feedback: `scale(0.98)` + `ring-primary/40`, тень `0 8px 24px hsl(var(--primary)/0.15)`.
- Recently-added блок: `animate-scale-in` + auto-scroll, ring fade-out за 1.5s (уже есть, оставить).
- Hover-on-canvas-divider: divider раскрывается из 1px в 32px кнопку «+ Add», с тонким лейблом «Insert between».
- Friction-recovery (`useFrictionRecovery`) → `Toast` сверху, не баннер на канвасе.

## Что не трогаем

- `BlockRenderer`, `BLOCK_MANIFEST`, типы блоков, репозитории.
- Логика `useEditorStore`, sections, multi-select, transform-engine, friction-recovery — всё переиспользуем.
- Save/autosave, undo/redo, версии — только перенос UI.
- `StructureView`, `BulkActionBar`, `MobileBlockActions`, `BlockContextToolbar`, `ExperimentSetupDialog` — оставляем, подключаем через новые точки входа.

## Новые/изменяемые файлы

**Новые:**
- `src/components/editor/v2/EditorTopBar.tsx`
- `src/components/editor/v2/SmartActionDock.tsx`
- `src/components/editor/v2/PageHealthMeter.tsx`
- `src/components/editor/v2/FloatingBlockToolbar.tsx`
- `src/components/editor/v2/SplitPreviewLayout.tsx`

**Меняем:**
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — заменить `DashboardHeader` actions/bottomSlot на `EditorTopBar`, добавить `SmartActionDock`, перенести баннеры в `Toast`.
- `src/components/editor/GridEditor.tsx` — убрать постоянные кнопки/handle/label, подключить `FloatingBlockToolbar`, схлопнуть точки добавления, hold-to-drag.
- `src/components/editor/InlineTextEditor.tsx` — расширить `supportsInlineEdit`.
- `src/lib/editor/inline-edit-config.ts` — добавить header/button/text.

## План работ (один заход)

1. Создать `EditorTopBar` + `PageHealthMeter` + `SmartActionDock`. Подключить в `EditorScreen`, скрыть старые actions/toolbar.
2. Создать `FloatingBlockToolbar`. Рефакторить `SortableGridBlockItem`: убрать постоянные кнопки и handle; включить hold-to-drag и hover/tap toolbar.
3. Схлопнуть insert-points: оставить hover-divider между блоками + один dashed-add в конце; убрать FAB и empty-state дубль (заменить на dock).
4. Расширить inline-edit на header/button/profile-name; убедиться что bottom-sheet остаётся fallback.
5. Добавить Split Preview на десктопе через `SplitPreviewLayout` + `FramePreview`.
6. Перенести Friction/Tip/Onboarding баннеры в `useToast` (не загромождать канвас).
7. Унести Структура/Версии/Review chips в overflow-menu в TopBar.
8. Прогнать `tsc --noEmit`, smoke-test в браузере: добавить блок → редактирование → publish; проверить mobile dock не перекрывает BottomNav (z-index, padding-bottom).

## Технические детали

- **Floating UI**: использовать `@radix-ui/react-popover` + `Portal`, чтобы FloatingBlockToolbar не клиппился под grid.
- **z-index** дисциплина: canvas `z-0`, block-overlays `z-10`, floating toolbar `z-30`, dock `z-40`, top bar `z-50`, dialogs `z-[60]`.
- **Mobile padding-bottom**: канвас получает `pb-[calc(env(safe-area-inset-bottom)+128px)]` чтобы dock + BottomNav не перекрывали.
- **A11y**: dock имеет `role="toolbar" aria-label="Editor actions"`, кнопки — `aria-keyshortcuts`. Floating toolbar управляется клавиатурой (Tab/Enter/Esc).
- **Сохранить i18n keys**, добавить новые: `editor.dock.add`, `editor.dock.ai`, `editor.dock.preview`, `editor.dock.publish`, `editor.health.label`, `editor.health.next`, `editor.topbar.overflow`.
- **Не ломать**: те же props у `EditorScreen`, тот же контракт `onInsertBlock/onEditBlock/...`. Изменения чисто презентационные + перенос триггеров.

## Acceptance criteria

- На канвасе по умолчанию **нет ни одной кнопки** на блоках (всё по контексту).
- В шапке **≤4 интерактивных элемента** одновременно (Back/Switcher · Health · Preview · Publish).
- Первое действие нового пользователя — **«+ Add Block»** в доке — достижимо за один тап с любого экрана редактора.
- Прогресс-бар «готова к продажам» виден всегда; клик показывает следующий шаг.
- На мобайле dock не перекрывает блоки и согласован с BottomNav.
- Десктоп: split-preview работает и обновляется при изменениях.
- `bunx tsc --noEmit` зелёный, smoke-flow добавления/редактирования/публикации работает без регрессий.
