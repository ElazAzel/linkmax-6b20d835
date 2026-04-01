
План: перестать лечить это ещё одним CSS-хаком и исправить источник проблемы. Аудит показал, что размытие в редакторе сейчас приходит не из одного места, а из нескольких слоёв сразу.

1. Что реально ломает чёткость
- `GridEditor` применяет anti-blur только к обычным блокам через `data-editor-block`, но `profile` рендерится отдельно через `InlineProfileEditor` и вообще не попадает под этот контур.
- `BlockRenderer` знает только `isPreview`, но не знает, что это именно режим редактора в дашборде. Поэтому блоки продолжают рендерить public/premium glass-стили внутри editor.
- `PaidBlockWrapper` умеет специально блюрить locked-контент. В редакторе owner/page context не проброшен как отдельный режим, поэтому paid-блоки могут оставаться намеренно размытыми.
- В `src/lib/blocks/block-styling.ts` `backgroundOpacity` применяется как `style.opacity` ко всему элементу, то есть делает мутным весь блок, включая текст и изображения.
- Общие примитивы (`Card`, `Button`) и часть блоков (`Text`, `Link`, `Product`, `Image`, `Video`, `FAQ`, `Socials`, `Pricing`, `Newsletter`, `Map`, `Testimonial`) всё ещё задают blur/glass на уровне самих компонентов. Текущий override в `index.css` лишь частично это маскирует.

2. Что нужно перестроить
- Ввести явный контекст рендера: не просто `isPreview`, а `renderContext: 'editor' | 'public-preview' | 'live'`.
- Пробросить его по цепочке: `EditorScreen -> GridEditor -> BlockRenderer -> конкретные блоки / PaidBlockWrapper / InlineProfileEditor`.
- В режиме `editor` отключать blur, glass, animated gradients и прочие “витринные” эффекты на уровне источника, а не давить их глобальным CSS.

3. Точечные исправления
- `src/components/dashboard-v2/screens/EditorScreen.tsx`
  - передать в `GridEditor` owner/page context и `renderContext="editor"`.
- `src/components/editor/GridEditor.tsx`
  - пробросить `renderContext` в `BlockRenderer`;
  - profile-блок тоже перевести в crisp editor mode, а не оставлять вне anti-blur-системы.
- `src/components/editor/BlockRenderer.tsx`
  - добавить editor-specific context/props.
- `src/components/blocks/PaidBlockWrapper.tsx`
  - в editor-mode всегда показывать контент владельцу без blur/lock overlay.
- `src/lib/blocks/block-styling.ts`
  - убрать `style.opacity = backgroundOpacity`;
  - opacity применять только к фону, а не ко всему содержимому блока.
- `src/components/blocks/InlineProfileEditor.tsx` и/или `ProfileBlock.tsx`
  - убрать в editor-mode backdrop-blur, gradient text, glow/frame effects, полупрозрачные chips;
  - где нужен контраст текста поверх cover-image, использовать непрозрачный chip или `text-shadow`, а не blur.
- `src/components/ui/card.tsx` и при необходимости `src/components/ui/button.tsx`
  - добавить editor/crisp variant без `backdrop-blur`.
- пройтись по блокам с прямыми glass/backdrop классами и дать им editor fallback.

4. Что НЕ делать дальше
- Не добавлять новые широкие `!important`-правила в `index.css` как основной способ фикса.
- Не пытаться чинить это только через `[data-editor-block]`, потому что часть проблем вообще обходит этот слой.

5. Проверка результата
- В editor чётко видны: profile, text, image/video, link/button, product, paid blocks.
- Блоки с кастомным стилем и background opacity остаются читаемыми.
- На mobile и desktop нет frosted/glass-эффекта на содержимом блока.
- Контраст текста на изображениях решён через opaque label/text-shadow, а не через blur.

Файлы, которые почти точно затронем:
- `src/components/dashboard-v2/screens/EditorScreen.tsx`
- `src/components/editor/GridEditor.tsx`
- `src/components/editor/BlockRenderer.tsx`
- `src/components/blocks/PaidBlockWrapper.tsx`
- `src/components/blocks/InlineProfileEditor.tsx`
- `src/components/blocks/ProfileBlock.tsx`
- `src/lib/blocks/block-styling.ts`
- `src/components/ui/card.tsx`
- несколько block renderers с прямыми glass/backdrop стилями

Итог: прошлые правки били по симптомам. Правильный фикс — разделить public visual style и editor-preview style на уровне рендера, а не пытаться “убить blur сверху”.
