## Цель
Параллельно закрыть два направления: (1) дизайн-рефакторинг Quiet Bento по `.lovable/plan.md` и (3) техдолг/стабильность. Бизнес-логика и БД не трогаются. Дополнительно — два security-finding'а из текущего скана.

## Скоуп

### A. Quiet Bento — Sprint B (Dashboard shell)
Фундамент (Sprint A) уже есть: `src/styles/quiet-bento.css` + токены. Двигаемся дальше.

- `DashboardLayout.tsx` — снять внешнюю «коробку в коробке» (`rounded-[2.5rem] border` вокруг контента), контент кладётся прямо на `--surface-quiet`.
- `DashboardSidebar` — иконки 18px, активный pill → левая черта 2px + `font-medium`.
- `DashboardBottomNav` — стекло остаётся, активность через цвет, без капсулы.
- `HomeScreen` — 1 главная Bento-карточка (статус страницы + Edit/Publish/Share как chips), 3 KPI в строке, секция «Что улучшить» без декоративных градиентов.
- `PagesScreen` / `InsightsScreen` — единый header через слоты `DashboardHeader`, карточки `.qb-card`.

### B. Quiet Bento — Sprint C (Editor canvas, добивка)
Большая часть уже в памяти `editor-v2-canvas-2026`. Добиваем:
- `GridEditor` — точки сетки скрыты по умолчанию, появляются на drag; hover блока — только outline 1px + `shadow-lift`, без подсветки фона.
- `FloatingBlockToolbar` — только на selected, убрать hover-trigger.
- Add Block Sheet — убрать вкладки, заменить вертикальной лентой категорий слева + grid справа, поиск с автофокусом.

### C. Техдолг / стабильность (по `DASHBOARD_AUDIT.md`)
- **`useDashboard`**: обернуть return в `useMemo` (high-priority в аудите) — стабилизировать ссылки, починить `React.memo` в детях.
- **`useCloudPageState`**: то же — `useMemo` для return.
- **`SettingsScreen` split**: разрезать ~712-строчный файл на `PageSettingsTab.tsx` и `AccountSettingsTab.tsx` (без изменения поведения).
- **`InsightsScreen`**: вынести AI-инсайт-логику в `src/lib/analytics-insights.ts` + `useInsights`.
- **iOS haptics**: ревизия `src/platform/native/haptics.ts` и `useHapticFeedback` — гарантировать no-op на web и стабильный вызов на Capacitor.
- **BlockErrorBoundary**: использовать `rounded-card` вместо `rounded-xl` (выравнивание с дизайн-системой).

### D. Безопасность (из текущего скана)
1. **`teams.invite_code`** публично читается через политику `Anyone can view public teams safe`. Закрыть: переписать политику + завести SECURITY DEFINER RPC `get_public_team_safe(team_id)` без `invite_code`, либо `REVOKE SELECT (invite_code) ... FROM anon, authenticated` + явный grant только владельцу.
2. **`zones.calendar_feed_token`** виден всем членам зоны. Сделать видимым только админам/владельцам: column-level `REVOKE` + RPC `get_zone_calendar_token(zone_id)` с проверкой `is_zone_admin`.

Обе правки — отдельной миграцией, без касания бизнес-данных.

## Порядок
1. Security (миграция) — отдельный шаг с approval.
2. Техдолг (A→C параллельно безопасным правкам по файлам).
3. Quiet Bento Sprint B.
4. Quiet Bento Sprint C добивка.
5. Прогон lint + проверка e2e селекторов (`data-testid` сохраняются).

## Что НЕ делаем
- Не трогаем Sprint D/E/F (блоки, публичная страница, codemod) — отдельным заходом.
- Не меняем i18n-ключи, роуты, схемы БД сверх двух security-фиксов.
- Не трогаем CRM/Zones/Billing UI.

## Критерии готовности
- Дашборд без двойной рамки, активный пункт сайдбара — черта слева.
- `useDashboard`/`useCloudPageState` возвращают мемоизированный объект.
- `SettingsScreen` < 300 строк, два таба вынесены.
- Security-сканер не показывает оба finding'а.
- Lint зелёный, e2e не сломаны.
