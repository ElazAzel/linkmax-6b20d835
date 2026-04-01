

# Исправление размытия блоков в редакторе

## Корневая причина

Блоки рендерятся через `BlockRenderer` внутри `GridEditor`. Каждый блок-компонент (MessengerBlock, ImageBlock, CarouselBlock, TestimonialBlock и др.) использует CSS-классы `glass-card`, `backdrop-blur-md`, `shadow-glass` — это дизайн для публичной страницы. Но в редакторе эти blur-эффекты накладываются друг на друга и делают контент мутным.

Затронуты **~15 блоков** с glass/blur стилями. Менять каждый блок — рискованно и долго.

## Решение

Добавить CSS-правило, которое **отключает backdrop-blur внутри редактора** на уровне CSS, не трогая код блоков. Блоки в редакторе рендерятся внутри div с классом `pointer-events-none` в GridEditor. Нужно:

### Шаг 1. Добавить data-атрибут на контейнер блоков в GridEditor
В `src/components/editor/GridEditor.tsx` строка 237, на div-обёртку `BlockRenderer` добавить `data-editor-block`:
```tsx
<div className="pointer-events-none w-full h-full" data-editor-block>
```

### Шаг 2. Добавить CSS-правило в `src/index.css`
```css
/* Disable backdrop-blur inside editor blocks for visual clarity */
[data-editor-block] *,
[data-editor-block] .glass-card,
[data-editor-block] .glass,
[data-editor-block] .glass-button {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

Это отключит blur для всех элементов внутри редакторных блоков, сохраняя glass-стили на публичной странице.

### Шаг 3. То же для DragOverlay
В `GridEditor.tsx` строка 378, на контейнер DragOverlay тоже добавить `data-editor-block`.

### Затронутые файлы
- `src/components/editor/GridEditor.tsx` — 2 строки (добавить data-атрибут)
- `src/index.css` — 6 строк CSS

### Что НЕ трогаем
- Код блоков (MessengerBlock, ImageBlock и т.д.) — не меняем
- Публичная страница — blur работает как раньше
- Модалки/шиты — blur уместен

## Также: build errors
В проекте есть TS-ошибки в edge functions и компонентах. Они **не связаны** с blur-багом, но их тоже надо исправить отдельно.

