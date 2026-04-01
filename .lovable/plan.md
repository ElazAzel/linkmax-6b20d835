

# Исправление: размытые блоки, огромные кнопки управления, крупный текст

## Корневая причина размытия

CSS-overrides через `[data-editor-block]` в `index.css` пытаются убить `backdrop-filter` и `filter` через `!important`, но это ненадежно: 20+ блок-компонентов используют Tailwind-классы `backdrop-blur-md`, `blur-lg`, `glass-card` и т.д., которые генерируют стили через CSS-переменные Tailwind (`--tw-backdrop-blur`). На мобильных WebKit-движках `!important` override через CSS-attribute-селекторы (`[class*="blur-"]`) может не срабатывать из-за порядка каскада и `@layer`.

**Надёжное решение**: Вместо CSS-хаков — добавить на обёртку `data-editor-block` непрозрачный фон + `isolation: isolate`. Это делает backdrop-filter бесполезным (нечего размывать через непрозрачный фон), даже если стили технически применены. Плюс, дополнительно переопределить Tailwind blur-переменные напрямую.

## Что делаем

### 1. GridEditor.tsx — обёртка блоков
**Обёртка `data-editor-block`** (строка 237): добавить `isolation-isolate bg-card rounded-2xl overflow-hidden` — непрозрачный фон не даст backdrop-filter ничего размывать.

### 2. GridEditor.tsx — уменьшить кнопки управления
Сейчас: 4 кнопки `h-8 w-8` в ряд → занимают ~140px по ширине, перекрывая блок.

Изменения:
- Кнопки: `h-7 w-7` (с `h-8 w-8`)
- Иконки: `h-3.5 w-3.5` (с `h-4 w-4`)
- Gap: `gap-1` (с `gap-1.5`)
- Позиция: `top-1.5 right-1.5` (с `top-2 right-2`)
- На мобильном: показывать только Edit + Delete по умолчанию, Copy + Flask — по клику

### 3. GridEditor.tsx — уменьшить label блока
Сейчас: `text-xs font-bold uppercase tracking-wider` — слишком крупно и жирно.

Изменения:
- `text-[10px] font-medium` (с `text-xs font-bold`)
- `tracking-wide` (с `tracking-wider`)
- `px-1.5 py-px` (с `px-2 py-0.5`)

### 4. index.css — усилить CSS-override
Добавить к `[data-editor-block]`:
```css
isolation: isolate;
background: hsl(var(--card));
```
Это гарантирует что backdrop-filter не имеет прозрачных слоёв для размытия.

## Затронутые файлы
- `src/components/editor/GridEditor.tsx` — обёртка, кнопки, label (~15 строк)
- `src/index.css` — 2 строки в `[data-editor-block]`

