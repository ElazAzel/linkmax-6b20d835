---
name: analytics
description: PostHog-аналитика для LinkMAX. События, воронки, feature flags, A/B эксперименты.
---

# Analytics Skill

Работа с PostHog: отслеживание событий, анализ воронок, управление feature flags.

## Когда использовать

- Настройка отслеживания нового события (page_view, lead_created, payment_completed)
- Анализ воронки конверсии (визит → регистрация → оплата)
- Создание/включение feature flag для A/B теста
- Просмотр инсайтов и дашбордов

## Воркфлоу

### 1. Добавление события

```typescript
// src/services/analytics.service.ts
import { posthog } from 'posthog-js';

export function trackPageView(pageId: string) {
  posthog.capture('page_view', { page_id: pageId, source: 'direct' });
}
```

**Ключевые события платформы:**
| Событие | Триггер |
|---|---|
| `page_created` | Создание новой страницы |
| `lead_created` | Новый лид в CRM |
| `lead_status_changed` | Изменение статуса лида |
| `payment_started` | Начало оплаты |
| `payment_completed` | Успешная оплата |
| `block_edited` | Редактирование блока |
| `ab_test_exposed` | Показ варианта A/B теста |

**Ключевые файлы:**
- `src/services/analytics.service.ts`
- `src/hooks/useAnalytics.ts`
- `src/platform/posthog/`

### 2. Feature Flags

```typescript
const isNewCrmEnabled = posthog.isFeatureEnabled('new-crm-ui');
if (isNewCrmEnabled) {
  renderNewCRM();
} else {
  renderLegacyCRM();
}
```

**Управление:** PostHog Dashboard → Feature Flags

### 3. A/B эксперименты

Через PostHog Experiments:
1. Создать Experiment в PostHog
2. Использовать `posthog.getFeatureFlag('experiment-name')`
3. Отслеживать конверсию по событиям
4. PostHog покажет статистическую значимость

## Связанные модули

- `content-creation` — A/B тестирование копирайтинга
- `business-zone` — аналитика по лидам
- `payments` — конверсия платежей
