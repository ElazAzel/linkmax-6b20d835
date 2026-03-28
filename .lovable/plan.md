

# UX/UI Аудит платформы LinkMAX — Найденные проблемы

## КРИТИЧНО: Нерабочие функции

### 1. Кнопки-заглушки без действия (TODO в коде)
**Файлы:** `AccountSettingsTab.tsx:339, 359`
- **"Billing History"** — `onClick={() => {/* TODO */}}` — кнопка ничего не делает
- **"Change Password"** — `onClick={() => {/* TODO */}}` — кнопка ничего не делает
- Пользователь нажимает — ноль обратной связи. Это выглядит как баг.

### 2. MonetizeScreen: `onManageBilling` никогда не передаётся
**Файлы:** `DashboardV2.tsx:604`, `MonetizeScreen.tsx:221`
- `MonetizeScreen` принимает `onManageBilling` проп, но `DashboardV2` **не передаёт его** → кнопка "Manage Billing" = undefined onClick → ничего не происходит.

### 3. MonetizeScreen: tier всегда "identity" или "pro"
**Файл:** `DashboardV2.tsx:606`
- `tier={dashboard.isPremium ? 'pro' : 'identity'}` — игнорирует реальные тиры Starter и Business. Пользователь Starter видит "PRO", а Business видит "PRO".

### 4. Zone-табы: пустой экран без фидбека для не-Business
**Файл:** `DashboardV2.tsx:749-761`
- Если `canUseBusinessZone()` = false, при переходе на zone-таб рендерится **пустота** — ни сообщения, ни редиректа. Белый экран.

## ПРОБЛЕМЫ UX

### 5. PublicPage: `updatedAt` всегда `new Date().toISOString()`
**Файл:** `PublicPage.tsx:238, 274`
- SEO-компоненты получают текущую дату вместо реальной даты обновления страницы → поисковики видят "страница обновляется каждую секунду" → вредит SEO.

### 6. PublicPage: `as any` каскад
**Файл:** `PublicPage.tsx:152-154`
- `translateBlocksToLanguage(experimentalBlocks as any[])` и сравнение `translated !== experimentalBlocks as any` — TypeScript обходится, и проверка на равенство ссылок тоже может быть некорректной (Promise всегда возвращает новый массив).

### 7. FinanceScreen: useEffect вместо React Query
**Файл:** `FinanceScreen.tsx:35-42`
- Данные кошелька загружаются через `useEffect` + `useState` вместо React Query → нет кэширования, нет retry, нет stale-time. При переключении табов данные перезагружаются каждый раз.

### 8. DashboardV2: 925 строк — God Component
**Файл:** `DashboardV2.tsx`
- Один файл содержит 925 строк, ~30 useState, ~15 useCallback, ~20 lazy imports. Сложно поддерживать. Рекомендуется разбить на под-хуки (useDashboardModals, useDashboardNavigation).

### 9. NotFound: минимальный UI без навигации
**Файл:** `NotFound.tsx`
- Нет кнопки "Go to Dashboard", нет поиска, нет анимации. Просто текст и ссылка. Не соответствует Liquid Glass стилистике остальной платформы.

### 10. DashboardV2 error state: нативный `<button>` вместо DS Button
**Файл:** `DashboardV2.tsx:388-393`
- Используется `<button>` вместо `<Button>` из дизайн-системы. Нарушает audit из `design-system-audit.md`.

## ОПТИМИЗАЦИИ

### 11. HeroSection: scroll-параллакс через useState
**Файл:** `HeroSection.tsx:20-43`
- `useScrollParallax` вызывает 4 × `setState` на каждый кадр скролла → до 240 рендеров в секунду. Нужно заменить на `useTransform` из framer-motion или ref-based CSS variables.

### 12. `window.addEventListener` для межкомпонентной коммуникации
**Файл:** `DashboardV2.tsx:312-332`
- 5 глобальных event listeners (`openFriends`, `openTemplates` и т.д.) вместо Context или Zustand. Хрупко, нетипизированно, сложно дебажить.

## План исправлений

### Шаг 1. Починить нерабочие кнопки (пп. 1-2)
- "Change Password": реализовать вызов `supabase.auth.updateUser` через модалку
- "Billing History": либо реализовать, либо скрыть, либо показать toast "Coming soon"
- Передать `onManageBilling` в MonetizeScreen

### Шаг 2. Исправить tier в MonetizeScreen (п. 3)
- Передавать `dashboard.currentTier` вместо тернарника

### Шаг 3. Добавить fallback для zone-табов (п. 4)
- При `!canUseBusinessZone()` показывать upgrade-промпт вместо пустого экрана

### Шаг 4. Исправить updatedAt в PublicPage (п. 5)
- Использовать `pageData.updatedAt` или `pageData.updated_at` из БД

### Шаг 5. Заменить нативный button на DS Button (п. 10)
- В error state DashboardV2

### Шаг 6. Оптимизировать scroll-параллакс (п. 11)
- Заменить useState на CSS custom properties через ref

### Шаг 7. Улучшить NotFound (п. 9)
- Добавить Liquid Glass стиль, кнопку Dashboard, анимацию

### Шаг 8. Заменить useEffect на React Query в FinanceScreen (п. 7)

