# Полный аудит: Организации и Бизнес-зоны

**Дата:** 28 февраля 2026  
**Область:** Организации (Organizations), Команды/Коллаборации (Teams/Collaborations), Бизнес-зоны (Business Zones)

---

## Оглавление

1. [Организации (Organizations)](#1-организации-organizations)
2. [Команды и коллаборации (Teams / Collaborations)](#2-команды-и-коллаборации-teams--collaborations)
3. [Бизнес-зоны (Business Zones)](#3-бизнес-зоны-business-zones)
4. [Сводные проблемы и рекомендации](#4-сводные-проблемы-и-рекомендации)

---

## 1. Организации (Organizations)

### 1.1 Назначение

**Organizations** — сущности для группировки страниц и доступа по ролям (owner / admin / editor / viewer). При первом входе пользователю создаётся «Personal Organization»; можно создавать дополнительные организации («команды» в UI) и приглашать участников.

### 1.2 База данных

| Таблица | Назначение |
|--------|------------|
| `organizations` | id, name, slug (nullable), owner_id, created_at |
| `organization_members` | id, org_id, user_id, role (owner \| admin \| editor \| viewer), created_at |

**Миграции:**  
- `20260226000000_team_collaboration.sql` — создание таблиц, триггер создания Personal Organization при регистрации, добавление `organization_id` в `pages`.  
- `20260226182719_*.sql` — RLS для organizations и organization_members.  
- `20260226183014_*.sql` — исправление рекурсии в RLS через функцию `get_user_org_ids`.  
- `20260226193326_*.sql` — RPC `upsert_user_page` с поддержкой `p_organization_id`.

**RLS (кратко):**

- Organizations: просмотр — по членству (`get_user_org_ids`); создание — owner_id = auth.uid(); обновление — только owner.
- Organization members: просмотр — свой user_id или член той же org; изменение — только owner организации.

### 1.3 Сервисы и хуки

| Файл | Назначение |
|------|------------|
| `src/services/organizations.ts` | getMyOrganizations, getOrganizationMembers, createOrganization, inviteMember (по email без таблицы приглашений) |
| `src/hooks/useOrganizations.ts` | Список организаций, currentOrg, выбор из localStorage (last_org_id), switchOrganization, refreshOrganizations |

### 1.4 UI и интеграция

| Компонент | Где используется | Назначение |
|-----------|------------------|------------|
| `OrganizationSwitcher` | `DashboardSidebar` | Переключение организации, создание новой («Создать команду») |
| `TeamManagementScreen` | Dashboard, вкладка «team» | Участники текущей организации, приглашение по email, выбор роли |

**Роутинг:** `/dashboard/team` → Dashboard с активной вкладкой `team` → `TeamManagementScreen`.

### 1.5 Связь с страницами (Pages)

- В `pages` есть поле `organization_id` (nullable).
- При сохранении страницы в `SupabasePageRepository.savePage()` и в `services/pages.ts` в RPC `upsert_user_page` передаётся `p_organization_id: pageData.organization_id || null`.
- **Критично:** в `useMultiPage` список страниц загружается только по `user_id`:

```ts
.eq('user_id', user.id)
```

Фильтрация по `currentOrg` (organization_id) **не выполняется**. Поэтому при переключении организации в сайдбаре список страниц не меняется — показываются все страницы пользователя независимо от организации.  
RLS на `pages` разрешает просмотр страниц по членству в организации, но клиент не ограничивает выборку по выбранной организации.

### 1.6 Пробелы и риски (Organizations)

| # | Проблема | Серьёзность |
|---|----------|-------------|
| 1 | Список страниц в дашборде не фильтруется по выбранной организации | **HIGH** |
| 2 | Нет таблицы приглашений: inviteMember ищет пользователя по email в `user_profiles` и сразу добавляет в `organization_members`; нет email-инвайтов, токенов, срока действия | **MEDIUM** |
| 3 | `organizations.slug` в коде не используется (nullable, нигде не задаётся при создании) | LOW |
| 4 | В сервисе используется `(supabase as any)` — нет типизации таблиц organizations / organization_members в типах Supabase | LOW |
| 5 | Нет проверки роли при invite (любой участник с доступом к экрану может вызвать invite; RLS ограничивает только владельца) | MEDIUM (если экран доступен не только owner/admin) |

---

## 2. Команды и коллаборации (Teams / Collaborations)

### 2.1 Различие сущностей

- **Organizations** — привязка страниц к «организации», роли, управление участниками в дашборде (Team Management). Используются для мультитенантности страниц.
- **Teams** — отдельная модель: команды с slug, описанием, нишей, invite_code; участники в `team_members`; используются для коллабов, взаимного пиара, шаут-аутов.
- **Collaborations** — запросы на коллаборацию между двумя пользователями (requester ↔ target), привязка к страницам (requester_page_id, target_page_id), статус pending/accepted/rejected, collab_slug.

То есть: Organizations = «команда» в контексте владения страницами; Teams = команда в контексте соц. функций и инвайтов по коду.

### 2.2 База данных (Teams / Collaborations)

| Таблица | Назначение |
|--------|------------|
| `teams` | id, name, description, avatar_url, slug, owner_id, niche, is_public, invite_code, created_at |
| `team_members` | id, team_id, user_id, role, joined_at |
| `collaborations` | id, requester_id, target_id, requester_page_id, target_page_id, status, message, collab_slug, block_settings (json), created_at, updated_at |
| `shoutouts` | id, from_user_id, to_user_id, message, is_featured, created_at |

**RLS:**  
- Teams: просмотр по is_public или owner_id; создание/обновление/удаление — owner.  
- Доп. политика: просмотр по invite_code убран, поиск по коду только через SECURITY DEFINER RPC `get_team_by_invite_code`.  
- Team members: просмотр по членству/публичности команды; управление — owner; пользователь может удалить себя (leave).  
- Collaborations: доступ по requester_id или target_id.

### 2.3 Сервисы

| Файл | Функции |
|------|---------|
| `src/services/collaboration.ts` | sendCollabRequest, getMyCollaborations, respondToCollab, deleteCollab; createTeam, getMyTeams, getTeamWithMembers, inviteToTeam, leaveTeam, deleteTeam, removeMemberFromTeam, generateTeamInviteCode, resetTeamInviteCode, joinTeamByInviteCode, getTeamByInviteCode; createShoutout, getMyShoutouts, getShoutoutsForUser, deleteShoutout; searchUsers, getUsersByNiche |

Уведомления:  
- Коллабы: Edge Function `send-collab-notification` (Telegram: request / accepted / rejected).  
- Команды: Edge Function `send-team-notification` (invited / joined / removed и т.д.).

### 2.4 Хуки и UI

| Хук/компонент | Назначение |
|---------------|------------|
| `useCollaboration(userId)` | teams, shoutouts, pendingRequests, activeCollabs, sendRequest, respondRequest, removeCollab, createNewTeam, leaveTeam, addShoutout, removeShoutout, refresh |
| `CollaborationPanel` | Вкладки: Коллабы, Взаимный пиар, Шаут-ауты, Команды; использование invite code и joinTeamByInviteCode |
| `TeamsTab`, `CollabsTab`, `ShoutoutsTab`, `PromoTab` | UI для соответствующих разделов |
| `TeamEditor`, `TeamMembersList`, `UserSearch`, `UserSearchResults` | Редактирование команды, участники, поиск пользователей |

### 2.5 Роуты и страницы

- `/team/:slug` — публичная страница команды (`TeamPage`).
- `/collab/:collabSlug` — страница коллаба (`CollabPage`).
- `/join-team` — страница входа по инвайт-коду (`JoinTeam`).
- `AcceptInvite` — приём приглашений (в т.ч. по ссылке).

### 2.6 Пробелы и риски (Teams / Collaborations)

| # | Проблема | Серьёзность |
|---|----------|-------------|
| 1 | Дублирование концепции «команды» в UI: OrganizationSwitcher называет организации «командами», при этом отдельно есть Teams для коллабов — возможна путаница у пользователей | **MEDIUM** |
| 2 | inviteToTeam принимает `userId` — приглашение только уже зарегистрированных; нет email-инвайтов для Teams (аналогично Organizations) | MEDIUM |
| 3 | searchUsers по username/display_name без ограничения по индексу/лимиту в запросе — при большом числе пользователей возможны тяжёлые запросы | LOW |

---

## 3. Бизнес-зоны (Business Zones)

### 3.1 Назначение

**Бизнес-зоны** — полноценный CRM внутри платформы: зона с участниками (owner/admin/member/viewer), контакты, сделки (Kanban по стадиям), задачи, входящие (чаты/конверсии), счета, подписки и тарифы (по планам), аудит-лог.

### 3.2 База данных

| Таблица | Назначение |
|--------|------------|
| `zones` | id, name, slug, logo_url, owner_user_id, plan_code, plan_cycle, plan_status, current_period_*, grace_period_end, created_at, updated_at |
| `zone_members` | id, zone_id, user_id, role (owner \| admin \| member \| viewer), status (active \| suspended), joined_at |
| `zone_invites` | id, zone_id, email, role, token, status (pending \| accepted \| expired \| revoked), expires_at, created_by, created_at |
| `zone_contacts` | id, zone_id, name, phone, email, telegram_*, tags, owner_user_id, created_at, updated_at |
| `zone_deal_stages` | id, zone_id, name, color, order_index, is_default |
| `zone_deals` | id, zone_id, contact_id, title, stage_id, value_amount, currency, next_step, next_step_at, assigned_to, status (open \| won \| lost), lost_reason, source, created_at, updated_at |
| `zone_deal_activities` | id, deal_id, zone_id, type, summary, happened_at, created_by, created_at |
| `zone_tasks` | id, zone_id, title, description, status (todo \| in_progress \| done \| cancelled), priority, assigned_to, created_by, due_date, completed_at, deal_id, contact_id, created_at, updated_at |
| `zone_invoices` | id, zone_id, deal_id, contact_id, amount, currency, description, status, robokassa_invoice_id, pay_url, created_at, paid_at |
| `zone_subscriptions` | id, zone_id, plan_code, plan_cycle, status, current_period_end и т.д. |
| `zone_conversations` | id, zone_id, contact_id, channel, external_chat_id, title, status, assigned_to, last_message_at, created_at, updated_at |
| `zone_messages` | id, conversation_id, zone_id, direction, sender_type, sender_id, body, metadata, created_at |
| `zone_audit_log` | id, zone_id, actor_user_id, action, entity_type, entity_id, ... |

Доступ к данным зоны унифицирован через функции `is_zone_member(p_zone_id, p_user_id)` и `is_zone_admin(...)`. RLS для всех перечисленных таблиц зоны привязан к ним.

Создание зоны: RPC `create_zone(p_name, p_slug, p_plan_code, p_plan_cycle)` — создаёт zone, добавляет владельца в zone_members, создаёт дефолтные стадии сделок, запись в zone_subscriptions и zone_audit_log.

### 3.3 Типы и константы

| Файл | Содержимое |
|------|------------|
| `src/types/zones.ts` | ZonePlan, ZONE_PLANS, PlanCycle, Zone, ZoneMember, ZoneInvite, ZoneContact, ZoneDealStage, ZoneDeal, ZoneDealActivity, ZoneInvoice, ZoneContextValue и др. |

### 3.4 Контекст и провайдер

- `ZoneContext` / `ZoneProvider` — обёртка только вокруг дерева Dashboard (в `DashboardV2.tsx`), не на уровне всего приложения.
- `useZones()` (в контексте): загрузка зон пользователя, currentZoneId, currentZone, members, myRole, isReadOnly (grace/locked), createZone, refetch.
- Переключение зоны: `ZoneSwitcherSlot` (сайдбар) использует `useZoneContext()` и отображает ZoneSwitcher.

### 3.5 Хуки по сущностям зоны

| Хук | Таблицы / RPC | Назначение |
|-----|----------------|------------|
| `useZones` | zones, zone_members (+ user_profiles) | Список зон, текущая зона, участники, роль, создание зоны |
| `useZoneDeals` | zone_deals, zone_deal_stages, zone_deal_activities | Сделки, стадии, создание/обновление/перенос по стадиям, активность |
| `useZoneContacts` | zone_contacts | Контакты, CRUD |
| `useZoneTasks` | zone_tasks | Задачи, CRUD, статусы, приоритеты |
| `useZoneInbox` | zone_conversations, zone_messages | Конверсии, сообщения (в т.ч. realtime) |
| `useZoneInvoices` | zone_invoices | Счета, создание, обновление статуса |
| `useZoneAutomations` | (логика автоматизаций по зоне) | Автоматизации по зоне |

### 3.6 Экраны и навигация

В dashboard доступны вкладки: zone-dashboard, zone-deals, zone-contacts, zone-inbox, zone-tasks, zone-automations, zone-invoices, zone-settings.  
Роуты: `/dashboard/zone-dashboard`, `/dashboard/zone-deals`, …  
Каждый экран рендерится через обёртки в `ZoneWrappers.tsx` (ZoneDashboardWrapper, ZoneDealsScreenWrapper и т.д.), которые берут currentZoneId из ZoneContext и показывают заглушку «Выберите или создайте зону», если зона не выбрана.

Компоненты:  
- ZoneDealsScreen, DealKanbanColumn, DealCard, DealDetailSheet  
- ZoneContactsScreen, ContactDetailSheet, ContactImportDialog  
- ZoneTasksScreen, TaskKanbanColumn, TaskCard, TaskDetailSheet  
- ZoneInboxScreen, ZoneDashboard, ZoneSettingsScreen, ZoneAutomationsScreen, ZoneInvoicesScreen  

### 3.7 Edge Functions и интеграции

- Отдельных Edge Functions специально для зон (например, создание сделки/контакта) в перечне не найдено; создание зоны и обновление данных идут через Supabase client и RLS.
- Интеграция оплаты (Robokassa) для zone_invoices может быть в других функциях (по pay_url, robokassa_invoice_id).

### 3.8 Пробелы и риски (Business Zones)

| # | Проблема | Серьёзность |
|---|----------|-------------|
| 1 | В `useZones` fetchZones в зависимостях useCallback указан currentZoneId — при смене зоны возможен лишний refetch и сброс выбора; логика «auto-select first zone» завязана на currentZoneId | LOW |
| 2 | Хардкод дефолтных стадий сделок на русском в RPC create_zone («Новый», «В работе» и т.д.) — при мультиязычности нужно выносить в конфиг или i18n | MEDIUM |
| 3 | ZoneProvider только внутри Dashboard — если позже появятся страницы/роуты зон вне дашборда, контекст там недоступен | LOW |
| 4 | В типах zones есть ZoneInvoice, но в БД zone_invoices может отличаться полями (например robokassa_invoice_id) — стоит сверить с актуальной миграцией | LOW |

---

## 4. Сводные проблемы и рекомендации

### 4.1 Критичные / High

1. **Список страниц не фильтруется по организации**  
   - В `useMultiPage` при загрузке страниц использовать выбранную организацию (например из `useOrganizations().currentOrg`):  
     - либо фильтр по `organization_id` при выборе не-Personal организации,  
     - либо единый запрос с учётом RLS и отображение только страниц текущей организации.  
   - При создании страницы передавать в `pageData.organization_id` текущую организацию (если продукт подразумевает привязку страницы к организации).

### 4.2 Средние (Medium)

2. **Организации: приглашения**  
   - Ввести таблицу приглашений в организацию (email, token, expiry, role) и flow: создание инвайта → отправка письма/ссылки → принятие по токену с созданием organization_member.

3. **Организации: типизация**  
   - Добавить таблицы `organizations` и `organization_members` в генерацию типов Supabase и убрать `(supabase as any)` в `organizations.ts`.

4. **Организации vs команды в UI**  
   - Чётко развести в копирайте и навигации: «Организация» (для страниц и доступа) и «Команда» (для коллабов и инвайт-кодов), либо объединить концепцию в одну с разными режимами и задокументировать.

5. **Зоны: дефолтные стадии сделок**  
   - Вынести названия стадий из RPC create_zone в конфиг/миграцию с возможностью i18n или задавать по умолчанию из локали при создании зоны.

### 4.3 Низкие (Low)

6. **Organizations.slug** — использовать при создании (уникальный slug из name) или явно пометить как неиспользуемый.  
7. **useZones** — убрать currentZoneId из зависимостей fetchZones, если не нужен для логики, чтобы избежать лишних refetch.  
8. **Зоны: ZoneProvider** — при появлении роутов зон вне дашборда поднять ZoneProvider выше или дублировать контекст на этих роутах.

### 4.4 Зависимости между документами

- Текущее состояние платформы: [PLATFORM_SNAPSHOT.md](PLATFORM_SNAPSHOT.md).  
- Схема БД и RLS: [../implementation/DATABASE_SCHEMA_GUIDE.md](../implementation/DATABASE_SCHEMA_GUIDE.md) (при наличии раздела по organizations/zones).  
- Операционное руководство: [../operations/6_OPERATIONAL_HANDBOOK.md](../operations/6_OPERATIONAL_HANDBOOK.md).

---

*Аудит выполнен по коду и миграциям репозитория inkmax (lnkmx).*
