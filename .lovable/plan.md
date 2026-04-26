## Проблема

Когда пользователь добавляет блок в редакторе, он получает «голый» дефолт: «Click Me», «New Link», «Enter your text here», https://example.com, заглушки Unsplash. Блок появляется резко, без анимации и без объяснения «что делать дальше». Это не выглядит «красиво» и сбивает UX.

Сейчас красивая шторка добавления (`BlockInsertButton`) уже сделана хорошо. Боль — это **момент после нажатия**: визуальная вставка блока на холст и его пустой стартовый вид.

## Цель

Сделать момент создания блока приятным, понятным и эстетичным, **ничего не сломав**:
- Стартовые значения должны выглядеть как готовый кусок страницы, а не как форма «Lorem ipsum».
- Блок должен **плавно появляться** на холсте с фокусом и подсказкой «нажми, чтобы редактировать».
- Если поле обязательное (например URL у Link) — должно быть визуальное приглашение, а не строка-подделка `https://example.com`.
- Сохранить всю существующую логику: типы блоков, manifest, аналитика, premium-гейтинг, история, undo/redo.

## Что меняем

### 1. Новые «эстетичные» дефолты для блоков (`src/lib/blocks/block-factory.ts`)

Заменяем «голые» строки и фейковые URL на дружелюбные плейсхолдеры через i18n-ключи (с фоллбэками RU/EN), и убираем фейковые `https://example.com`, чтобы вместо них было пусто (поле подсветится в редакторе и в превью покажется приглашение).

Точечные правки:
- `link`: `title` → «Новая ссылка», `url` → `''` (вместо `https://example.com`), `icon` → `globe` (как сейчас).
- `button`: `title` → «Нажми меня», `url` → `''`. Дефолтный градиент уже норм.
- `text`: `content` → «Напишите что-нибудь интересное…» (placeholder-стиль), `style` → `paragraph`.
- `image`: оставляем красивую дефолтную картинку Unsplash (это ок) + alt из i18n.
- `socials`: вместо двух «фейковых» соцсетей с урлами `https://instagram.com` — массив с одним элементом без url (`{ icon: 'instagram', url: '' }`), чтобы пользователь сразу заполнил.
- `messenger`: то же — один пустой messenger c `platform: 'whatsapp', username: ''`.
- `product`, `catalog`, `pricing`: оставляем демо-данные (это правда помогает понять блок), но с более нейтральными названиями («Пример товара» вместо «New Product»).
- `video`: убираем мем-ссылку Rick Roll, ставим `url: ''` + красивый плейсхолдер-постер.
- `download`: `fileUrl: ''` (как сейчас) — оставляем.
- `form`, `faq`, `testimonial`, `booking`, `event`, `community`, `pricing` — уже имеют осмысленные демо-данные, оставляем.
- `scratch`, `countdown`, `before_after`, `map`, `avatar`, `separator`, `custom_code` — мелкие косметические правки текстов.

Все строки прогоняем через i18n-ключи `blocks.defaults.*` с RU/EN/KK, чтобы дефолты были на языке интерфейса.

### 2. Анимация появления блока на холсте

В `src/components/editor/InlineEditableBlock.tsx`:
- При маунте нового блока (по флагу `isNewlyAdded`, который мы прокинем из `useBlockEditor` через context/state) применяем класс `animate-block-create`: scale 0.96 → 1.0, opacity 0 → 1, лёгкий glow-ring (`ring-2 ring-primary/40`) на 1.2с, затем плавно затухает.
- Добавляем soft-haptic на мобиле (он уже есть в проекте — `useHapticFeedback().lightTap()`).
- Автоскролл к новому блоку с `behavior: 'smooth', block: 'center'` через `requestAnimationFrame` после маунта.

В `tailwind.config.ts` (или в `index.css` через `@layer utilities`) добавляем кейфрейм `block-create` (scale + opacity + ring-fade). Опираемся на существующие animation-утилиты, упомянутые в memory.

### 3. «Empty hint» внутри блока в режиме редактирования

Когда блок создан, но обязательные поля пустые (например `url` у `link`/`button`, `username` у `messenger`), показываем внутри блока ненавязчивый прозрачный оверлей-подсказку «Нажмите ✏️ чтобы добавить ссылку». Используем существующую логику в `InlineEditableBlock` (overlay уже есть для hover/touch).

Реализация: маленький helper `getBlockEmptyHint(block)` в `src/lib/blocks/block-utils.ts`, возвращает `{ isEmpty: boolean, hintKey: string }`. Если `isEmpty`, в `InlineEditableBlock` поверх контента показываем чип «Заполните → ✏️».

