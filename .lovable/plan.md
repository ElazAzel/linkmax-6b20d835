

# Аудит и оптимизация редакторов блоков (Block Editors UX/UI)

## Обнаруженные проблемы

### 1. Непоследовательная архитектура редакторов
Редакторы делятся на 3 «поколения»:
- **Современные** (Button, Text, Link, Image, Video, Socials) — используют `EditorSection`, `EditorField`, `withBlockEditor` HOC, `h-12 rounded-xl` инпуты
- **Промежуточные** (FAQ, Product, Download, Carousel, Countdown, BeforeAfter) — используют `withBlockEditor` или `BlockEditorWrapper` напрямую, но без `EditorSection` — голые `Label` + `Input`, нет визуальной группировки
- **Старые** (Booking) — используют `BlockEditorWrapper` напрямую, `Separator` вместо секций, нестандартные `SelectTrigger` без `h-12 rounded-xl`

### 2. Конкретные проблемы по редакторам

**FAQBlockEditor** — не обёрнут в `withBlockEditor`, нет «Дополнительных настроек» (стиль, анимация, расписание). Карточки используют `Card` с дефолтными стилями вместо `rounded-xl`. AI-кнопки абсолютно позиционированы и могут перекрывать label на маленьких экранах.

**ProductBlockEditor** — голые `Label`+`Input` без `EditorField`. AI-кнопки абсолютно позиционированы. Нет `EditorSection`. `grid-cols-2` для цены/валюты без адаптива (на 320px ширине элементы сжимаются).

**BookingBlockEditor** — самый большой (~520 строк), нет `EditorSection`, все настройки плоским списком. Используется `Separator` вместо коллапсируемых секций. На мобильных неудобно — огромный скролл без навигации по секциям. `SelectTrigger` без `h-12 rounded-xl`.

**DownloadBlockEditor** — `grid-cols-2` для имени файла и размера — на мобильных сжимается. `SelectTrigger` без стандартных стилей.

**CarouselBlockEditor** — нативный `<input type="checkbox">` вместо `Switch` компонента. Нет `EditorSection`. Изображения в `border border-border rounded-lg` вместо `rounded-xl`.

**CountdownBlockEditor** — не обёрнут в `withBlockEditor`, нет доступа к дополнительным настройкам. Нет `EditorSection`.

**BeforeAfterBlockEditor** — не обёрнут в `withBlockEditor`, нет дополнительных настроек.

**CatalogBlockEditor** — своя внутренняя Tab-система, но без `EditorSection`.

### 3. Дублирование кода
`LinkBlockEditor` определяет собственный `AlignmentButton` компонент (строки 33-71), хотя идентичный компонент уже экспортируется из `EditorUtils.tsx`.

### 4. Проблемы мобильного UX в BlockEditorShell
- Header содержит `BlockSizeSelector` + `Delete` + `Preview` + `Back` + Icon + Title — на мобильном 390px это может не помещаться
- Footer кнопки `flex-1` + `flex-[2]` — хорошо, но при `isSaving` кнопка сохранения не показывает текст рядом со спиннером на узких экранах

### 5. Подсказки (hints) только на английском
`withBlockEditor` HOC принимает `hint` строку, но она всегда захардкожена на английском (напр. `'Create an image gallery carousel with auto-play option'`). Нужно либо убрать, либо перевести через i18n.

---

## План оптимизации

### Шаг 1: Стандартизация «отстающих» редакторов
Привести к единому стандарту (EditorSection + EditorField + h-12 rounded-xl):

**ProductBlockEditor:**
- Обернуть поля в `EditorSection` (Content, Appearance)
- Заменить голые `Label` на `EditorField`
- AI-кнопки через `onMagicWand` проп `MultilingualInput` (как в ButtonBlockEditor)
- Стандартизировать `SelectTrigger` → `h-12 rounded-xl`

**DownloadBlockEditor:**
- Добавить `EditorSection` (Content, File)
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` для адаптива
- Стандартизировать `SelectTrigger`

**CarouselBlockEditor:**
- Добавить `EditorSection` (Content, Settings)
- Заменить `<input type="checkbox">` на `Switch`
- Карточки изображений → `rounded-xl`

**CountdownBlockEditor:**
- Обернуть в `withBlockEditor` для доступа к дополнительным настройкам
- Добавить `EditorSection` (Content, Display)

**BeforeAfterBlockEditor:**
- Обернуть в `withBlockEditor`
- Добавить `EditorSection`

**FAQBlockEditor:**
- Обернуть в `withBlockEditor`
- Добавить `EditorSection`
- Исправить AI-кнопки: встроить через `onMagicWand` вместо абсолютного позиционирования

### Шаг 2: BookingBlockEditor — рефакторинг
- Разбить на `EditorSection`: Основное, Рабочие часы, Рабочие дни, Кастомные слоты, Предоплата, Дополнительно
- Каждая секция коллапсируемая с `defaultOpen={false}` (кроме Основного)
- Стандартизировать все `SelectTrigger` → `h-12 rounded-xl`

### Шаг 3: Удалить дубликат AlignmentButton
В `LinkBlockEditor.tsx` удалить локальное определение `AlignmentButton` (строки 33-71), использовать импорт из `EditorUtils`.

### Шаг 4: Перевести hints на i18n
Заменить английские строки `hint` в `withBlockEditor` вызовах на ключи i18n. Добавить соответствующие ключи в `ru.json` и `en.json`.

### Шаг 5: Оптимизация мобильного BlockEditorShell header
- `BlockSizeSelector` на мобильном скрывать и показывать в footer или в отдельной строке под заголовком
- Уменьшить кнопки в header до `h-8 w-8` на мобильном

---

## Затронутые файлы
- `src/components/block-editors/ProductBlockEditor.tsx`
- `src/components/block-editors/DownloadBlockEditor.tsx`
- `src/components/block-editors/CarouselBlockEditor.tsx`
- `src/components/block-editors/CountdownBlockEditor.tsx`
- `src/components/block-editors/BeforeAfterBlockEditor.tsx`
- `src/components/block-editors/FAQBlockEditor.tsx`
- `src/components/block-editors/BookingBlockEditor.tsx`
- `src/components/block-editors/LinkBlockEditor.tsx`
- `src/components/block-editors/BlockEditorShell.tsx`
- `src/i18n/locales/ru.json`
- `src/i18n/locales/en.json`

## Что НЕ трогаем
- `BlockEditorWrapper.tsx` (HOC и advanced settings) — работает корректно
- `EditorSection.tsx`, `EditorUtils.tsx` — уже качественные
- `BlockEditorV2.tsx` — контейнер, работает стабильно
- Редакторы, которые уже в стандарте (Button, Text, Link*, Image, Video, Socials, Messenger, CustomCode)

