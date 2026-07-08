# Активный реестр кайдзен-улучшений LinkMAX

> **Статус:** Active Draft
> **Старт цикла:** 24 апреля 2026
> **Цикл:** KZN Cycle 01 / первые 2 недели
> **Основа:** `KAIZEN_SYSTEM_PROJECT_DESCRIPTION.md` и `KAIZEN_IMPROVEMENT_ROADMAP.md`
> **Фокус цикла:** запустить систему управления улучшениями, назначить ownership, снять baseline по основному пути пользователя

---

## 1. Как использовать реестр

Этот файл является рабочей доской кайдзен-цикла. В него попадают только улучшения, которые имеют поток, владельца, метрику эффекта и следующий шаг. Реестр не заменяет roadmap: roadmap задает направление на 18 недель, а этот файл показывает, что реально находится в работе сейчас.

Правило попадания в активный цикл:

```text
Проблема -> Поток -> Владелец -> KPI -> Следующий шаг -> Проверка эффекта
```

Если улучшение не влияет на Time to Value, activation, lead/booking value, reliability/security или monetization, оно не занимает слот активного цикла.

---

## 2. Ownership по потокам

На старте ownership фиксируется по ролям. Имена конкретных ответственных назначаются внутри команды перед первым weekly kaizen review.

| Поток | Owner role | Decision rights | Основной KPI | Review cadence |
| :--- | :--- | :--- | :--- | :--- |
| Kaizen Ops | Product/Founder owner | Приоритизация улучшений, review-ритм, правила Done. | Delivery cycle time | Weekly |
| Activation / Onboarding | Growth owner | Wizard, niche presets, first publish journey. | Publish rate, Time to Value | Weekly |
| Editor / Blocks | Engineering owner | Block architecture, editor speed, renderer parity. | Editor quality, Time to Value | Weekly |
| CRM / Business Zones | CRM/Operations owner | Lead handling, statuses, fast actions, Telegram actions. | CRM response time | Weekly |
| Booking / Payments | CRM/Operations owner + Security/Data owner | Booking/payment statuses, invoices, transactional integrity. | Payment success rate, booking completion | Biweekly |
| Analytics / Growth | Growth owner + Engineering owner | Funnel events, dashboards, event quality. | Lead/booking rate, publish rate | Weekly |
| SEO / AEO / Public Pages | Growth owner + Engineering owner | Metadata, structured data, SSR/bot rendering, Web Vitals. | Web Vitals, indexed public pages | Biweekly |
| Security / Privacy | Security/Data owner | RLS, public flows, tenant isolation, GDPR safety. | Security findings before production | Weekly for active data changes |
| Release Quality | Engineering owner | Quality gates, regression prevention, Sentry recurring issues. | Sentry error rate, regression count | Weekly |

---

## 3. Active KPI baseline tracker

Baseline снимается в Cycle 01. Если автоматической метрики пока нет, владелец фиксирует ручной baseline и отдельно решает, нужно ли инструментирование.

| KPI | Baseline status | Source / method | Owner role | First action |
| :--- | :--- | :--- | :--- | :--- |
| Publish rate | Needs baseline | `auth:auth_success` plus `activation:page_published` / `activation:funnel_step_publish_completed`. | Growth owner | Сверить связку signup-session -> page publish и определить период baseline. |
| Time to Value | Needs baseline | `auth:auth_success`, `activation:wizard_completed`, `activation:page_published`, page timestamps. | Growth owner + Engineering owner | Проверить, достаточно ли timestamp-событий для расчета signup -> first publish with CTA. |
| Lead/booking rate | Needs baseline | `leads`, `bookings`, `activation:first_lead_captured`, `activation:funnel_step_first_lead_completed`. | Growth owner | Сопоставить опубликованные страницы с leads/bookings за один период. |
| CRM response time | Needs baseline | Lead/booking `created_at` plus `activation:lead_seen`, `activation:lead_replied`, `activation:first_lead_reply`, `activation:lead_status_changed`. | CRM/Operations owner | Зафиксировать first response как first `lead_seen`, `lead_replied` или status change. |
| Sentry error rate | Needs baseline | Sentry issues in onboarding, editor, CRM, public pages. | Engineering owner | Выделить recurring issues по core flows. |
| Web Vitals | Needs baseline | Web Vitals / public page performance checks. | Engineering owner | Снять FCP/LCP для публичной страницы и editor preview. |
| Payment success rate | Needs baseline | Payment attempts plus `activation:booking_prepayment_initiated`, `activation:booking_payment_confirmed`, invoice/payment terminal states. | CRM/Operations owner + Security/Data owner | Проверить, какие статусы платежей считаются terminal states. |

