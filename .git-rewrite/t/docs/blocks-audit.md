# Block Audit Report - LinkMAX v2.0

## Инвентаризация блоков

**Всего блоков:** 28

### Таблица блоков

| BlockType | Renderer | Editor | Pro/Free | Категория | Статус |
|-----------|----------|--------|----------|-----------|--------|
| profile | ✅ ProfileBlock | ✅ ProfileBlockEditor | Free | basic | ✅ OK |
| link | ✅ LinkBlock | ✅ LinkBlockEditor | Free | basic | ✅ OK |
| button | ✅ ButtonBlock | ✅ ButtonBlockEditor | Free | basic | ✅ OK |
| text | ✅ TextBlock | ✅ TextBlockEditor | Free | basic | ✅ OK |
| separator | ✅ SeparatorBlock | ✅ SeparatorBlockEditor | Free | basic | ✅ OK |
| avatar | ✅ AvatarBlock | ✅ AvatarBlockEditor | Free | basic | ✅ OK |
| socials | ✅ SocialsBlock | ✅ SocialsBlockEditor | Free | basic | ✅ OK |
| messenger | ✅ MessengerBlock | ✅ MessengerBlockEditor | Free | basic | ✅ OK |
| image | ✅ ImageBlock | ✅ ImageBlockEditor | Free | media | ✅ OK |
| map | ✅ MapBlock | ✅ MapBlockEditor | Free | interactive | ✅ OK |
| faq | ✅ FAQBlock | ✅ FAQBlockEditor | Free | interactive | ✅ OK |
| video | ✅ VideoBlock | ✅ VideoBlockEditor | Pro | media | ✅ OK |
| carousel | ✅ CarouselBlock | ✅ CarouselBlockEditor | Pro | media | ✅ OK |
| before_after | ✅ BeforeAfterBlock | ✅ BeforeAfterBlockEditor | Pro | media | ✅ OK |
| form | ✅ FormBlock | ✅ FormBlockEditor | Pro | interactive | ✅ OK |
| scratch | ✅ ScratchBlock | ✅ ScratchBlockEditor | Pro | interactive | ✅ OK |
| countdown | ✅ CountdownBlock | ✅ CountdownBlockEditor | Pro | interactive | ✅ OK |
| custom_code | ✅ CustomCodeBlock | ✅ CustomCodeBlockEditor | Pro | interactive | ✅ OK |
| product | ✅ ProductBlock | ✅ ProductBlockEditor | Pro | commerce | ✅ OK |
| catalog | ✅ CatalogBlock | ✅ CatalogBlockEditor | Pro | commerce | ✅ OK |
| pricing | ✅ PricingBlock | ✅ PricingBlockEditor | Pro | commerce | ✅ OK |
| download | ✅ DownloadBlock | ✅ DownloadBlockEditor | Pro | commerce | ✅ OK |
| booking | ✅ BookingBlock | ✅ BookingBlockEditor | Pro | commerce | ✅ OK |
| shoutout | ✅ ShoutoutBlock | ✅ ShoutoutBlockEditor | Pro | social | ✅ OK |
| community | ✅ CommunityBlock | ✅ CommunityBlockEditor | Pro | social | ✅ OK |
| event | ✅ EventBlock | ✅ EventBlockEditor | Pro | social | ✅ OK |
| testimonial | ✅ TestimonialBlock | ✅ TestimonialBlockEditor | Pro | social | ✅ OK |
| newsletter | ✅ NewsletterBlock | ✅ NewsletterBlockEditor | Pro | advanced | ✅ OK |

## Стандарт качества блоков

### 1. TypeScript Types
- Все блоки используют типизированные интерфейсы в `src/types/page.ts`
- Union type `Block` объединяет все типы блоков
- Discriminated union по полю `type`

### 2. Editor Contract
```typescript
interface BlockEditorProps {
  formData: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
}
```

### 3. Render Contract
```typescript
interface BlockProps<T extends Block> {
  block: T;
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
}
```

### 4. Spacing Standards (NEW)
Стандарт отступов для предотвращения обрезки текста закруглениями:

```
Правило: внутренний padding >= border-radius

rounded-xl (12px)  → минимум p-4 (16px)
rounded-2xl (16px) → минимум p-5 (20px)
rounded-3xl (24px) → минимум p-6 (24px)
```

