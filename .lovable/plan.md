## Цель

Дать пользователю значительно больше и качественнее опций визуальной кастомизации публичной страницы и профиля, оставаясь в текущем визуальном языке LinkMAX (Warm Paper). База доступна всем, «wow»-эффекты и анимации — под Premium.

## Что появится

### 1. Профиль (шапка, аватар, имя, фон)
- **Аватар**: 6 форм (circle, squircle, rounded, hexagon, blob, sticker), 8 стилей рамок (none, minimal, gradient, glow, dashed, ticket, gold-frame, neon), опция «status ring» (онлайн/offline/verified).
- **Имя**: расширенный `NameAnimationSelector` — новые анимации (shine, wave, glitch, ticker, typewriter, rainbow-slow, underline-draw). База: none/bold/gradient.
- **Шапка (cover)**: высоты small/medium/large/xl, 12 готовых градиентов + 6 паттернов (dots, grid, waves, noise, topo, mesh), режимы image/video/gradient/pattern, overlay-tint 0–80%, parallax on scroll (Premium).
- **Био**: подсветка ссылок, иконки соцсетей рядом с именем, badge-строка (город/статус/эмодзи).

### 2. Обложка/фон страницы
- Единый выбор фона: solid | gradient (12 пресетов + кастом) | pattern (6) | image (upload) | video-loop (Premium) | animated-mesh (Premium).
- Blur / noise / vignette слайдеры, opacity, режим наложения.
- Fixed / scroll / parallax поведение.

### 3. Стиль блоков (кнопки/карточки)
Новый глобальный `blockStyle` пресет + тонкая настройка:
- **Форма**: sharp / soft / rounded / pill / ticket / squircle.
- **Заливка**: solid / outline / ghost / glass / gradient / neo-brutalism / soft-shadow.
- **Тени**: none / sm / md / lg / glow / inner.
- **Границы**: none / thin / medium / thick + цвет из палитры.
- **Hover**: none / lift / scale / glow / underline / swap.
- **Иконки**: показывать/скрывать, стиль (line / duotone / filled).
- **Разделители** между блоками: none / hairline / dotted / gradient / ornament.

### 4. Темы и типографика
- **10 готовых тем страницы** (Warm Paper, Midnight, Editorial Mono, Sunset, Ocean, Forest, Blush, Noir & Gold, Neon Mint, Terracotta). Каждая тема = набор токенов (bg, surface, text, accent, radius, shadow).
- **8 шрифтовых пар** (Manrope+Inter — база; Space Grotesk+DM Sans; Instrument Serif+Work Sans; DM Serif+Fira Sans; Syne+Jakarta; Bebas+Barlow; Cormorant+Karla; JetBrains Mono+Work Sans).
- **Custom accent**: color picker + автоподбор контраста для текста.
- **Dark mode toggle** на публичной странице (auto/light/dark).

### 5. Premium-гейт
- Бесплатно: базовые формы аватара, 4 темы, 3 шрифтовые пары, solid/gradient фон, базовые формы блоков, простые hover.
- Premium: все анимации имени, video/animated-mesh фон, parallax, glass/neon/gold-frame, все 10 тем, все 8 шрифтовых пар, custom accent color, dark-mode toggle.
- Заблокированные опции показываются с иконкой замка и ведут на `/pricing`.

## Технические детали

**Схема данных** (`pages.appearance` JSONB, миграция):
```
{
  theme: string,
  fontPair: string,
  accentColor: string | null,
  darkMode: 'auto'|'light'|'dark',
  background: { kind, value, overlay, blur, noise, behavior },
  profile: { avatarShape, avatarFrame, statusRing, nameAnimation, coverHeight, coverKind, coverValue, coverOverlay, parallax },
  blocks: { shape, fill, shadow, border, borderColor, hover, iconStyle, divider }
}
```
Обратная совместимость: пустые поля → текущие дефолты. RLS не меняем (поле внутри существующей `pages`).

**Код**:
- `src/lib/appearance/presets.ts` — все пресеты (themes, fontPairs, gradients, patterns, blockStyles, avatarFrames, nameAnimations).
- `src/lib/appearance/tokens.ts` — рантайм-конвертер `appearance → CSS vars` (inline `<style>` в public page + editor preview).
- `src/hooks/appearance/useAppearance.ts` — чтение/запись + Premium-гейт.
- Editor: новая вкладка **«Дизайн»** с 4 секциями (Theme, Profile, Background, Blocks). Каждая секция — визуальный picker (свотчи/превью), не форма.
- Public page: применение через CSS-переменные, шрифты подгружаются через существующий font-loader.
- `NameAnimationSelector`, `AvatarFrameSelector`, `CoverEditor` — расширяем существующие; `BlockStyleSelector`, `ThemePicker`, `FontPairPicker`, `BackgroundPicker` — новые.
- Все опции локализованы (ru/en/kk/uz).

**Ограничения области**
- Не трогаем бизнес-логику (CRM, автоматизации, платежи).
- Не меняем layout самих типов блоков — только визуальные обёртки.
- Custom CSS не добавляем (риск XSS + вне scope).

## Порядок работы

1. Миграция `pages.appearance` + типы + дефолты.
2. `presets.ts` + `tokens.ts` + применение на public page.
3. Editor: вкладка «Дизайн» с 4 секциями и Premium-гейтом.
4. Расширение существующих селекторов (Name, Avatar, Cover).
5. i18n + smoke-check на 4 языках, проверка dark mode.

## Что вне scope этого релиза

- Полностью кастомный CSS/тема-редактор с нуля.
- Пользовательские загружаемые шрифты.
- Экспорт/импорт тем между аккаунтами.
- Marketplace тем.
