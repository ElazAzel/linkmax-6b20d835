

# Исправление визуальных проблем редактора

## Корневая причина

Редактор рендерится внутри `DashboardLayout.tsx` (строка 73), который оборачивает **весь контент** в контейнер с классом `glass`:

```
<div className="max-w-7xl mx-auto glass rounded-[2.5rem] min-h-full shadow-glass-lg border border-white/5 overflow-hidden">
```

Это создаёт **3 визуальных бага одновременно**:

### 1. Двойной backdrop-blur размывает содержимое
Класс `glass` применяет `backdrop-filter: blur(16px)` ко всему контейнеру. Внутри него EditorScreen добавляет ещё слои blur:
- `glass-nav` на хедере (ещё blur)
- `backdrop-blur-md` на тулбаре
- `bg-card/50 backdrop-blur-xl` на отдельных блоках (InlineEditableBlock)

Наложение blur-слоёв друг на друга = мутное, размытое содержимое.

### 2. `overflow-hidden` обрезает элементы управления
Кнопки редактирования блоков (`-top-3 right-2`) и контекстные тулбары выходят за границы блоков. `overflow-hidden` на внешнем glass-контейнере **обрезает** их.

### 3. Полупрозрачный фон (`glass-bg: ... / 0.65`) делает контент тусклым
Glass-фон с альфа-каналом накладывается на CanvasBackground, создавая эффект "грязного стекла" поверх контента.

## План исправлений

### Шаг 1. Убрать `glass` с обёртки контента в DashboardLayout
**Файл:** `src/components/dashboard-v2/layout/DashboardLayout.tsx:73`

Заменить `glass rounded-[2.5rem] min-h-full shadow-glass-lg border border-white/5 overflow-hidden` на `bg-background/95 rounded-[2.5rem] min-h-full border border-white/5 overflow-visible`.

- Убирает backdrop-blur с корневого контейнера
- Меняет `overflow-hidden` → `overflow-visible` чтобы не обрезать контролы
- Заменяет полупрозрачный glass-bg на почти непрозрачный bg-background

### Шаг 2. Оптимизировать backdrop-blur в InlineEditableBlock
**Файл:** `src/components/editor/InlineEditableBlock.tsx:248`

Убрать `backdrop-blur-xl` с основного wrapper блока (`bg-card/70 backdrop-blur-xl`). Заменить на `bg-card` — непрозрачный фон без blur. Блоки в редакторе не нуждаются в glass-эффекте, это вредит читаемости.

### Шаг 3. Убрать backdrop-blur с hover-оверлея
**Файл:** `src/components/editor/InlineEditableBlock.tsx:264`

Заменить `backdrop-blur-sm` в hover-оверлее на простой полупрозрачный фон без blur.

### Шаг 4. Упростить blur в контролах блоков
Заменить `backdrop-blur-xl` и `backdrop-blur-md` в кнопках управления (drag handle, move controls, delete button) на `bg-card` или `bg-background` — solid backgrounds без blur. Это не только исправляет визуал, но и улучшает производительность (см. stack overflow hint).

### Затронутые файлы
- `src/components/dashboard-v2/layout/DashboardLayout.tsx` — 1 строка
- `src/components/editor/InlineEditableBlock.tsx` — ~5 мест
- `src/components/editor/GridEditor.tsx` — 1 место (drag handle, строка 219)

### Что НЕ трогаем
- EditorScreen header (`glass-nav`) — это sticky nav, ему blur нужен
- BlockInsertButton sheet — модалка, blur уместен
- MobileSettingsSheet — модалка, blur уместен
- CanvasBackground — фоновый слой, не влияет