### 4. Открытие редактора блока сразу после вставки (опционально, smart-defaults)

Для блоков, где без заполнения смысла нет (`link`, `button`, `messenger`, `video`, `download`, `map`, `community`, `custom_code`), после `addBlock` сразу открываем `BlockEditorWrapper` (Sheet). Для блоков с готовым демо (`text`, `image`, `socials`, `faq`, `testimonial`, `pricing`, `product`, `catalog`, `event`, `booking`, `separator`, `countdown`, `scratch`, `before_after`, `avatar`) — НЕ открываем, чтобы пользователь сначала увидел результат.

Управляется белым списком `AUTO_OPEN_EDITOR_TYPES` в `useBlockEditor.tsx`, прокидывается в `onBlockHint` callback (он уже существует, см. строка 96).

### 5. Hint-toast вместо короткого «Block added»

Сейчас после вставки показывается `toast.success('Block added')`. Заменяем на более полезный:
- Если блок открылся в редакторе → toast НЕ показываем (редактор уже фидбек).
- Если блок просто добавлен на холст → toast «Блок добавлен — потяните вверх чтобы перетащить, нажмите ✏️ чтобы редактировать», 3.5с, без перекрытия с автоскроллом.

### 6. Качество сетки/выравнивания (минимальные правки рендера)

В `src/components/blocks/LinkBlock.tsx`, `ButtonBlock.tsx`, `SocialsBlock.tsx`:
- Убираем дублирование `border-white/10` когда есть кастомный `blockStyle` (мелкая регрессия — сейчас на тёмной теме иногда видна паразитная рамка).
- Унифицируем `min-h-[56px]` → `min-h-12` (Tailwind токен), консистентно с design system.
- Для пустых дефолтных Link/Button (без url) делаем приглушённый стиль (opacity 0.85 + dashed-ring), чтобы визуально читалось «черновик».

## Что НЕ трогаем (страховка от регрессий)

- `BlockInsertButton.tsx` — шторка уже хорошая, только убедимся, что новые дефолты не ломают `recommendedBlocks`.
- `block-manifest.ts`, типы блоков (`src/types/page.ts`) — не меняем сигнатуры.
- `internal-builder.ts`, `useDashboardAI.ts`, `AdminTemplateEditor.tsx` — продолжают вызывать `createBlock(type)` с теми же сигнатурами; новые дефолты их не сломают.
- Тесты `src/lib/blocks/__tests__/block-factory.test.ts` — обновим ожидания только там, где явно проверяется конкретное значение (например `createBlock('link').url === 'https://example.com'`).
- Premium-гейтинг, аналитика, история, undo/redo — без изменений.

## Технические детали

**Файлы, которые поменяем:**
1. `src/lib/blocks/block-factory.ts` — новые дефолты + i18n-helper-фоллбэки.
2. `src/lib/blocks/block-utils.ts` — `getBlockEmptyHint()`, маленькая утилита.
3. `src/hooks/editor/useBlockEditor.tsx` — флаг `isNewlyAdded`, белый список авто-открытия редактора, обновлённые toast-ы.
4. `src/components/editor/InlineEditableBlock.tsx` — appear-анимация, autoScroll, empty-hint chip.
5. `src/components/blocks/LinkBlock.tsx`, `ButtonBlock.tsx` — приглушённый «draft» стиль для пустого URL.
6. `src/index.css` — keyframe `block-create` + utility-класс `animate-block-create`.
7. `src/i18n/locales/{ru,en,kk}.json` — ключи `blocks.defaults.*`, `blocks.hints.*`.
8. `src/lib/blocks/__tests__/block-factory.test.ts` — обновить assertions под новые дефолты.

**Безопасность изменений:**
- `createBlock()` остаётся синхронным, тот же тип возвращаемого значения.
- Все новые поля — необязательные (placeholder-строки в i18n с фоллбэком).
- Анимация работает через CSS-класс на одном внешнем `<div>` — не задевает DnD-логику.
- Эмпти-хинт — оверлей `position:absolute pointer-events-none` поверх блока в режиме hover/edit.

## Результат

После добавления любого блока:
1. Блок плавно «вырастает» на холсте с лёгким glow-кольцом.
2. Камера сама подъезжает к нему.
3. Если блок «пустой по сути» (Link/Button/Messenger/Video/Map/Code/Download) — мгновенно открывается удобный редактор.
4. Если блок «самодостаточный» (Text/Image/FAQ/Pricing/…) — пользователь сразу видит красивый готовый результат с чипом «✏️ Редактировать».
5. Никаких больше «https://example.com» и «New Link».