### 3.1 Найденные источники событий в коде

| Источник | Где найден | Что покрывает |
| :--- | :--- | :--- |
| `src/services/authFunnel.ts` | `auth:*` events in `analytics` table | Signup/auth funnel: form view, submit attempt, success, errors, OAuth clicks. |
| `src/lib/activation-events.ts` | `activation:*` events in `analytics` table | Wizard milestones, page publish/share, first lead, CRM actions, booking funnel, retention events. |
| `src/lib/editor/editor-analytics.ts` | `editor:*` events in `analytics` table | Block/editor friction: block added, inline edit, command palette, validation errors, autosave/history. |
| `src/hooks/analytics/useFunnelAnalytics.ts` | `analytics`, `leads`, `bookings` | Page views/clicks/shares plus leads/bookings conversion. |
| `src/components/dashboard-v2/widgets/ConversionFunnelWidget.tsx` | `activation:funnel_step_*` counts | Activation dashboard steps: create page, add block, publish, first lead. |

### 3.2 Рабочие артефакты Cycle 01

| Артефакт | Закрывает | Назначение |
| :--- | :--- | :--- |
| `KAIZEN_BASELINE_QUERIES.sql` | KZN-003 | Read-only SQL для снятия baseline по auth, activation, publish, lead/booking, CRM response и editor friction. |
| `BLOCK_FEATURE_CHECKLIST.md` | KZN-007 | Acceptance checklist для block/editor changes. |
| `RLS_PUBLIC_FLOW_CHECKLIST.md` | KZN-018 | Security checklist для public/data/payment flows. |
| `RELIABILITY_REPEAT_BUG_PLAYBOOK.md` | KZN-017 | Правило обработки повторяющихся bugs/Sentry issues. |
| `RELEASE_QUALITY_CHECKLIST.md` | KZN-019 | Минимальный release gate для core flows. |

---

## 4. Активный цикл KZN Cycle 01

| ID | Поток | Приоритет | Статус | Улучшение | KPI | Владелец | Следующий шаг |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| KZN-001 | Kaizen Ops | P0 | Implemented baseline | Завести единый реестр улучшений по потокам. | Delivery cycle time | Product/Founder owner | Использовать этот файл как active register для первого weekly review. |
| KZN-002 | Kaizen Ops | P0 | In progress | Назначить владельцев потоков и decision rights. | Delivery cycle time | Product/Founder owner | Подтвердить реальные имена владельцев для ролей из раздела 2. |
| KZN-003 | Metrics | P0 | Implemented baseline | Зафиксировать baseline по пути signup -> publish -> lead/booking -> CRM. | 7 active KPI | Growth owner + Engineering owner | Запустить `KAIZEN_BASELINE_QUERIES.sql`, проверить wizard/CRM events и заполнить фактические значения. |
| KZN-004 | Onboarding | P0 | Implemented measurement step | Сократить первый запуск для экспертов/консультантов. | Publish rate, Time to Value | Growth owner | AI Builder теперь пишет start/niche/completed events; после baseline выбрать один узкий шаг wizard для упрощения. |
| KZN-010 | CRM | P0 | Implemented platform step | Ускорить обработку lead через быстрые действия. | CRM response time | CRM/Operations owner | Быстрое действие reply теперь пишет reply event, переводит только новый лид в `contacted` и не даунгрейдит поздние статусы. |
| KZN-007 | Editor | P0 | Implemented baseline | Ввести обязательный block feature checklist. | Editor quality | Engineering owner | Использовать `BLOCK_FEATURE_CHECKLIST.md` для future block work. |
| KZN-018 | Security | P0 | Implemented baseline | Ввести RLS/public flow checklist до реализации data changes. | Security findings before production | Security/Data owner | Использовать `RLS_PUBLIC_FLOW_CHECKLIST.md` для leads/bookings/payments/analytics changes. |
| KZN-017 | Reliability | P0 | Implemented baseline | Повторяющиеся bugs -> тест/checklist/правило. | Sentry error rate | Engineering owner | Использовать `RELIABILITY_REPEAT_BUG_PLAYBOOK.md` после повторного дефекта. |
| KZN-019 | Release | P1 | Implemented baseline | Уточнить release quality gates для core flows. | Regression count | Engineering owner | Использовать `RELEASE_QUALITY_CHECKLIST.md` для релизов и hotfix. |

