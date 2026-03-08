

# CRM-Light & Post-Publish Conversion Workflow

## Вердикт текущего состояния

**Activation 2.0 решил:** путь signup → publish → first visitor → first response отслеживается и подсвечен. HomeScreen динамически реагирует на состояние.

**Главный пост-активационный риск:** после первого лида пользователь попадает в ActivityScreen, где:
- Лиды, бронирования и регистрации на события живут в **разных системах** без единого потока
- Нет индикации urgency (новый лид = тот же UI что и старый)
- Нет follow-up системы (нет reminders, нет aging, нет "ты не ответил")
- HomeScreen после activation celebration возвращается к тому же виду — нет "operator mode"
- BookingsPanel — отдельный tab внутри ActivityScreen (Sheet), не интегрирован в основной поток
- EventRegistrations вообще отдельный экран, не видный из главного inbox

**Где теряется лид:** новый лид появляется → пользователь не видит push/badge → открывает dashboard через часы → лид уже "остыл" → нет one-tap действия для ответа

---

## План реализации (P0 — эта итерация)

### Task 1: Unified Activity Feed на HomeScreen (operator mode)

**Файл:** `src/components/dashboard-v2/screens/HomeScreen.tsx`

После завершения activation checklist (или dismiss), вместо пустого места показать **Operator Widget** — последние 3-5 входящих (leads + bookings), с badge count и quick actions.

Конкретно:
- Новый компонент `IncomingWidget` между page card и quick actions
- Показывает: имя, тип (лид/бронь/регистрация), время, one-tap WhatsApp/Telegram
- Badge на иконке Activity в навигации с количеством `status=new` лидов + `status=pending` bookings
- Если нет входящих — показать empty state "Поделитесь страницей, чтобы получить первые заявки"

**Файлы:**
- `src/components/dashboard-v2/screens/HomeScreen.tsx` — добавить IncomingWidget
- `src/components/dashboard-v2/widgets/IncomingWidget.tsx` — **создать**
- `src/components/dashboard-v2/layout/DashboardNavigation.tsx` (или аналог) — badge на Activity tab

### Task 2: Response Time Indicator на Lead Cards

**Файл:** `src/components/dashboard-v2/screens/ActivityScreen.tsx`

На каждой lead card показать время с момента создания для `status=new`:
- < 5 min: зелёный "только что"
- 5-60 min: жёлтый "X мин назад"  
- > 1h: красный "X ч назад — ответьте!"
- > 24h: серый "пропущено"

Добавить в LeadCard компонент `ResponseTimeTag`.

**Файлы:**
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — LeadCard update
- `src/components/crm/ResponseTimeTag.tsx` — **создать**

### Task 3: One-Tap Quick Reply на Lead Cards

**Файл:** `src/components/dashboard-v2/screens/ActivityScreen.tsx`

Для `status=new` лидов показать inline quick actions прямо на карточке (без открытия details):
- WhatsApp (если phone) — с pre-filled "Здравствуйте, {name}! Спасибо за заявку..."
- Telegram (если phone)
- Позвонить (если phone)
- Email (если email)
- "Отметить как обработано" → status = contacted (one tap)

При нажатии WhatsApp/Telegram — auto-change status to `contacted`.

**Файлы:**
- `src/components/dashboard-v2/screens/ActivityScreen.tsx`
- `src/hooks/crm/useLeads.ts` — добавить `quickReply` method (update status + track event)

### Task 4: Bookings Integration в Activity Feed

Сейчас bookings показываются в отдельном tab внутри ActivityScreen. Нужно:
- В основном feed (tab "Заявки") показывать также **pending bookings** как карточки рядом с лидами, отсортированные по дате
- Отдельный booking card с: имя, дата/время, confirm/cancel quick actions
- Tab "Записи" оставить для полного списка

**Файлы:**
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — merge bookings into unified feed
- `src/components/crm/BookingCard.tsx` — **создать** компактный booking card для feed

### Task 5: Lead Aging & Stale Alerts

**Файл:** `src/hooks/crm/useLeadAging.ts` — **создать**

Хук для определения "остывших" лидов:
- `new` + > 4h = `stale` (показать предупреждение)
- `new` + > 24h = `missed` (показать alert)
- `contacted` + > 3 days без interaction = `needs_followup`

На HomeScreen IncomingWidget показать count stale лидов с красным badge.

**Файлы:**
- `src/hooks/crm/useLeadAging.ts` — **создать**
- Интеграция в IncomingWidget и ActivityScreen

### Task 6: Post-Activation Events Tracking

**Файл:** `src/lib/activation-events.ts` — расширить

Добавить CRM-layer события:
- `lead_seen` — пользователь открыл lead details
- `lead_replied` — нажал WhatsApp/Telegram/call
- `lead_status_changed` — изменил статус
- `booking_confirmed` — подтвердил бронирование
- `first_lead_reply` — первый ответ на лид (milestone)
- `lead_stale_24h` — лид не обработан 24ч

**Файлы:**
- `src/lib/activation-events.ts`
- Вызовы из ActivityScreen, LeadDetails, BookingsPanel

### Task 7: i18n для новых компонентов

Добавить ключи в ru/en/kk:
- `crm.responseTime.*` (justNow, minutesAgo, hoursAgo, missed)
- `crm.quickReply.*` (template messages)
- `home.incoming.*` (widget titles, empty states)
- `crm.aging.*` (stale, needsFollowup)

**Файлы:**
- `src/i18n/locales/ru.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/kk.json`

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/dashboard-v2/widgets/IncomingWidget.tsx` | **Создать** — unified incoming feed на HomeScreen |
| `src/components/crm/ResponseTimeTag.tsx` | **Создать** — urgency indicator |
| `src/components/crm/BookingCard.tsx` | **Создать** — compact booking card для feed |
| `src/hooks/crm/useLeadAging.ts` | **Создать** — stale/missed lead detection |
| `src/components/dashboard-v2/screens/HomeScreen.tsx` | Добавить IncomingWidget после activation |
| `src/components/dashboard-v2/screens/ActivityScreen.tsx` | Quick reply, response time, unified feed |
| `src/hooks/crm/useLeads.ts` | Добавить quickReply method |
| `src/lib/activation-events.ts` | CRM events |
| `src/i18n/locales/ru.json` | Новые ключи |
| `src/i18n/locales/en.json` | Новые ключи |
| `src/i18n/locales/kk.json` | Новые ключи |

## Что НЕ делаем сейчас

- Не добавляем follow-up reminders / snooze (P1)
- Не мержим с Zone CRM (это enterprise layer, отдельный контекст)
- Не добавляем email/push notifications (P1)
- Не строим pipeline/kanban view (это Zone Deals)
- Не добавляем AI-suggested replies (P2)

## Ожидаемый результат

- После activation пользователь видит входящие прямо на HomeScreen
- Каждый новый лид имеет urgency cue и one-tap reply
- Bookings видны в основном потоке рядом с лидами
- "Остывшие" лиды подсвечены
- Серверные события позволяют измерить time-to-first-reply

