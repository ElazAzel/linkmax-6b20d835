

# Полный UX/UI аудит редактора страницы и блоков

## Обнаруженные проблемы

---

### КРИТИЧНЫЕ (нерабочий функционал)

#### 1. `prompt()` для создания секции — блокирует UI
**Файл:** `GridEditor.tsx:613`
`const label = prompt(...)` — нативный `prompt()` блокирует поток, выглядит чужеродно, не работает в некоторых мобильных браузерах. Нужно заменить на модальный диалог.

#### 2. `window.confirm()` для удаления блока из редактора
**Файл:** `BlockEditorV2.tsx:243`
`window.confirm(...)` — аналогично, нативный диалог. Нужен кастомный AlertDialog.

#### 3. FormBlock: ref warning в консоли
**Консоль:** `Function components cannot be given refs` в `TurnstileWidget` внутри `FormBlock`. Компонент не обёрнут в `forwardRef`. Это React warning, но может привести к потере функциональности Turnstile captcha.

#### 4. Hardcoded русские строки в swipe-подсказках
**Файл:** `InlineEditableBlock.tsx:211,239,378`
- `"Удалить"`, `"Изменить"`, `"Свайп для действий"` — захардкожены, не используют `t()`. Для не-русскоязычных пользователей — непонятно.

#### 5. Двойные контролы на блоках в GridEditor
**GridEditor:** каждый `SortableGridBlockItem` имеет: drag handle (top-left), edit/duplicate/delete кнопки (top-right), type label (bottom-left), context toolbar (top-center при выделении), inline text editor (overlay). На мобильном ВСЕ видны одновременно (`opacity-100`) — перегрузка интерфейса и перекрытие контента.

---

### ВЫСОКИЙ ПРИОРИТЕТ (UX-проблемы)

#### 6. BulkActionBar: кнопки слишком мелкие на мобильном
**Файл:** `BulkActionBar.tsx:48`
Кнопки `h-8 w-8` (32px) — меньше рекомендованного минимума 44px для touch targets. Backdrop-blur всё ещё есть (`backdrop-blur-xl`).

#### 7. BlockContextToolbar: `-top-10` обрезается
**Файл:** `BlockContextToolbar.tsx:57`
Тулбар позиционируется `-top-10` от блока. Для блоков в верхней части экрана он уходит за viewport. Нет проверки положения.

#### 8. EditorScreen: review mode кнопки используют `glass` и `shadow-glass-sm`
**Файл:** `EditorScreen.tsx:448-449, 459-461`
Кнопки "Проблемные" и "CTA" всё ещё используют `glass` класс в неактивном состоянии. Это осталось после предыдущего фикса — `glass` добавляет backdrop-blur.

#### 9. MobileSettingsSheet: избыточный blur на каждом элементе
**Файл:** `MobileSettingsSheet.tsx:208-238`
Sheet, header, tabs, каждый tab trigger, карточки внутри — все с `backdrop-blur-xl` или `backdrop-blur-2xl`. 7+ слоёв blur на одном экране.

#### 10. InlineEditableBlock: `shadow-glass` на блоках
**Файл:** `InlineEditableBlock.tsx:248`
Основной wrapper блока использует `shadow-glass` — кастомный класс, который может включать blur-related стили. Нужно заменить на `shadow-sm`.

---

### СРЕДНИЙ ПРИОРИТЕТ (улучшения)

#### 11. EditorCommandPalette: GROUP_LABELS на английском
**Файл:** `EditorCommandPalette.tsx:29-35`
`'Actions'`, `'Edit Block'`, `'Add Block'` и т.д. захардкожены на EN. Нужно обернуть в `t()`.

#### 12. BlockInsertButton Sheet: `backdrop-blur` в sticky header
**Файл:** `BlockInsertButton.tsx:436`
Header панели добавления блоков имеет `backdrop-blur` — допустимо для sticky, но `bg-background/95` + `supports-[backdrop-filter]:bg-background/80` создаёт мерцание при скролле на слабых устройствах.

#### 13. DragOverlay: `overflow-hidden` обрезает контент
**Файл:** `GridEditor.tsx:362**
`DragOverlayBlockItem` использует `overflow-hidden` — может обрезать содержимое при перетаскивании крупных блоков.

#### 14. EditorScreen header: нет кнопки "назад" на мобильном
Пользователь на мобильном в редакторе не имеет явного способа вернуться к спис