---

## 5. Шаблон карточки улучшения

Используется для каждой новой инициативы, которая входит в активный цикл.

| Поле | Значение |
| :--- | :--- |
| ID | KZN-XXX |
| Поток | Onboarding / Editor / CRM / Booking / Payments / Analytics / SEO / Security / Release |
| Пользовательская боль | Что мешает creator, visitor или команде получить ценность. |
| Бизнес-исход | Publish faster / capture leads / manage clients / accept bookings-payments / grow revenue / safety / speed |
| Baseline | Текущая метрика или наблюдаемый факт. |
| Изменение | Малое действие, которое можно проверить. |
| Owner role | Роль владельца результата. |
| KPI | Метрика эффекта. |
| Security impact | None / public flow / private workspace data / payment data / auth and roles |
| Architecture impact | UI / hooks / services / repositories / domain / edge function / worker / docs only |
| Done | Эффект проверен или назначена дата проверки; стандарт обновлен, если риск повторяется. |

---

## 6. Baseline checklist для основного пути

Основной путь для первого цикла:

```text
Signup -> AI Onboarding -> Page Generated -> Customize -> Publish -> Share -> Lead/Booking -> CRM Action
```

### 6.1 Activation baseline

- [ ] Использовать `auth:auth_success` как стартовую точку успешной регистрации.
- [x] Использовать `activation:wizard_started` как событие старта AI onboarding, если page id уже известен.
- [x] Использовать `activation:wizard_completed` как событие завершения AI onboarding.
- [ ] Определить факт генерации страницы.
- [ ] Использовать `activation:page_published` или `activation:funnel_step_publish_completed` как факт первого publish.
- [ ] Определить наличие CTA на опубликованной странице.
- [ ] Посчитать Time to Value от signup до first publish with CTA.

### 6.2 Lead/booking baseline

- [ ] Определить опубликованные страницы за период baseline.
- [ ] Посчитать страницы с хотя бы одним lead.
- [ ] Посчитать страницы с хотя бы одним booking.
- [ ] Сверить conversion events: `activation:first_lead_captured`, `activation:funnel_step_first_lead_completed`, `activation:booking_submitted`.
- [ ] Проверить, что lead/booking связаны с владельцем страницы.
- [ ] Проверить, что public insert flow не ослабляет tenant isolation.

### 6.3 CRM action baseline

- [ ] Считать first response первым событием из набора: `activation:lead_seen`, `activation:lead_replied`, `activation:first_lead_reply`, `activation:lead_status_changed`.
- [ ] Проверить наличие timestamps для lead/booking creation.
- [ ] Проверить наличие timestamps для первого действия владельца.
- [ ] Посчитать median CRM response time.
- [ ] Зафиксировать топ причин задержки ответа.

---

## 7. Weekly review template

| Вопрос | Ответ цикла |
| :--- | :--- |
| Какие 3 улучшения были активными? | KZN-001, KZN-002, KZN-003 на первом цикле. |
| Что изменилось в KPI? | Заполняется после baseline review. |
| Какие потери подтверждены фактами? | Заполняется после анализа основного пути. |
| Какие решения приняты? | Заполняется владельцем цикла. |
| Какой стандарт обновлен? | Реестр, ownership, baseline tracker, checklist или техническое правило. |
| Что идет в следующий цикл? | Одно улучшение onboarding, одно editor/security improvement, одно reliability improvement. |

---

## 8. Done criteria для Cycle 01

Цикл 01 считается закрытым, если:

- active register используется как единая доска улучшений;
- роли владельцев потоков подтверждены командой;
- для 7 активных KPI указан baseline или понятный способ его снять;
- выбран первый конкретный onboarding step для упрощения;
- block feature checklist принят как обязательный для будущих block changes;
- RLS/public flow checklist принят как обязательный для data changes;
- top recurring reliability issue выбран для следующего цикла.

---

## 9. Следующий цикл

Cycle 02 должен перейти от операционной настройки к первому продуктовому улучшению. Рекомендуемый фокус:

1. Упростить один узкий шаг AI onboarding для экспертов/консультантов.
2. Закрепить block feature checklist в acceptance criteria для editor/block задач.
3. Выбрать одну повторяющуюся ошибку из Sentry или regression history и превратить ее в предотвращающий механизм.
