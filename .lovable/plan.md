
# Roadmap: Business Zones -- Gap Analysis vs Bitrix24

## Текущее состояние LinkMAX Business Zones

Реализовано 6 модулей: Deals (Kanban), Contacts (список), Inbox (realtime чат), Tasks (Kanban), Invoices (RoboKassa), Settings (участники, биллинг). Есть RLS, зоны, роли, инвайты, grace-period. Это примерно **25-30% функциональности Bitrix24 Professional** для микро-команд.

---

## Что есть у Bitrix24, чего критически не хватает LinkMAX

Анализ строится от реальных use-cases клиентов (салон красоты, коуч, агентство), а не от полного набора Bitrix24.

### Фаза 1: Deals Pipeline -- доведение до рабочего уровня (P0)

**Текущая проблема**: Deals есть, но нет drag-and-drop между стадиями, нет деталей сделки, нет истории активности в UI.

| Задача | Суть | Effort |
| :--- | :--- | :--- |
| Drag-and-drop Kanban | Использовать уже установленный `@dnd-kit/sortable` для перетаскивания карточек между стадиями | 1 день |
| Deal Detail Sheet | Боковая панель (Sheet) с полной информацией о сделке: контакт, сумма, история активностей, следующий шаг, файлы | 1-2 дня |
| Activity Timeline | Отображение `zone_deal_activities` в UI (таблица уже есть в БД, хук `addActivity` уже написан) | 0.5 дня |
| Won/Lost flow | При перетаскивании на последнюю стадию -- диалог "Выиграна/Проиграна" с причиной | 0.5 дня |
| Фильтры Pipeline | Фильтрация сделок по: ответственный, дата, сумма, просроченные | 0.5 дня |

### Фаза 2: Contacts -- из списка в мини-CRM (P0)

**Текущая проблема**: Контакты -- плоский список без связи с deals/tasks/conversations.

| Задача | Суть | Effort |
| :--- | :--- | :--- |
| Contact Detail Page | Карточка контакта: все сделки, задачи, диалоги, инвойсы этого контакта (JOIN по `contact_id`) | 1 день |
| Contact Edit/Delete | Inline-редактирование и удаление (хуки `updateContact`, `deleteContact` уже есть, UI нет) | 0.5 дня |
| Tags фильтрация | Филтьр по тегам + добавление тегов при создании | 0.5 дня |
| Import CSV | Массовый импорт контактов из CSV/Excel (`exceljs` уже в зависимостях) | 1 день |

### Фаза 3: Tasks -- закрытие пробелов (P1)

**Текущая проблема**: Нет описания задачи, нет привязки к сделке/контакту, нет due_date в UI создания.

| Задача | Суть | Effort |
| :--- | :--- | :--- |
| Task Detail / Edit | Полная форма: описание, due_date, привязка к deal/contact | 0.5 дня |
| Task DnD | Drag-and-drop между колонками (todo/in_progress/done) через `@dnd-kit` | 0.5 дня |
| Overdue highlighting | Визуальная индикация просроченных задач (поле `due_date` есть в БД) | 0.5 дня |
| My Tasks filter | Быстрый фильтр "Мои задачи" / "Все задачи" | 0.5 дня |

### Фаза 4: Аналитика Зоны (P1)

**Bitrix24 Reference**: Dashboard с воронкой продаж и ключевыми метриками.

| Задача | Суть | Effort |
| :--- | :--- | :--- |
| Zone Dashboard | Экран-сводка: кол-во сделок по стадиям, сумма pipeline, won/lost ratio, просроченные задачи, открытые диалоги | 1 день |
| Funnel Chart | Визуализация воронки через `recharts` (уже в зависимостях) | 0.5 дня |
| Period filter | Фильтр по периоду (неделя/месяц/квартал) | 0.5 дня |

### Фаза 5: Автоматизации -- MVP (P2)

**Bitrix24 Reference**: Роботы и триггеры в CRM.

