# 🛠️ ПЛАН ИСПРАВЛЕНИЯ ПРОБЛЕМ АУДИТА
**Дата:** 14 февраля 2026  
**Версия:** 1.0  
**Приоритет:** МЕТАБОЛИЧЕСКИЙ

---

## БЫСТРЫЙ СТАРТ (2 часа)

### 1. Исправить невалидный JSON в kk.json

```bash
# Шаг 1: Проверить формат файла
file src/i18n/locales/kk.json

# Шаг 2: Попробовать переформатировать
node cleanup_json.js

# Шаг 3: Если не помогает, восстановить из резервной копии
# или переимпортировать из исходного источника
npm run i18n:import

# Шаг 4: Проверить валидность
npm run i18n:check
```

**Что проверить:**
- Кодировка файла (должна быть UTF-8)
- BOM (Byte Order Mark) в начале файла
- Закрывающие скобки и запятые
- Невалидные escape последовательности

**Если нужен быстрый workaround:**
```bash
# Сделать резервную копию
cp src/i18n/locales/kk.json src/i18n/locales/kk.json.backup

# Заменить на en.json для тестирования
cp src/i18n/locales/en.json src/i18n/locales/kk.json

# Затем восстановить правильный файл
```

---

### 2. Обновить уязвимые зависимости

```bash
# Шаг 1: Проверить текущие версии
npm list @next/eslint-plugin-next glob jspdf esbuild vite

# Шаг 2: Обновить пакеты (версии)
npm update glob --save-dev
npm update jspdf --save
npm update esbuild --save-dev
npm update vite --save-dev

# Шаг 3: Запустить аудит
npm audit fix

# Шаг 4: Проверить результа
npm audit

# Шаг 5: Протестировать приложение
npm run dev
npm run build
```

**Ожидаемый результат:** Количество уязвимостей должно снизиться с 6 до 0-2

---

### 3. Добавить типы в критические файлы

#### Файл 1: AdminUsersTab.tsx (Строка 129)

```typescript
// НАЙТИ:
<Select onValueChange={(v) => extendTrial.mutate({ userId: adminUser.id, days: parseInt(v) })}>

// ЗАМЕНИТЬ НА:
<Select onValueChange={(v: string) => extendTrial.mutate({ userId: adminUser.id, days: parseInt(v) })}>
```

#### Файл 2: Остальные файлы со strict errors

```bash
# Запустить проверку strict режима
npm run typecheck:strict

# Исправить каждую ошибку
# Или отключить для нестрогих файлов (временное решение)
```

---

## ДЕНЬ 1-2 (4-6 часов)

### 4. Провести security audit

```bash
# Шаг 1: Проверить Supabase RLS
# Через Supabase Dashboard → Authentication → Row Level Security

# Шаг 2: Проверить Edge Functions
supabase functions list
supabase functions logs <function-name>

# Шаг 3: Проверить secrets
supabase secrets list

# Шаг 4: Запустить локальный security скрипт
npm run lint
npm audit
```

### 5. Оптимизировать bundle size

```typescript
// Пример: Lazy loading для EventDetailScreen (1.4 MB)
// ТЕКУЩИЙ КОД (не хорошо):
import EventDetailScreen from '@/components/EventDetailScreen';

// НОВЫЙ КОД (хорошо):
const EventDetailScreen = lazy(() => 
  import('@/components/EventDetailScreen')
);

// Использовать с Suspense:
<Suspense fallback={<LoadingSpinner />}>
  <EventDetailScreen {...props} />
</Suspense>
```

**Файлы для оптимизации:**
1. EventDetailScreen.tsx (1.4 MB) → lazy load
2. index.es (1.9 MB) → check for unused exports
3. lucide-react (717 KB) → use tree-shaking
4. EventScanner.tsx (424 KB) → lazy load
5. AreaChart.tsx (378 KB) → lazy load

---

## НЕДЕЛЯ 1 (Ежедневно)

### 6. Запустить e2e тесты

```bash
# Шаг 1: Установить Playwright
npm install

# Шаг 2: Запустить тесты
npm run e2e

# Шаг 3: Проверить результаты
npx playwright show-report
```

**Что проверяют тесты:**
- `auth-flow.spec.ts` - Процесс авторизации
- `language-switch.spec.ts` - Переключение языков
- `page-creation.spec.ts` - Создание страниц

### 7. Начать писать unit тесты

```bash
# Шаг 1: Создать тест для критического модуля
# Пример: src/hooks/useAuth.test.tsx

# Шаг 2: Запустить тесты
npm test

# Шаг 3: Проверить coverage
npm test -- --coverage

# Шаг 4: Target: 30% к концу недели
```

**Рекомендуемые модули для тешения:**
1. `src/hooks/` - Custom hooks (5-10 тестов)
2. `src/lib/` - Utilities (10-15 тестов)
3. `src/services/` - API calls (10-15 тестов)
4. Authentication (10 тестов)
5. Form validation (10 тестов)

---

## НЕДЕЛЯ 2-3

### 8. Удалить мертвый код

```bash
# Шаг 1: Проверить неиспользуемые файлы
npm run analyze:unused

# Шаг 2: Для каждого файла из списка 155:
#   1. Проверить, действительно ли он не используется
#   2. Поискать в git истории (git log -p -- filename)
#   3. Если уверены, удалить
#   4. Запустить тесты

# Ejemplo для удаления:
rm src/components/admin/AdminUsersTab.tsx  # Если действительно не используется
git add -A
npm run build  # Проверить, что сборка еще работает
```

