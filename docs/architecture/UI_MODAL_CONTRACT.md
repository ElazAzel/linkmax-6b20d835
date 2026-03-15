# UI Modal Contract (Dialog / Sheet)

Единый контракт для всех модалок в `src/components/**` и `src/pages/**`.

## Базовые правила

1. **Один визуальный крестик на модалку**.
   - `DialogContent` уже рендерит дефолтный close-контрол.
   - Для `SheetContent` дефолтный close-контрол включен по умолчанию.
   - Если нужен кастомный header-крестик — используем `hideCloseButton` и рисуем **ровно один** свой.

2. **Обязательный controlled-режим**: `open` + `onOpenChange`.
   - Не используем «немые» модалки без обработчика.
   - Все сценарии закрытия должны сходиться в один callback `onOpenChange(false)`.

3. **Единый сценарий закрытия**:
   - клик по overlay,
   - `Esc`,
   - клик по кнопке закрытия.

## Шаблоны

### Dialog (стандарт)

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    {/* контент */}
  </DialogContent>
</Dialog>
```

### Sheet с дефолтным крестиком

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right">
    {/* контент */}
  </SheetContent>
</Sheet>
```

### Sheet с кастомным крестиком

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom" hideCloseButton>
    <Button aria-label="Закрыть" onClick={() => onOpenChange(false)}>
      <X className="h-5 w-5" />
    </Button>
    {/* контент */}
  </SheetContent>
</Sheet>
```

## Примечание по `hideCloseButton`

`hideCloseButton` применяется только когда внутри уже есть собственная кнопка закрытия.
Использовать CSS-хак вида `[&>button]:hidden` запрещено, т.к. он ломает контракт и усложняет тестирование.
