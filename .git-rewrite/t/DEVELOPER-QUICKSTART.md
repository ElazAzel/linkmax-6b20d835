# 🚀 Быстрый старт разработчика - InkMax

**Версия:** 2.0  
**Дата:** 1 февраля 2026

## 📚 Документы (Начните отсюда!)

| Документ | Назначение | Для кого |
|----------|-----------|----------|
| **[PLATFORM-DOCUMENTATION.md](./docs/PLATFORM-DOCUMENTATION.md)** | Обзор платформы, архитектура, фичи | Все |
| **[BLOCKS-REFERENCE.md](./docs/BLOCKS-REFERENCE.md)** | Справочник всех 28 блоков с примерами | Разработчики |
| **[BLOCKS-AUDIT.md](./docs/BLOCKS-AUDIT.md)** | Полный аудит функциональности | Архитекторы |
| **[AUDIT-REPORT-2026-02-01.md](./AUDIT-REPORT-2026-02-01.md)** | Итоговый отчет аудита | Менеджеры |

---

## 🏗️ Архитектура

### Stack технологий
```
Frontend:     React 18 + TypeScript + Vite + Tailwind
Backend:      Supabase (PostgreSQL + Auth)
Edge:         Cloudflare Worker (SSR + Caching)
Payments:     Stripe
Email:        Mailchimp/SendGrid
Analytics:    Custom + Supabase
```

### Структура проекта
```
src/
├── components/
│   ├── blocks/              # 28 блок компонентов
│   ├── block-editors/       # 28 редакторов блоков
│   ├── ui/                  # shadcn/ui компоненты
│   ├── editor/              # Editor UI
│   ├── admin/               # Admin panel
│   └── ...
├── pages/                   # Routes
├── hooks/                   # 50+ custom hooks
├── services/                # Business logic
├── types/page.ts            # ⭐ Все типы блоков
├── lib/                     # Utilities
└── i18n/                    # RU, EN, KK
```

---

## 🧩 28 Блоков (Полный список)

### Профиль (1)
- **Profile** - Аватар + имя + био (15 стилей рамки, 9 анимаций)

### Базовые (5)
- **Link** - Ссылка с favicon
- **Button** - CTA кнопка (4 эффекта наведения)
- **Text** - Rich text
- **Avatar** - Компактный аватар
- **Separator** - Разделитель (4 варианта)

### Медиа (4)
- **Image** - Изображение (5 стилей)
- **Video** - YouTube/Vimeo
- **Carousel** - Галерея с автопроигрыванием
- **Before/After** - Интерактивный компаратор

### Интерактивные (5)
- **Socials** - Социальные сети (20+ платформ)
- **Messenger** - WhatsApp/Telegram/Viber/WeChat
- **Form** - Форма сбора лидов (⭐ премиум)
- **FAQ** - Аккордеон Q&A (Schema.org)
- **Map** - Google Maps

### Коммерция (4)
- **Product** - Карточка товара (25+ валют)
- **Catalog** - Каталог с фильтром (⭐ премиум)
- **Pricing** - Пакеты услуг (Schema.org Service)
- **Download** - Загрузка файла

### Премиум (6)
- **Custom Code** - HTML/CSS/JS (⭐ премиум)
- **Newsletter** - Email подписка (⭐ премиум)
- **Testimonial** - Отзывы + рейтинги (⭐ премиум)
- **Scratch** - Интерактивный скретч (⭐ премиум)
- **Countdown** - Таймер (⭐ премиум)
- **Booking** - Запись на услуги (⭐ премиум)

### Социально (3)
- **Community** - Telegram канал
- **Shoutout** - Рекомендация пользователя
- **Event** - Регистрация на события (20+ полей)

---

## 🔧 Как добавить новый блок

### Шаг 1: Добавить тип в `src/types/page.ts`

```typescript
export interface MyBlock {
  id: string;
  type: 'my_block';
  title: string | MultilingualString;
  // ... другие поля
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export type BlockType = '...' | 'my_block';
```

### Шаг 2: Создать компонент в `src/components/blocks/MyBlock.tsx`

```typescript
import { memo } from 'react';
import type { MyBlock as MyBlockType } from '@/types/page';

interface MyBlockProps {
  block: MyBlockType;
  onClick?: () => void;
}

export const MyBlock = memo(function MyBlock({ block, onClick }: MyBlockProps) {
  return (
    <div onClick={onClick}>
      {block.title}
    </div>
  );
});
```

### Шаг 3: Создать редактор в `src/components/block-editors/MyBlockEditor.tsx`

```typescript
import { memo } from 'react';
import type { MyBlock as MyBlockType } from '@/types/page';
import { BlockEditorWrapper } from './BlockEditorWrapper';

interface MyBlockEditorProps {
  block: MyBlockType;
  onChange: (block: MyBlockType) => void;
}

export const MyBlockEditor = memo(function MyBlockEditor({ 
  block, 
  onChange 
}: MyBlockEditorProps) {
  return (
    <BlockEditorWrapper>
      {/* Редактор для блока */}
    </BlockEditorWrapper>
  );
});
```

### Шаг 4: Добавить в `src/components/BlockRenderer.tsx`

