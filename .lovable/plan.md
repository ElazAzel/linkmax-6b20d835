

## Полный аудит платформы LinkMAX — Выводы и план доработок

### Обнаруженные проблемы

---

### A. Баги и технические ошибки

**1. Дублированный маршрут `zone-analytics` в `main.tsx` (строки 156-157)**
Маршрут `dashboard/zone-analytics` зарегистрирован дважды. Второй — мёртвый код.

**2. Отсутствует маршрут `dashboard/leads` в `main.tsx`**
`LeadsScreen` рендерится в `DashboardV2.tsx` по табу `leads`, но маршрут не зарегистрирован — прямой URL `/dashboard/leads` даёт 404.

**3. `zone-analytics` отсутствует в сайдбаре**
В `DashboardSidebar.tsx` (строка 88) `zone-dashboard` показывает label «Аналитика», но отдельного пункта `zone-analytics` нет в массиве `SECTIONS`. При этом `zone-analytics` есть в `ZONE_ITEM_IDS` (строка 137) — значит sidebar его гейтит, но не показывает. Пользователь не может попасть на расширенную аналитику.

**4. Sidebar `ZONE_ITEM_IDS` не содержит `zone-analytics`**
В строке 137 `ZONE_ITEM_IDS` перечислены все zone-табы, но `zone-analytics` пропущен — при клике на него не будет редиректа на pricing для не-бизнес пользователей.

**5. LeadsScreen использует `is_primary` вместо `is_primary_paid`**
`LeadsScreen.tsx` строка 26 делает запрос `.eq('is_primary', true)`, но в схеме БД поле называется `is_primary_paid` — лиды никогда не загружаются.

---

### B. UX/UI проблемы

**6. Нет навигации к Leads и Team из bottom nav / sidebar**
- `leads` есть как таб, но нет в `MAIN_ITEMS` сайдбара и не в `MORE_ITEMS` bottom nav.
- `team` — есть в `MORE_ITEMS` bottom nav и в sidebar, ок.

**7. `zone-dashboard` и `zone-analytics` — запутанное наименование**
В сайдбаре `zone-dashboard` называется «Аналитика», а отдельный `zone-analytics` (с воронкой и экспортом) вообще не отображается. Пользователь видит только базовый дашборд, думая что это вся аналитика.

**8. Дублирование иконок Calendar в bottom nav**
`zone-calendar` и `zone-events` оба используют иконку `Calendar`, что создаёт визуальную путаницу.

---

### C. Отсутствующий функционал (не платежи)

**9. Нет account settings route**
`AccountSettingsScreen.tsx` существует в screens, но не подключён ни к одному табу в `DashboardV2.tsx`.

**10. `PageSettingsScreen` существует но не используется**
Файл есть, но настройки страницы встроены в `SettingsScreen` через пропсы — мёртвый код.

---

### План реализации

#### Task 1: Исправить routing bugs
- Удалить дублированный маршрут `zone-analytics` (строка 157 в `main.tsx`)
- Добавить маршрут `dashboard/leads` в `main.tsx`

#### Task 2: Исправить LeadsScreen запрос
- Заменить `.eq('is_primary', true)` на правильное поле (вероятнее всего убрать фильтр по primary и использовать `user_id` из auth)

#### Task 3: Добавить `zone-analytics` в sidebar
- Добавить пункт `zone-analytics` в массив `SECTIONS[0].items` в `DashboardSidebar.tsx` (после `zone-dashboard`)
- Добавить `zone-analytics` в `ZONE_ITEM_IDS` для корректного гейтинга
- Переименовать `zone-dashboard` label на «Дашборд» (dashboard.sidebar.zoneDashboard → zoneDashboard = «Дашборд»), а `zone-analytics` — «Отчёты»

#### Task 4: Добавить Leads в навигацию
- Добавить `leads` в `MORE_ITEMS` в `DashboardBottomNav.tsx`
- Добавить `leads` в основную секцию sidebar (`MAIN_ITEMS`) или в секцию tools

#### Task 5: Исправить иконки bottom nav
- Заменить иконку `zone-events` на `CalendarDays` (как в sidebar) для различия с `zone-calendar`

### Файлы для изменения
- `src/main.tsx` — routing fixes
- `src/components/dashboard-v2/layout/DashboardSidebar.tsx` — zone-analytics item + leads
- `src/components/dashboard-v2/layout/DashboardBottomNav.tsx` — leads + icon fix
- `src/components/dashboard-v2/screens/LeadsScreen.tsx` — query fix

