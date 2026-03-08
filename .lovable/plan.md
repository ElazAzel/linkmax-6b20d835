

## Анализ паттернов ЦА и план доработок

### Паттерны целевой аудитории

LinkMAX ориентирован на 3 сегмента микро-бизнеса (бьюти-мастера, эксперты/коучи, малый бизнес). Общие паттерны:
1. **Быстрый отклик на заявку** — все сегменты получают лиды через формы и нуждаются в мгновенной реакции
2. **Мобильность** — работают с телефона, управляют бизнесом на ходу
3. **Простая аналитика** — нужна понятная метрика "откуда пришли → сколько заявок"
4. **Мультиязычность** — аудитория из СНГ (RU/KZ/UZ) + международная (EN)

### Обнаруженные проблемы

#### A. Захардкоженные русские строки (не локализованы)

**Критические — видны пользователю напрямую:**

1. **`LeadsScreen.tsx`** (строки 93, 96): `"Новый"`, `"В работе"` — без `t()`
2. **`ActivityScreen.tsx`** (строки 53-57): STATUS_CONFIG labels `'Новый'`, `'В работе'`, `'Квалиф.'`, `'Сделка'`, `'Потерян'` — без `t()`
3. **`ActivityScreen.tsx`** (строки 61-65): SOURCE_ICONS labels `'Форма'`, `'Мессенджер'`, `'Вручную'`, `'Просмотр'`, `'Другое'` — без `t()`
4. **`BlockPerformance.tsx`** (строки 24-36): blockTypeLabels целиком на русском — без `t()`
5. **`BlockPerformance.tsx`** (строка 112): `"кликов"`, `"Клики"`, `"CTR"` в tooltip formatter — без `t()`
6. **`TrafficSourcesChart.tsx`** (строки 25-32): `'ВКонтакте'`, `'Яндекс'`, `'Прямой'`, `'Реферал'`, `'Другое'` — без `t()`
7. **`ConversionFunnel.tsx`** (строка 133): `"потерь"`, `"удержание"` — без `t()`
8. **`EventRegistrationsList.tsx`** (строки 68-78): STATUS_CONFIG и TICKET_STATUS_CONFIG labels — без `t()`
9. **`EventsScreen.tsx`** (строка 202): CSV headers `['Имя', 'Email', 'Телефон', 'Статус', 'Дата регистрации']` — без `t()`

#### B. Отсутствующие ключи в `uz.json`

uz.json (5217 строк) vs en.json (5551 строк) — ~334 строки отсутствуют. Необходимо синхронизировать структуру.

#### C. Отсутствующие ЦА-ориентированные фичи

1. **LeadsScreen слишком примитивный** — нет статус-фильтров, нет смены статуса лида, нет действий (позвонить/написать). Бьюти-мастер не может обработать заявку — только посмотреть.
2. **Нет быстрых действий с лидом** — WhatsApp/Telegram/звонок по клику на контакт лида.

### План реализации

#### Task 1: Улучшить LeadsScreen для ЦА
- Добавить фильтр по статусу (Все / Новые / В работе / Завершённые)
- Добавить смену статуса лида через dropdown
- Добавить кнопки быстрого действия (WhatsApp, Telegram, звонок) по данным из form_data
- Добавить экспорт лидов в Excel
- Полностью локализовать через `t()`

#### Task 2: Локализовать все захардкоженные строки
- `ActivityScreen.tsx` — STATUS_CONFIG и SOURCE_ICONS через `t()`
- `BlockPerformance.tsx` — blockTypeLabels и tooltip через `t()`
- `TrafficSourcesChart.tsx` — sourceConfig labels через `t()`
- `ConversionFunnel.tsx` — dropOff labels через `t()`
- `EventRegistrationsList.tsx` — STATUS_CONFIG и TICKET_STATUS_CONFIG через `t()`
- `EventsScreen.tsx` — CSV headers через `t()`

#### Task 3: Синхронизировать все 4 локали (ru, en, kk, uz)
- Добавить все отсутствующие ключи для новых строк в `en.json`, `ru.json`, `kk.json`, `uz.json`
- Добавить новые ключи: `dashboard.leads.status.*`, `dashboard.leads.actions.*`, `analytics.blocks.types.*`, `analytics.traffic.sources.*`, `crm.status.*`, `crm.source.*`, `events.registration.status.*`
- Синхронизировать недостающие ключи в uz.json с en.json

### Файлы для изменения
- `src/components/dashboard-v2/screens/LeadsScreen.tsx` — полная переработка
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — локализация
- `src/components/dashboard-v2/analytics/BlockPerformance.tsx` — локализация
- `src/components/dashboard-v2/analytics/TrafficSourcesChart.tsx` — локализация
- `src/components/dashboard-v2/analytics/ConversionFunnel.tsx` — локализация
- `src/components/crm/EventRegistrationsList.tsx` — локализация
- `src/components/dashboard-v2/screens/EventsScreen.tsx` — локализация CSV
- `src/i18n/locales/en.json` — новые ключи
- `src/i18n/locales/ru.json` — новые ключи
- `src/i18n/locales/kk.json` — новые ключи
- `src/i18n/locales/uz.json` — новые ключи + синхронизация

