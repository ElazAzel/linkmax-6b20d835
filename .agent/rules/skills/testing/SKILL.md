---
name: testing
description: Тестирование LinkMAX. Vitest (unit), Playwright (E2E), скриншоты, консоль-логи.
---

# Testing Skill

Написание и запуск тестов: unit (Vitest), E2E (Playwright), регрессионные скриншоты.

## Когда использовать

- Добавление unit-теста для новой функции
- Написание E2E-теста для критического пути (регистрация, создание страницы)
- Отладка UI через Playwright (скриншоты, консоль-логи)
- Проверка регрессии перед деплоем

## Воркфлоу

### 1. Unit-тесты (Vitest)

```typescript
// src/hooks/useLeads.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('useLeads', () => {
  it('should create a new lead', async () => {
    const { result } = renderHook(() => useLeads());
    await act(async () => {
      await result.current.createLead({ name: 'Test', service: 'Pro' });
    });
    expect(result.current.leads).toHaveLength(1);
  });
});
```

```bash
npm run test              # однократный запуск
npm run test:coverage     # с отчётом покрытия
```

**Ключевые файлы:**
- `src/**/*.test.ts` — тесты рядом с кодом
- `vitest.config.ts` — конфигурация
- `src/testing/` — хелперы и моки

### 2. E2E-тесты (Playwright)

```typescript
// e2e/page-creation.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a bio page', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Create Page');
  await page.fill('[name=title]', 'My Bio');
  await page.click('text=Publish');
  await expect(page.locator('.page-published')).toBeVisible();
});
```

```bash
npm run e2e               # локально
npm run e2e:ci            # CI (без браузера в UI режиме)
```

### 3. Playwright-скрипты (отладка)

Для быстрой отладки использовать `with_server.py`:
```bash
python docs/skills\ ui/testing/scripts/with_server.py \
  --server "npm run dev" --port 8080 \
  -- python debug_script.py
```

**Шаблон скрипта:**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:8080')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/debug.png', full_page=True)
    print(page.content())  # DOM для анализа
    browser.close()
```

## Команды

```bash
npm run test                  # unit
npm run test:coverage         # unit + coverage
npm run e2e                   # E2E (Playwright)
npm run e2e:ci                # E2E (CI режим)
npm run quality:check         # полная проверка
```

## Связанные модули

- `devops` — запуск тестов в CI перед деплоем
- `analytics` — тестирование PostHog-событий