Утилиты в `src/lib/block-spacing.ts`:
- `BLOCK_CONTAINER_CLASSES` - готовые классы контейнеров
- `BLOCK_INNER_CLASSES` - классы для вложенных элементов
- `getMinPaddingForRadius()` - получение минимального padding

### 5. Premium Gating
- Определено в `src/lib/block-registry.ts`
- UI gating через `FreePremiumBlockGate`
- Backend enforcement через RLS policies

## Исправленные проблемы

### P0 - Критические (Block Stability v2.0)

#### Проблемы с исчезновением/дублированием блоков:

| Проблема | Причина | Решение |
|----------|---------|---------|
| Блоки исчезают при drag | `key={rowIndex}` в GridEditor | `key={createRowKey()}` - стабильный ключ по ID блоков |
| Дублирование блоков | Race conditions в autosave | Stale request protection + version tracking |
| Наложение блоков | Нет валидации целостности | `ensureBlockIds()` + `deduplicateBlocks()` |
| Mobile DnD не работает | Controls только по hover | Всегда видимые кнопки на mobile |

#### Новые утилиты (`src/lib/block-utils.ts`):
- `generateBlockId(type)` - Crypto-secure ID
- `createRowKey(blocks)` - Стабильный ключ для React rows
- `validateBlocksIntegrity(blocks)` - Проверка дубликатов/ID
- `ensureBlockIds(blocks)` - Safety net для missing IDs
- `deduplicateBlocks(blocks)` - Удаление дубликатов

#### Autosave Protection (`src/hooks/useCloudPageState.ts`):
- Request versioning для каждого save
- Stale check перед каждой мутацией
- Санитизация блоков перед save
- Оптимизированный debounce (1.5s)

#### Mobile Controls (`src/components/editor/GridEditor.tsx`):
- Кнопки Up/Down всегда видны на mobile
- Увеличенные touch targets (h-8)
- DnD handle скрыт на mobile (стрелки - основной control)

### P0 - Type Safety
1. **✅ FIXED:** `as any` в BlockRenderer (5 мест) → типизированные assertions
2. **✅ FIXED:** Несогласованность PREMIUM_BLOCK_TYPES → единый реестр

### Файлы изменены
- `src/components/BlockRenderer.tsx` - убраны все `as any`
- `src/lib/block-registry.ts` - НОВЫЙ: единый реестр блоков
- `src/lib/block-utils.ts` - ОБНОВЛЁН: stability utilities
- `src/lib/constants.ts` - реэкспорт из registry
- `src/domain/entities/Block.ts` - синхронизация premium types
- `src/components/blocks/FreePremiumBlockGate.tsx` - использует registry
- `src/hooks/useBlockEditor.tsx` - импорт из registry
- `src/hooks/useCloudPageState.ts` - stale request protection
- `src/components/editor/GridEditor.tsx` - stable keys + mobile controls
- `src/components/blocks/GridBlocksRenderer.tsx` - stable keys

## i18n Покрытие

Все блоки поддерживают MultilingualString для:
- title/name/content
- description/bio
- labels/placeholders

Языки: ru, en, kk

## Правила добавления нового блока

1. Добавить тип в `src/types/page.ts`:
   ```typescript
   export interface NewBlock {
     id: string;
     type: 'new_block';
     // ... поля
   }
   ```

2. Добавить в union `Block`

3. Добавить в `src/lib/block-registry.ts`:
   - В `FREE_BLOCK_TYPES` или `PREMIUM_BLOCK_TYPES`
   - В `BLOCK_METADATA`

4. Создать компоненты:
   - `src/components/blocks/NewBlock.tsx`
   - `src/components/block-editors/NewBlockEditor.tsx`

5. Зарегистрировать в:
   - `BlockRenderer.tsx` - рендер
   - `BlockEditor.tsx` - редактор
   - `block-factory.ts` - создание

6. Добавить переводы в `src/i18n/locales/*.json`

7. Добавить тест в `src/components/blocks/__tests__/`

## Команды проверки

```bash
# Lint
npm run lint

# TypeCheck
npx tsc --noEmit

# Tests
npm test

# Build
npm run build
```

## Тестовое покрытие

- ✅ 151 тест проходит
- ✅ FreePremiumBlockGate tests
- ✅ EventBlock tests
- ✅ Blocks rendering tests