Для LinkMAX достаточно 3-5 базовых триггеров, реализуемых через DB triggers + Edge Functions:

| Триггер | Действие | Реализация |
| :--- | :--- | :--- |
| Сделка перешла на стадию X | Создать задачу ответственному | DB trigger на `zone_deals.stage_id` UPDATE |
| Просрочен `next_step_at` | Уведомление владельцу (запись в `zone_messages`) | Cron Edge Function (ежечасный) |
| Новый контакт создан | Создать сделку в первой стадии | DB trigger на `zone_contacts` INSERT |

**DB schema change**: новая таблица `zone_automations` (zone_id, trigger_type, action_type, config jsonb, is_active).

### Фаза 6: Инвойсы и оплата (P2)

**Текущая проблема**: Таблица `zone_invoices` есть в БД, но UI отсутствует.

| Задача | Суть | Effort |
| :--- | :--- | :--- |
| Invoice List + Create | Экран инвойсов привязанных к сделкам/контактам | 1 день |
| Robokassa payment link | Генерация ссылки на оплату (хук `useRobokassa` уже есть) | 0.5 дня |
| Invoice status tracking | Webhook для обновления статуса оплаты | 1 день |

---

## Что НЕ нужно копировать из Bitrix24

Эти фичи избыточны для микро-бизнеса и противоречат принципу "3 клика":

- Бизнес-процессы (BPMN) -- слишком сложно для целевой аудитории
- Телефония (SIP) -- не релевантно, аудитория в мессенджерах
- HR-модуль -- не тот сегмент
- Документооборот -- микро-бизнес не работает с документами
- Marketing automation (email-рассылки, сегменты) -- преждевременно до 1000+ бизнес-пользователей

---

## Приоритезация (RICE)

| Фаза | Reach | Impact | Confidence | Effort | Score | Приоритет |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1. Deals DnD + Detail | High | High | High | 3d | 90 | **P0** |
| 2. Contact Detail + Edit | High | High | High | 3d | 85 | **P0** |
| 3. Tasks polish | Med | Med | High | 2d | 60 | **P1** |
| 4. Zone Analytics | Med | High | High | 2d | 70 | **P1** |
| 5. Automations MVP | Med | High | Med | 3d | 55 | **P2** |
| 6. Invoices UI | Low | High | High | 2.5d | 45 | **Completed** |

---

## Технический план реализации

### DB миграции (новые таблицы/колонки)

- `zone_automations` (для Фазы 5)
- Остальные таблицы уже существуют и покрывают Фазы 1-4

### Новые файлы

- `src/components/zones/DealDetailSheet.tsx` -- боковая панель сделки
- `src/components/zones/ContactDetailScreen.tsx` -- карточка контакта
- `src/components/zones/ZoneDashboard.tsx` -- аналитика зоны
- `src/components/zones/ZoneInvoicesScreen.tsx` -- инвойсы
- `src/components/zones/ZoneAutomationsScreen.tsx` -- настройка автоматизаций

### Модифицируемые файлы

- `ZoneDealsScreen.tsx` -- DnD, фильтры, won/lost flow
- `ZoneContactsScreen.tsx` -- edit/delete UI, теги, импорт
- `ZoneTasksScreen.tsx` -- DnD, detail form, due_date
- `DashboardSidebar.tsx` -- добавить пункты "Аналитика", "Инвойсы"

### Зависимости

- Все необходимые пакеты уже установлены (`@dnd-kit`, `recharts`, `exceljs`, `date-fns`)
- Новых зависимостей не требуется

---

## Рекомендуемый порядок реализации

1. **Фаза 1** (Deals DnD + Detail) -- немедленно, это ядро CRM
2. **Фаза 2** (Contacts CRM) -- сразу после, связанная логика
3. **Фаза 4** (Analytics) -- даёт видимую ценность Business-подписки
4. **Фаза 3** (Tasks polish) -- параллельно с аналитикой
5. **Фаза 5-6** (Automations + Invoices) -- следующий спринт
