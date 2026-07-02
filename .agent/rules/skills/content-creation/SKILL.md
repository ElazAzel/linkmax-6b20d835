---
name: content-creation
description: AI-генерация контента для страниц LinkMAX. Написание текстов, SEO-оптимизация, A/B-тестирование копирайтинга.
---

# Content Creation Skill

Создание качественного контента для bio-страниц, блоков и маркетинговых материалов с использованием AI (Gemini).

## Когда использовать

- Генерация новой bio-страницы / лендинга по описанию
- Написание SEO-текстов для блоков (Products, Services, About)
- Улучшение hook'ов и CTA на странице
- A/B тестирование вариантов копирайтинга
- Перевод контента на 16 языков (i18n)

## Воркфлоу

### 1. Генерация страницы

По запросу пользователя:

1. **Собрать контекст:** ниша, аудитория, цели, тон голоса
2. **Создать outline:** структура блоков (Profile, Links, Products, etc.)
3. **Сгенерировать контент** через Gemini API:
   - Заголовки (hook + value proposition)
   - Описания (кратко: <100 символов для блоков)
   - CTA (действие, срочность)
4. **Применить SEO:** ключевые слова в заголовки, JSON-LD разметка
5. **Записать в страницу** через редактор (`src/services/page.service.ts`)

**Формат для AI-генерации:**
```typescript
interface PageContent {
  blocks: Array<{
    type: 'profile' | 'links' | 'products' | 'services';
    title: string;
    description: string;
    cta?: string;
    seo?: { keywords: string[]; description: string };
  }>;
  seo: { title: string; description: string; ogImage?: string };
}
```

**Ключевые файлы:**
- `src/services/ai-generation.service.ts` — вызов Gemini
- `src/components/block-editors/` — редакторы блоков
- `src/i18n/locales/` — переводы на 16 языков

### 2. Улучшение hook'ов

При запросе "сделай заголовок лучше":

1. Проанализировать текущий hook:
   - Цепляет ли эмоционально?
   - Обещает ли ценность?
   - Специфичен ли для аудитории?
2. Предложить 3 альтернативы с разными углами:
   - Data-driven: "Присоединяйтесь к 1000+ создателей"
   - Story-driven: "Как я перестал терять клиентов"
   - Question-driven: "Устали от...?"

### 3. A/B тестирование копирайтинга

1. Создать 2+ варианта текста для блока
2. Записать в таблицу `ab_experiments`:
   ```sql
   INSERT INTO ab_experiments (page_id, block_id, variants)
   VALUES ($1, $2, '[{"text":"...","weight":50},{"text":"...","weight":50}]');
   ```
3. Настроить трафик-аллокацию в Edge Function
4. После сбора статистики (7+ дней) — рекомендация по победителю

### 4. Перевод контента

1. Определить язык (RU/EN/KK — основные)
2. Использовать i18n-менеджер:
   ```bash
   npm run i18n:sync     # синхронизация ключей
   npm run i18n:fill     # заполнить пропуски (AI)
   ```
3. Проверить coverage: `npm run i18n:check-coverage`

## Связанные модули

- `design-brand` — стили для страниц
- `analytics` — PostHog-события по конверсии вариантов A/B
- `business-zone` — контент для привлечения лидов
