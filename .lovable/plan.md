

# План Недели 4: Мобильный UX — Оптимизация для работы одной рукой

## Текущее состояние

По результатам аудита кода выявлены следующие проблемы с мобильным UX:

**Проблемы с размером текста:**
- 434 использования `text-[10px]` и `text-[11px]` в 21 файле zone-компонентов
- Такой мелкий текст трудно читать на мобильных устройствах

**Что уже хорошо:**
- Kanban-доски имеют touch sensors с delay
- Основные экраны используют flex-wrap для адаптивности
- Есть responsive breakpoints (sm:, md:)

---

## План реализации

### Task 1: Увеличить минимальный размер текста

**Файлы:** 21 файл в `src/components/zones/`

- Заменить `text-[10px]` → `text-xs` (12px)
- Заменить `text-[11px]` → `text-xs` (12px)
- Приоритет: DealDetailSheet, ContactDetailSheet, TaskDetailSheet, ZoneDashboard

### Task 2: Увеличить touch targets до 44px

**Области изменений:**
- Tab triggers в деталях сделок/контактов: добавить `min-h-11` 
- Кнопки действий в карточках: убедиться что все `size="icon"` имеют `h-11 w-11` на mobile
- Badge-фильтры: увеличить padding

### Task 3: Добавить Error Boundaries

**Создать:** `src/components/zones/ZoneErrorBoundary.tsx`

- Обёртка для каждого zone-экрана
- Показ понятного сообщения при ошибке
- Кнопка "Попробовать снова"

### Task 4: Улучшить Empty States и Loading Skeletons

**Файлы:** ZoneDealsScreen, ZoneContactsScreen, ZoneTasksScreen

- Консистентный стиль empty states
- Информативные сообщения с призывом к действию
- Skeleton-анимации для длинных списков

### Task 5: Responsive QA

**Экраны для проверки:**
- ZoneDashboard — карточки в 1 колонку на mobile
- ZoneDealsScreen — горизонтальный скролл для kanban
- ZoneInvoicesScreen — таблица → карточки на mobile

---

## Технический подход

**Размер текста (Task 1):**
```tsx
// До:
<span className="text-[10px]">Label</span>

// После:
<span className="text-xs">Label</span>
```

**Touch targets (Task 2):**
```tsx
// До:
<TabsTrigger className="text-[10px]">Tab</TabsTrigger>

// После:
<TabsTrigger className="text-xs min-h-11 min-w-11">Tab</TabsTrigger>
```

**Error Boundary (Task 3):**
```tsx
export function ZoneErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundary fallback={fallback || <ZoneErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}
```

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/components/zones/ZoneDashboard.tsx` | Текст + touch targets |
| `src/components/zones/deals/DealDetailSheet.tsx` | Tabs + текст |
| `src/components/zones/contacts/ContactDetailSheet.tsx` | Tabs + текст |
| `src/components/zones/tasks/TaskDetailSheet.tsx` | Текст |
| `src/components/zones/ZoneDealsScreen.tsx` | Empty state |
| `src/components/zones/ZoneContactsScreen.tsx` | Empty state |
| `src/components/zones/ZoneTasksScreen.tsx` | Empty state |
| `src/components/zones/ZoneErrorBoundary.tsx` | **Создать** |
| `.lovable/plan.md` | Обновить статус |

---

## Ожидаемый результат

- Минимальный размер текста 12px во всех zone-экранах
- Touch targets минимум 44x44px для интерактивных элементов
- Error boundaries с понятными сообщениями
- Консистентные empty states с призывом к действию

