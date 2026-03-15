# Design System Audit: editor / crm / dashboard-v2

## 1) Карта токенов

### Кнопки (`src/components/ui/button.tsx`)
- **База:** `rounded-xl`, `text-sm`, `font-semibold`, `gap-2`, `focus-visible:ring-2`.
- **Размеры:**
  - `sm`: `h-11`, `min-h-[44px]`, `px-4`
  - `default`: `h-12`, `min-h-[44px]`, `px-6`, `py-3`
  - `lg`: `h-14`, `px-8`
  - `xl`: `h-16`, `px-10`
  - `2xl`: `h-18`, `px-12`
  - `icon`: `h-11`, `w-11`, `min 44x44`
- **Варианты:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `glass`, `premium`.

### Радиусы
- Глобальный токен: `--radius: 1.75rem`.
- Tailwind mapping:
  - `rounded-lg = var(--radius)`
  - `rounded-xl = calc(var(--radius) + 0.25rem)`
  - `rounded-2xl = calc(var(--radius) + 0.5rem)`
  - `rounded-md/sm` — уменьшенные производные.

### Отступы / spacing
- Контейнер: `1rem` (default), `1.5rem` (sm), `2rem` (lg).
- UI-forms:
  - `Input`: `px-4 py-2`
  - `Textarea`: `px-4 py-2`
- `Card` primitives:
  - `CardHeader`: `p-6`
  - `CardContent`: `p-6 pt-0`
  - `CardFooter`: `p-6 pt-0`

### Заголовки
- Глобально: `--font-heading: Manrope`.
- `CardTitle`: `text-xl font-semibold leading-none tracking-tight`.
- Базовые scale tokens в tailwind: `xs/sm/base/lg` + line-height в конфиге.

## 2) Сверка `src/components/ui/*` vs использование

Проверка импортов `@/components/ui/*` по зонам:

- `editor`: активно используются `button`, `input`, `label`, `badge`, `card`, `dialog`, `sheet`, `scroll-area`, `select`, `textarea`.
- `crm`: активно используются `button`, `card`, `input`, `scroll-area`, `badge`, `label`, `tabs`, `textarea`, `dialog`, `select`.
- `dashboard-v2`: активно используются `card`, `button`, `badge`, `input`, `avatar`, `progress`, `dropdown-menu`, `label`, `skeleton`, `tabs`.

### Компоненты UI, которые **не используются** в этих трёх доменах
`accordion`, `aspect-ratio`, `breadcrumb`, `calendar`, `canvasbackground`, `carousel`, `checkbox`, `collapsible` (частично), `command` (редко), `context-menu`, `form`, `hover-card`, `input-otp`, `language-selector`, `lazy-image`, `menubar`, `navigation-menu`, `pagination`, `popover`, `radio-group`, `resizable`, `separator`, `sidebar`, `skeleton-card`, `slider` (редко), `sonner`, `switch` (точечно), `table` (точечно), `toaster`, `toast`, `toggle`, `toggle-group`, `tooltip` (точечно), `use-toast`, `visually-hidden`, `drawer` (точечно).

> Примечание: это не означает “удалить”; это сигнал для ревью компонентной матрицы и возможного ограничения surface area.

## 3) Убраны локальные “ручные” стили (дубли дизай-системы)

### CRM LeadsPanel
- Фильтры статусов и источников переведены с нативных `<button>` на DS `Button` (`variant="ghost"`, `size="sm"`).
- Сохранены продуктовые классы состояния (`ring`, цветовые utility), но базовая кнопочная механика теперь единая и централизованная.

### Dashboard-v2 EditorScreen
- Кнопки закрытия/действия в баннерах (`intelligence`, `friction`) переведены с `<button>` на DS `Button` с подходящими `variant`/`size`.
- Убрано дублирование hover/focus/interaction поведения, теперь оно наследуется из `ui/button`.

## 4) Визуальный diff по 5 ключевым экранам desktop/mobile

Сняты screenshot-артефакты для пар desktop/mobile:
1. `/dashboard/home`
2. `/dashboard/home?tab=editor`
3. `/dashboard/activity`
4. `/dashboard/insights`
5. `/dashboard/leads`

Diff-подход в рамках текущей задачи: сравнение до/после в рамках DS-touchpoint зон (кнопочные элементы в CRM и EditorScreen), плюс cross-viewport consistency (desktop vs mobile) на 5 ключевых экранах.