**Категории для проверки:**
- Старые версии компонентов (v1, v2)
- Экспериментальные компоненты
- Заброшенные интеграции
- Legacy код

### 9. Добавить документацию

```bash
# Создать API документацию
# Пример: docs/API.md

# Создать Component Storybook (опционально)
npm install --save-dev @storybook/react

# Создать Database Schema документацию
# Пример: docs/DATABASE_SCHEMA.md (на основе миграций)
```

---

## МЕТРИКИ УСПЕХА

### До конца недели:

| Метрика | Текущее | Целевое | Статус |
|---------|---------|---------|--------|
| Уязвимости (HIGH) | 3 | 0 | ⏳ |
| Уязвимости (всего) | 6 | ≤ 2 | ⏳ |
| kk.json валидность | ❌ | ✅ | ⏳ |
| Type errors | 10+ | 0 | ⏳ |
| Тестовое покрытие | 3.3% | 15% | ⏳ |
| Bundle size (EventDetail) | 1.4 MB | 0.5 MB | ⏳ |
| npm audit | FAIL | PASS | ⏳ |

---

## СКРИПТЫ НА ПОМОЩЬ

### Проверка статуса

```bash
#!/bin/bash
# Создать файл: scripts/audit-status.sh

echo "=== АУДИТ СТАТУСА ПЛАТФОРМЫ ==="

echo "✓ Уязвимости:"
npm audit 2>/dev/null | grep "vulnerabilities"

echo "✓ JSON валидность:"
node -e "
  const fs = require('fs');
  ['ru', 'en', 'kk', 'uk', 'uz'].forEach(lang => {
    try {
      JSON.parse(fs.readFileSync(\`src/i18n/locales/\${lang}.json\`, 'utf8'));
      console.log('  ✓', lang + '.json');
    } catch(e) {
      console.log('  ✗', lang + '.json');
    }
  });
"

echo "✓ TypeScript errors:"
npm run typecheck:strict 2>&1 | grep "error TS" | wc -l

echo "✓ Тестовое покрытие:"
npm test -- --coverage 2>&1 | grep "Lines"
```

### Быстрое исправление

```bash
#!/bin/bash
# scripts/quick-fix.sh

echo "Обновляю зависимости..."
npm update
npm audit fix

echo "Проверяю TypeScript..."
npm run typecheck

echo "Запускаю тесты..."
npm test

echo "Собираю проект..."
npm run build

echo "✓ Готово!"
```

---

## КОММИТЫ ИСПОЛЬЗУЙТЕ

```bash
# Commit 1: JSON fix
git commit -am "fix: Восстановить валидный JSON в kk.json"

# Commit 2: Security updates
git commit -am "chore: Обновить уязвимые зависимости (glob, jspdf, esbuild)"

# Commit 3: Type fixes
git commit -am "fix: Добавить типы в AdminUsersTab и другие файлы"

# Commit 4: Tests
git commit -am "test: Добавить unit тесты для useAuth и utilities"

# Commit 5: Performance
git commit -am "perf: Оптимизировать bundle size через lazy loading"
```

---

## КОНТРОЛЬНЫЙ СПИСОК

### День 1

- [ ] Исправить kk.json
- [ ] Обновить glob, jspdf, esbuild, vite
- [ ] Добавить типы в AdminUsersTab.tsx
- [ ] Запустить `npm run i18n:check` ✅
- [ ] Запустить `npm run build` ✅
- [ ] Запустить `npm test` ✅

### День 2

- [ ] Запустить `npm audit` и записать результат
- [ ] Провести Supabase security review
- [ ] Начать писать unit тесты (минимум 10)
- [ ] Идентифицировать top 5 файлов для lazy loading
- [ ] Создать PR с исправлениями

### Неделя 1

- [ ] 30+ unit тестов
- [ ] 0 HIGH severity уязвимостей
- [ ] Все type errors исправлены
- [ ] Bundle оптимизирован (< 3 MB gzipped)
- [ ] Документация обновлена

### Неделя 2-3

- [ ] 60+ unit тестов (15% покрытие)
- [ ] Мертвый код удален (50 файлов)
- [ ] API документация создана
- [ ] Performance monitoring настроено
- [ ] Security audit пройден

---

## РЕСУРСЫ

### Инструменты
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Bundle Analyzer](https://bundlephobia.com/)

### Документация
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [React.lazy Code Splitting](https://react.dev/reference/react/lazy)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [npm Vulnerabilities](https://docs.npmjs.com/auditing-package-contents-for-sensitive-information)

### Примеры
- [Lazy Loading Example](https://github.com/shadcn/ui/examples)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

## ПОМОЩЬ И ПОДДЕРЖКА

Если возникнут проблемы при исправлении:

1. **JSON ошибки:**
   - Использовать [JSON Validator](https://jsonlint.com/)
   - Проверить кодировку в редакторе (UTF-8 без BOM)

2. **TypeScript ошибки:**
   - Запустить `npm run typecheck:strict` для деталей
   - Проверить [TS Handbook](https://www.typescriptlang.org/docs/)

3. **Bundle ошибки:**
   - Использовать `npm run build` (покажет размеры)
   - Анализировать с Rollup analyzer

4. **Test ошибки:**
   - Запустить `npm test -- --reporter=verbose`
   - Проверить [Vitest Docs](https://vitest.dev/)

---

**Время обновления:** 14 февраля 2026  
**Версия:** 1.0  
**Статус:** ГОТОВ К ИСПОЛНЕНИЮ
