

# Полное исправление размытия блоков в редакторе

## Корневая причина (почему предыдущие фиксы не помогли)

Текущий CSS-overrider в `index.css` покрывает только **CSS-классы** `.glass-card`, `.glass`, `.glass-button`, `.glass-strong`. Но 15+ блок-компонентов используют **Tailwind-утилиты напрямую**:

- `shadow-glass`, `shadow-glass-lg`, `shadow-glass-xl` — тяжёлые цветные тени с `hsl(211 100% 50% / 0.12)` и множественными слоями
- `backdrop-blur-md`, `backdrop-blur-xl`, `backdrop-blur-2xl` — применяются **в дополнение** к `.glass-card`, поэтому `[data-editor-block] *` ловит backdrop-filter, но НЕ ловит:
  - `bg-card/60`, `bg-white/5` — полупрозрачные Tailwind-фоны
  - `border-white/10` — полупрозрачные границы
  - `shadow-glass` — Tailwind-утилита через `var(--shadow-glass)`

Итого: backdrop-filter убран, но блоки всё равно выглядят "молочными" из-за полупрозрачных фонов + тяжёлых цветных теней.

## Решение

Расширить CSS-overrider в `src/index.css`, добавив правила для **всех** Tailwind-утилит, используемых блоками:

```css
/* Disable ALL glass effects inside editor blocks */
[data-editor-block] .glass-card,
[data-editor-block] .glass,
[data-editor-block] .glass-button,
[data-editor-block] .glass-strong,
[data-editor-block] .glass-subtle,
[data-editor-block] .glass-input,
[data-editor-block] .glass-nav {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: hsl(var(--card)) !important;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
  border-color: hsl(var(--border)) !important;
}

/* Kill ALL backdrop-filter and glass shadows on any element */
[data-editor-block] * {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  --shadow-glass: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
  --shadow-glass-lg: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
  --shadow-glass-xl: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
}

/* Override semi-transparent Tailwind backgrounds */
[data-editor-block] [class*="bg-card/"],
[data-editor-block] [class*="bg-white/"],
[data-editor-block] [class*="bg-background/"] {
  background: hsl(var(--card)) !important;
}
```

Ключевая идея: переопределяем **CSS-переменные** `--shadow-glass*` внутри `[data-editor-block]`, поэтому все Tailwind-утилиты `shadow-glass`, `shadow-glass-lg` автоматически получают лёгкие тени без цветных оттенков.

##