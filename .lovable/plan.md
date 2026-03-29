

# Исправление размытия и визуальных багов в редакторе блоков

## Проблема
Несмотря на предыдущие фиксы DashboardLayout, внутри самого редактора осталось множество источников размытия и визуальных проблем:
- Полупрозрачные фоны блоков (`bg-card/50`) создают эффект "грязного стекла"
- `backdrop-blur-*` в ~8 местах внутри редактора
- `overflow-hidden` на блоках обрезает контролы
- `glass` / `glass-subtle` CSS-классы с blur на кнопках тулбара

## План исправлений

### Файл 1: `src/components/editor/GridEditor.tsx`

**SortableGridBlockItem (строка 193-194):**
- `overflow-hidden` → убрать (обрезает кнопки управления)
- `bg-card/50` → `bg-card` (непрозрачный фон)

**Block type label (строка 267):**
- `bg-background/70 backdrop-blur-sm` → `bg-background`

**DragOverlay grip (строка 371):**
- `bg-primary/20 backdrop-blur-md` → `bg-primary/20`

**Insert divider button (строка 79):**
- `glass-subtle` → убрать (содержит backdrop-blur через CSS)

### Файл 2: `src/components/editor/InlineEditableBlock.tsx`

**Swipe action icons (строки 206, 234):**
- `backdrop-blur-sm` → убрать (на иконках удаления/редактирования при свайпе)

**Swipe hint (строка 378):**
- `bg-card/95 backdrop-blur-xl shadow-glass` → `bg-card shadow-sm`

### Файл 3: `src/components/editor/InlineTextEditor.tsx`

**Overlay (строка 78):**
- `bg-background/95 backdrop-blur-sm` → `bg-background`

### Файл 4: `src/components/editor/BlockContextToolbar.tsx`

**Toolbar (