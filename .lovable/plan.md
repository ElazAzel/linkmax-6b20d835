

# Полный аудит UX/UI дашборда и редактора блоков

## Часть 1: Почему блоки ВСЁ ЕЩЁ размыты

CSS-override в `index.css` работает только внутри элементов с `data-editor-block`. Но проблема в **слоях ВЫШЕ блоков**:

### 1.1 `DashboardLayout.tsx:73` — полупрозрачная обёртка контента
```
bg-background/95 rounded-[2.5rem] border border-white/5
```
Весь контент дашборда (включая редактор) обёрнут в `div` с **95% прозрачностью**. Через него просвечивает `CanvasBackground` (анимированный фон). Это даёт "молочный" эффект на **всём**, включая блоки редактора.

### 1.2 `EditorScreen.tsx:337` — sticky header с glass-nav
```
<div className="sticky top-0 z-40 glass-nav border-b border-white/10">
```
Шапка редактора использует `glass-nav` (backdrop-blur + полупрозрачный фон). Это НЕ внутри `[data-editor-block]`, поэтому CSS-override не действует.

### 1.3 `EditorScreen.tsx:500` — intelligence hint banner
```
shadow-glass-sm backdrop-blur-sm
```
Баннер подсказок тоже использует blur.

### 1.4 `CanvasBackground` в `DashboardV2.tsx:444`
Анимированный фон рендерится под всем дашбордом. В сочетании с `bg-background/95` на контейнере — весь контент выглядит "за стеклом".

---

## Часть 2: Другие UX/UI проблемы

### 2.1 Sticky header мешает на мобильном
EditorScreen header (строки 337-471) = **120-140px** sticky-контента:
- Заголовок + кнопки (≈56px)
- Quick tools bar (≈52px)
На экране 573px это **25%** viewport занято панелями, оставляя мало места для редактирования.

### 2.2 Слишком много hint-баннеров одновременно
EditorScreen рендерит ДО 4 баннеров между header и GridEditor:
1. ActivationChecklist (строка 474)
2. Intelligence hint (строка 496)
3. Friction recovery hint (строка 524)
4. Primary contextual tip (строка 551)
5. Onboarding hints (строка 572)

На мобильном это может занять весь viewport, и пользователь вообще не видит блоки.

### 2.3 Три FAB-кнопки "Добавить блок" на мобильном
GridEditor рендерит:
1. `InsertBetweenDivider` между каждой парой блоков
2. Bottom add button (строка 774)
3. Fixed FAB внизу справа (строка 815)
4. Hidden insert sheet (строка 834)

Три визуальных способа добавить блок — избыточно.

### 2.4 `overflow-hidden` на DragOverlay (строка 373)
```
className="... overflow-hidden cursor-grabbing"
```
При перетаскивании крупных блоков контент обрезается.

### 2.5 `pointer-events-none` на блоках (строка 237)
```
<div className="pointer-events-none w-full h-full" data-editor-block>
```
Правильно для предотвращения кликов, но означает что блоки не могут иметь hover-состояния (например, подсветку ссылок).

### 2.6 Нет кнопки "Назад" на мобильном в EditorScreen
На мобильном пользователь не может вернуться к другим разделам, кроме как через bottom nav. Header не показывает кнопку назад.

---

## Часть 3: План исправлений

### Шаг 1: Убрать размытие на уровне layout (КРИТИЧНЫЙ)

**`DashboardLayout.tsx:73`** — заменить полупрозрачный фон на непрозрачный:
```
bg-background/95 → bg-background
border-white/5 → border-border/5
```

**`EditorScreen.tsx:337`** — заменить glass-nav на непрозрачный header:
```
glass-nav border-b border-white/10 → bg-background border-b border-border/10
```

**`EditorScreen.tsx:500`** — убрать blur с intelligence hint:
```
shadow-glass-sm backdrop-blur-sm → shadow-sm
```

### Шаг 2: Оптимизировать мобильный EditorScreen

- Quick tools bar: скрыть на мобильном или сделать collapsible (сэкономить 52px)
- Баннеры: показывать **максимум 1** баннер, приоритизировать по важности (Activation > Intelligence > Tips)
- Убрать fixed FAB если есть InsertBetweenDivider (или наоборот — оставить только FAB)

### Шаг 3: Мелкие фиксы
- DragOverlay: `overflow-hidden` → `overflow-visible`
- Оставить CSS-override `[data-editor-block]` как есть (для блоков, которые имеют свои glass-классы)

### Затронутые файлы
- `src/components/dashboard-v2/layout/DashboardLayout.tsx` — 1 строка
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — 3-5 строк (header, hints, toolbar)
- `src/components/editor/GridEditor.tsx` — 1 строка (DragOverlay overflow)

### Что НЕ трогаем
- `index.css` — текущий override оставляем
- `CanvasBackground` — оставляем (после непрозрачного `bg-background` он просто не будет видно через контент)
- Код блоков — не меняем
- Публичная страница — не затрагивается