```typescript
const MyBlock = lazy(() => 
  import('./blocks/MyBlock').then(m => ({ default: m.MyBlock }))
);

// В функции BlockRenderer:
case 'my_block':
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <MyBlock block={block as MyBlockType} onClick={handleClick} />
    </Suspense>
  );
```

### Шаг 5: Добавить в `src/components/BlockEditor.tsx`

```typescript
const MyBlockEditor = lazy(() => 
  import('./block-editors/MyBlockEditor').then(m => ({ default: m.MyBlockEditor }))
);

// В функции BlockEditor:
case 'my_block':
  return (
    <Suspense fallback={<Skeleton />}>
      <MyBlockEditor block={block as MyBlockType} onChange={handleSave} />
    </Suspense>
  );
```

### Шаг 6: Добавить в `src/components/DraggableBlockList.tsx`

```typescript
case 'my_block':
  return `My Block: ${block.title}`;
```

### Шаг 7: Тесты в `src/components/blocks/__tests__/blocks.test.tsx`

```typescript
import { MyBlock } from '../MyBlock';

describe('MyBlock', () => {
  it('should render', () => {
    render(<MyBlock block={mockMyBlock} />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });
});
```

---

## 🎨 Система стилей

Каждый блок поддерживает `BlockStyle`:

```typescript
interface BlockStyle {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  backgroundColor?: string;
  backgroundGradient?: string;
  textColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono' | 'display' | 'rounded';
  textEffect?: 'shimmer' | 'glow' | 'pulse' | 'rainbow' | 'neon' | 'typewriter';
  hoverEffect?: 'scale' | 'glow' | 'lift' | 'fade';
  animation?: 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
  animationDelay?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  isPaidContent?: boolean;
  paidContentPrice?: number;
  paidContentCurrency?: Currency;
}
```

---

## 🌍 Многоязычность

### Структура данных
```typescript
type MultilingualString = {
  ru?: string;
  en?: string;
  kk?: string;
};
```

### Использование
```typescript
// В компоненте
const { i18n } = useTranslation();
const text = getTranslatedString(block.title, i18n.language);

// В типах
interface MyBlock {
  title: string | MultilingualString;
}
```

### Локализованные строки
```typescript
// src/i18n/locales/ru.json
{
  "blocks": {
    "myBlock": {
      "title": "Мой блок"
    }
  }
}
```

---

## 📊 Аналитика

### Отслеживание события
```typescript
const { onBlockClick } = useAnalytics();

const handleClick = () => {
  onBlockClick(block.id, block.type, 'Block Title');
};
```

### Доступные события
- **view** - просмотр блока
- **click** - клик по ссылке
- **share** - поделиться
- **engagement** - взаимодействие

### Data сохраняется в Supabase
```
analytics table:
- block_id
- event_type
- metadata (device, source, visitor_id)
- created_at
```

---

## 🔐 Безопасность

### XSS Protection
```typescript
// ✅ Хорошо - React escaping
<div>{userContent}</div>

// ❌ Плохо - HTML injection
<div dangerousInnerHTML={{ __html: userContent }} />
```

### CSRF Protection
Используется на уровне Supabase RLS

### Rate Limiting
- API: 60 запросов/минуту
- Email: 10 писем/час
- Forms: 10 отправок/минуту

---

## 🚀 Развертывание

### Локально
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Lint & Type check
```bash
npm run lint
npx tsc --noEmit
npm run lint:i18n
```

### Тесты
```bash
npm test
npm run e2e
npm run e2e:ci
```

---

## 📦 Зависимости

**Core:**
- react@18
- typescript
- vite
- tailwindcss
- shadcn/ui

**Utils:**
- react-router-dom@6
- react-i18next
- vitest
- playwright

**Backend:**
- @supabase/supabase-js
- stripe

---

## 🔗 Полезные ссылки

- **GitHub:** https://github.com/ElazAzel/inkmax
- **Live:** https://lnkmx.my
- **Docs:** https://docs.inkmax.dev
- **Issues:** https://github.com/ElazAzel/inkmax/issues

---

## ⚙️ Конфигурация

### Environment Variables
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

### Tailwind Config
```typescript
// 2-column grid by default
// Mobile first approach
// Semantic tokens for colors
```

---

## 📋 Чек-лист для новой фичи

- ✅ Добавить тип в `types/page.ts`
- ✅ Создать компонент `blocks/NewBlock.tsx`
- ✅ Создать редактор `block-editors/NewBlockEditor.tsx`
- ✅ Добавить в `BlockRenderer.tsx`
- ✅ Добавить в `BlockEditor.tsx`
- ✅ Добавить в `DraggableBlockList.tsx`
- ✅ Добавить тесты
- ✅ Добавить translations
- ✅ Обновить документацию
- ✅ Проверить lint и типы

---

## 🤝 Контрибьютинг

1. Fork репозитория
2. Создать feature branch (`git checkout -b feature/MyFeature`)
3. Commit изменения (`git commit -am 'Add MyFeature'`)
4. Push в branch (`git push origin feature/MyFeature`)
5. Open Pull Request

---

## 📞 Поддержка

- **GitHub Issues:** https://github.com/ElazAzel/inkmax/issues
- **Email:** support@inkmax.dev
- **Docs:** https://docs.inkmax.dev

---

**Обновлено:** 1 февраля 2026  
**Версия:** 2.0 Phase 2  
**Статус:** Production Ready ✅
