

# Исправление размытия блоков + Перестройка дашборда вокруг Редактора

## Часть 1: Полное устранение размытия в редакторе

### Проблема
Текущий CSS-overrider `[data-editor-block] * { backdrop-filter: none !important }` убирает только `backdrop-filter`, но **не убирает**:
- Полупрозрачные фоны (`background: hsl(var(--glass-bg))` = 65% opacity) — создают "молочный" эффект поверх контента блоков
- `shadow-glass` — тяжёлые тени с цветовыми оттенками
- `border-white/10` — едва видимые границы, сливающиеся с blur

### Решение
Расширить CSS-overrider в `src/index.css`, чтобы внутри `[data-editor-block]` все glass-классы получали **непрозрачные** фоны:

```css
[data-editor-block] .glass-card,
[data-editor-block] .glass,
[data-editor-block] .glass-button,
[data-editor-block] .glass-strong {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: hsl(var(--card)) !important;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
}

[data-editor-block] * {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

Это сделает все блоки внутри редактора визуально чёткими, с непрозрачным `bg-card` фоном вместо стеклянного.

### Файл: `src/index.css` — ~10 строк изменений

---

## Часть 2: Перестройка дашборда — Editor-first CJM

### Текущая проблема
Навигация ставит "Главная" (HomeScreen) как точку входа, а Редактор — как одну из 5 вкладок. При этом HomeScreen перегружен виджетами (MetricsGrid, ConversionFunnel, OperatorSummary, WalletOverview, SearchReadiness), которые отвлекают от основной задачи — редактирования страницы.

Сайдбар (desktop) разбит на 4 секции с 20+ пунктов, из которых 13 — зоновые. Мобильный bottom nav показывает 4 табы + "Ещё" (16 пунктов в шите).

### Целевая архитектура: Editor-centric

Мобильный bottom nav (5 табов):
```text
┌─────────┬──────────┬──────────┬──────────┬──────┐
│ Редактор │ Входящие │ Аналитика│ Настройки│ Ещё  │
└─────────┴──────────┴──────────┴──────────┴──────┘
```

- **Редактор** — дефолтный таб при входе (вместо Home)
- **Входящие** — лиды + activity (объединённый inbox)
- **Аналитика** — insights
- **Настройки** — settings
- **Ещё** — бизнес-зоны, страницы, финансы, события, команда

Desktop sidebar:
```text
Основное:
  • Редактор (дефолт)
  • Входящие
  • Аналитика
  
Страницы:
  • Мои страницы
  • Шаблоны

Бизнес-инструменты:  (collapsed by default)
  • Сделки / Контакты / Задачи / ...

Аккаунт:
  • Финансы / Настройки / Выход
```

### Изменения

#### Файл 1: `src/components/dashboard-v2/layout/DashboardBottomNav.tsx`
- Поменять TABS: Editor первый, убрать Home из основных табов
- Перенести Home в MORE_ITEMS
- Сократить MORE_ITEMS — сгруппировать зоновые экраны

#### Файл 2: `src/components/dashboard-v2/layout/DashboardSidebar.tsx`
- Редактор первым пунктом в MAIN_ITEMS
- Home убрать или сделать вторичным
- Бизнес-зона collapsed по дефолту

#### Файл 3: `src/pages/DashboardV2.tsx`
- Дефолтный таб: `'editor'` вместо `'home'` (строка 187)
- HomeScreen оставить доступным, но не как точку входа

### Затронутые файлы
- `src/index.css` — расширить CSS override для editor blocks
- `src/components/dashboard-v2/layout/DashboardBottomNav.tsx` — переставить табы
- `src/components/dashboard-v2/layout/DashboardSidebar.tsx` — editor-first в сайдбаре
- `src/pages/DashboardV2.tsx` — дефолтный таб = editor

### Что НЕ трогаем
- Код блоков (BlockRenderer, block components) — не меняем
- Публичная страница — glass-стили работают как раньше
- HomeScreen — остаётся, но доступен через "Ещё"
- Зоновые экраны — без изменений, только навигация к ним

