# План будущих улучшений и оптимизаций LinkMAX по кайдзен-системе

> **Статус:** Draft  
> **Дата:** 24 апреля 2026  
> **Горизонт:** 18 недель  
> **Источник правил:** `docs/operations/KAIZEN_SYSTEM_PROJECT_DESCRIPTION.md`  
> **Текущая доска реализации:** `docs/operations/KAIZEN_ACTIVE_REGISTER.md`
> **Фокус:** эксперты и консультанты, mobile-first запуск бизнеса, Time to Value, лиды, бронирования, платежи, надежность

---

## 1. Назначение

Документ переводит кайдзен-систему LinkMAX в практический план будущих улучшений и оптимизаций. Он нужен как рабочая дорожная карта для коротких циклов улучшений: найти потерю, назначить владельца, измерить baseline, внедрить малое изменение, проверить эффект и закрепить стандарт.

Главная логика приоритизации:

```text
Time to Value -> Activation -> Lead/Booking value -> Reliability/Security -> Monetization
```

Каждое улучшение должно поддерживать одно из продуктовых обещаний LinkMAX:

- быстро запустить страницу;
- получить лид или бронь;
- обработать клиента в CRM;
- принять платеж или предоплату;
- увидеть понятную аналитику;
- сохранить безопасность, скорость и premium mobile-first UX.

---

## 2. Управляющие принципы плана

1. **Малые изменения вместо больших реформ.** Каждая инициатива должна быть достаточно маленькой, чтобы ее можно было довести до результата и проверить метрикой.
2. **Без расширения сложности.** Улучшение не должно превращать LinkMAX в тяжелую CRM или enterprise dashboard.
3. **3-click rule для частых действий.** Частые действия creator-пользователя должны быть быстрыми: добавить блок, изменить CTA, опубликовать, ответить на лид, сменить статус.
4. **Core flows остаются deterministic.** AI ускоряет создание контента, но базовые сценарии onboarding, editor, publish, CRM, booking и payments не зависят от нестабильных внешних сервисов.
5. **Security с начала, а не перед релизом.** Любое изменение в leads, bookings, payments, analytics, public insert/read flows и workspace data проходит RLS/security checklist до реализации.
6. **Стандарт обновляется после каждого повторяющегося дефекта.** Если ошибка вернулась второй раз, результатом исправления должен быть тест, checklist, правило или мониторинг.

---

## 3. Активные KPI

На первые 18 недель активными считаются 7 KPI. Остальные метрики используются как supporting signals.

| KPI | Определение | Где применяется | Цель кайдзен-цикла |
| :--- | :--- | :--- | :--- |
| Publish rate | Доля новых signup, дошедших до опубликованной страницы. | Activation, onboarding, AI wizard. | Увеличить долю пользователей, получивших первый ценностный результат. |
| Time to Value | Время от регистрации до опубликованной страницы с рабочим CTA. | Onboarding, presets, editor, publish. | Удерживать обещание запуска бизнеса примерно за 15 минут. |
| Lead/booking rate | Доля опубликованных страниц, получивших lead или booking. | Public pages, blocks, CTA, CRM. | Проверить, что страница работает как бизнес-инструмент. |
| CRM response time | Время от входящего lead/booking до действия пользователя. | CRM, Business Zones, Telegram actions. | Сократить путь от заявки до ответа клиенту. |
| Sentry error rate | Частота ошибок в core flows. | Reliability, release quality. | Уменьшить production-регрессии и повторные дефекты. |
| Web Vitals | FCP, LCP и публичная скорость страниц. | Public pages, editor preview, SEO. | Сохранить ощущение быстрого mobile-first продукта. |
| Payment success rate | Доля успешных оплат/предоплат без ручного обхода. | Payments, invoices, wallet, fintech. | Повысить надежность monetization и доверие пользователя. |

Baseline по каждому KPI фиксируется в первом 0-2 недельном цикле. Если метрика пока не считается автоматически, владелец потока фиксирует ручной baseline и добавляет задачу на инструментирование только там, где она нужна для принятия решения.

---

## 4. Дорожная карта на 18 недель

| Период | Фокус | Что делаем | Ожидаемый результат |
| :--- | :--- | :--- | :--- |
| 0-2 недели | Базовая система управления улучшениями | Завести реестр, назначить владельцев потоков, выбрать KPI, снять baseline по пути signup -> publish -> lead/booking -> CRM. | Есть единая система работы с улучшениями и понятная стартовая точка. |
| 2-6 недель | Activation и onboarding | Упростить первый запуск для экспертов/консультантов, улучшить niche presets, убрать шаги без вклада в publish или lead. | Выше publish rate, ниже Time to Value, меньше drop-off в AI wizard. |
| 6-10 недель | Editor, blocks, mobile UX | Ввести block checklist, найти расхождения editor/renderer, упростить частые действия редактора под 3-click rule. | Редактор быстрее, стабильнее и проще на мобильном. |
| 10-14 недель | CRM, booking, payments | Ускорить обработку lead/booking, уточнить статусы booking/payment/invoice, проверить transactional integrity. | Пользователь быстрее отвечает клиенту и видит понятные статусы денег/заявок. |
| 14-18 недель | Analytics, SEO/AEO, reliability | Собрать activation dashboard, проверить public pages и Web Vitals, превратить повторяющиеся bugs в тесты/checklists. | Команда видит потери по funnel, public pages индексируются и работают быстрее, повторных ошибок меньше. |

---

## 5. Реестр будущих улучшений

| ID | Поток | Приоритет | Улучшение | Метрика эффекта | Definition of Done |
| :--- | :--- | :--- | :--- | :--- | :--- |
| KZN-001 | Kaizen Ops | P0 | Завести единый реестр улучшений по потокам: onboarding, editor, CRM, booking/payments, analytics, SEO, security, release. | Все активные улучшения имеют поток, владельца, KPI и статус. | Реестр создан, шаблон карточки применен к первым 5-10 инициативам. |
| KZN-002 | Kaizen Ops | P0 | Назначить владельцев потоков и decision rights. | Нет улучшений без владельца. | Для каждого потока указан owner role и зона решения. |
| KZN-003 | Metrics | P0 | Зафиксировать baseline по пути signup -> publish -> lead/booking -> CRM. | Baseline по 5-7 KPI сохранен. | Метрики доступны для еженедельного review, либо есть ручной baseline и владелец инструментирования. |
| KZN-004 | Onboarding | P0 | Сократить первый запуск для экспертов/консультантов до минимального набора действий. | Publish rate, Time to Value. | Убраны или объединены шаги, которые не помогают publish или первому CTA. |
| KZN-005 | Onboarding | P0 | Улучшить niche presets для экспертов/консультантов: структура страницы, CTA, услуги, lead capture. | Publish rate, lead/booking rate. | Preset дает готовую страницу с понятным CTA и минимумом ручной настройки. |
| KZN-006 | AI Wizard | P1 | Сделать AI onboarding ускорителем, а не блокером core flow. | Wizard completion rate, Time to Value. | При сбое AI пользователь может продолжить deterministic flow с preset/default content. |
| KZN-007 | Editor | P0 | Ввести обязательный block feature checklist. | Количество дефектов в block/editor/public renderer. | Checklist покрывает types, registry, renderer, editor UI, translations, analytics, gating, mobile QA. |
| KZN-008 | Editor | P0 | Найти и закрыть повторяющиеся расхождения между editor preview и public renderer. | Editor quality, Sentry issues. | Для каждого найденного расхождения есть root cause и закрепленная проверка. |
| KZN-009 | Editor UX | P1 | Оптимизировать частые действия под 3-click rule: добавить блок, изменить CTA, publish, preview. | Time to Value, task completion time. | Частые действия проходят на mobile без лишних экранов и визуального шума. |
| KZN-010 | CRM | P0 | Добавить или упорядочить быстрые действия для lead/booking: call, email, Telegram, status. | CRM response time. | Пользователь может обработать входящий контакт из одного компактного сценария. |
| KZN-011 | CRM | P1 | Уточнить статусы lead/deal/task, чтобы пользователь видел следующий шаг. | CRM response time, repeated support questions. | Статусы понятны, не дублируются и не требуют знания внутренней логики. |
| KZN-012 | Booking | P0 | Проверить booking statuses и edge cases: pending, confirmed, cancelled, paid, failed. | Booking completion rate, Sentry issues. | Состояния не конфликтуют, есть понятный rollback/fallback для ошибок. |
| KZN-013 | Payments | P0 | Проверить transactional integrity для invoices, payments, wallet и automations. | Payment success rate, incident count. | Нет расхождения между статусом оплаты, invoice и пользовательским UI. |
| KZN-014 | Analytics | P1 | Собрать activation dashboard по ключевому пути пользователя. | Publish rate, Time to Value, lead/booking rate. | Dashboard показывает drop-off до publish, lead/booking и первого CRM action. |
| KZN-015 | Analytics | P1 | Очистить шумные события и оставить события, которые помогают принимать решения. | Доля событий с владельцем и решением. | Каждое активное событие связано с funnel, KPI или продуктовым решением. |
| KZN-016 | SEO/AEO | P1 | Проверить public pages: metadata, JSON-LD, SSR/bot rendering, local SEO/AEO/GEO signals. | Crawlability, Web Vitals, indexed public pages. | Публичные страницы сохраняют structured data, скорость и индексацию. |
| KZN-017 | Reliability | P0 | Превратить повторяющиеся Sentry issues и bugs в тесты, checklist или правило. | Sentry error rate, repeated bug count. | У каждого повторного дефекта есть предотвращающий механизм. |
| KZN-018 | Security | P0 | Ввести RLS/public flow checklist до реализации изменений в данных. | Security findings до production. | Leads, bookings, payments, analytics и public flows проверяются до merge. |
| KZN-019 | Release | P1 | Уточнить release quality gates для core flows. | Regression count, cycle time. | Release checklist покрывает core user path и не создает лишней бюрократии. |
| KZN-020 | Documentation | P2 | Фиксировать короткие internal notes после повторяющихся решений. | Время onboarding новых участников и агентов. | Новые правила не размазаны по чатам, а доступны в docs/operations или ADR. |

---

## 6. Чек-листы по потокам

### 6.1 Activation и onboarding

- [ ] Путь эксперта/консультанта начинается с понятного результата, а не с настроек.
- [ ] Первый CTA создается или предлагается автоматически.
- [ ] Пользователь может опубликовать страницу без глубокого знания редактора.
- [ ] AI помогает, но не блокирует core flow.
- [ ] Drop-off измеряется по ключевым шагам wizard.
- [ ] Empty states ведут к действию, а не объясняют продукт длинным текстом.

### 6.2 Editor и blocks

- [ ] Обновлены block types.
- [ ] Обновлен block registry.
- [ ] Обновлен public renderer.
- [ ] Обновлен editor UI.
- [ ] Проверены translations.
- [ ] Проверены analytics hooks, если блок влияет на события.
- [ ] Проверены premium/free gating и backward compatibility.
- [ ] Проверен mobile layout и touch ergonomics.
- [ ] Core interaction не зависит от AI/token/external unstable service.

### 6.3 CRM, booking, payments

- [ ] У входящего lead/booking есть понятное следующее действие.
- [ ] Статусы не дублируют друг друга и не конфликтуют.
- [ ] Fast actions доступны на mobile.
- [ ] Payment/invoice UI соответствует фактическому состоянию транзакции.
- [ ] Ошибки оплаты имеют понятный fallback.
- [ ] Automations не меняют статус без проверяемого события.
- [ ] Изменения проходят RLS и role boundary проверку.

### 6.4 Analytics и growth

- [ ] Событие связано с funnel, KPI или конкретным решением.
- [ ] Событие не дублирует уже существующее без причины.
- [ ] В dashboard виден drop-off по signup, publish, lead/booking и CRM action.
- [ ] UTM и campaign context не теряются.
- [ ] Шумные события не мешают weekly review.

### 6.5 SEO, AEO и public pages

- [ ] Metadata сохраняются или улучшаются.
- [ ] JSON-LD остается валидным.
- [ ] Cloudflare SSR/bot rendering не ломается.
- [ ] Local SEO/AEO/GEO сигналы сохраняются.
- [ ] Public route performance проверена.
- [ ] CTA, lead capture и booking остаются доступными на mobile.

### 6.6 Security и release quality

- [ ] Supabase не вызывается напрямую из UI без сильной причины.
- [ ] RLS остается главным механизмом tenant isolation.
- [ ] Public insert/read flows проверены отдельно.
- [ ] Secrets и service-role logic не попадают на клиент.
- [ ] TypeScript строгий, без `any`.
- [ ] Clean Architecture границы не нарушены.
- [ ] Повторяющийся bug превращен в тест, checklist, мониторинг или правило.
- [ ] Rollback/fallback понятен для рискованного изменения.

---

## 7. Weekly kaizen review

Еженедельный review должен быть коротким и практичным. В него попадают только активные улучшения, у которых есть владелец, метрика и следующий шаг.

| Вопрос | Ожидаемый ответ |
| :--- | :--- |
| Какая потеря или проблема устранена? | Конкретный поток и пользовательская боль. |
| Какая метрика изменилась или будет проверена? | KPI, baseline, дата проверки. |
| Что было изменено? | Продукт, процесс, checklist, тест, мониторинг или документация. |
| Что закреплено как стандарт? | Правило, checklist, acceptance criteria или автоматическая проверка. |
| Что мешает следующему шагу? | Блокер и владелец решения. |

Если улучшение не связано с KPI или пользовательской ценностью, оно переносится в backlog и не занимает слот active kaizen cycle.

---

## 8. Acceptance criteria для всего 18-недельного цикла

К концу 18 недель план считается выполненным, если:

- есть рабочий реестр улучшений по потокам;
- 5-7 KPI используются в weekly/monthly review;
- baseline по основному пути пользователя зафиксирован;
- первый запуск эксперта/консультанта стал короче или понятнее;
- editor/block изменения проходят единый checklist;
- CRM/booking/payment статусы и быстрые действия стали понятнее на mobile;
- analytics dashboard показывает drop-off до publish, lead/booking и CRM action;
- public pages сохраняют metadata, JSON-LD, SSR/bot rendering и Web Vitals;
- повторяющиеся bugs/Sentry issues превращаются в предотвращающие механизмы;
- ни одно улучшение не ослабило RLS, workspace isolation или Clean Architecture.

---

## 9. Правила изменения API, данных и событий

- Публичные API, схемы БД и типы по умолчанию не меняются в рамках кайдзен-плана.
- Новые analytics events добавляются только если есть владелец решения и понятный KPI.
- Изменения в leads, bookings, payments, analytics и public flows проходят RLS/security checklist до реализации.
- Если изменение требует миграции, политики или нового wire shape, оно оформляется отдельным technical plan перед реализацией.
- Backward compatibility сохраняется, если задача явно не требует breaking change.

---

## 10. Первый пакет улучшений

Для запуска кайдзен-цикла первым пакетом берутся инициативы с максимальным отношением ценности к сложности:

1. **KZN-001:** единый реестр улучшений.
2. **KZN-002:** владельцы потоков.
3. **KZN-003:** baseline по основному пути пользователя.
4. **KZN-004:** сокращение первого запуска для экспертов/консультантов.
5. **KZN-007:** обязательный block feature checklist.
6. **KZN-018:** RLS/public flow checklist до реализации data changes.
7. **KZN-017:** повторяющиеся bugs -> тест/checklist/правило.

Этот пакет создает основу: команда начинает улучшать LinkMAX измеримо, не перегружая продукт и не ослабляя безопасность.

### 10.1 Реализация первого пакета

| ID | Артефакт | Статус |
| :--- | :--- | :--- |
| KZN-001 | `KAIZEN_ACTIVE_REGISTER.md` | Implemented baseline |
| KZN-002 | Ownership matrix в `KAIZEN_ACTIVE_REGISTER.md` | In progress до назначения конкретных имен |
| KZN-003 | `KAIZEN_BASELINE_QUERIES.sql` | Implemented baseline |
| KZN-004 | AI Builder wizard events | Implemented measurement step |
| KZN-007 | `BLOCK_FEATURE_CHECKLIST.md` | Implemented baseline |
| KZN-017 | `RELIABILITY_REPEAT_BUG_PLAYBOOK.md` | Implemented baseline |
| KZN-018 | `RLS_PUBLIC_FLOW_CHECKLIST.md` | Implemented baseline |
| KZN-019 | `RELEASE_QUALITY_CHECKLIST.md` | Implemented baseline |

### 10.2 Safe product implementation started

| ID | Изменение | Статус |
| :--- | :--- | :--- |
| KZN-010 | CRM lead quick actions теперь пишут `activation:lead_replied`, а status updates пишут `activation:lead_status_changed`. | Implemented safe step |
| KZN-004 | AI Builder onboarding теперь пишет `activation:wizard_started`, `activation:wizard_niche_selected`, `activation:wizard_completed`, если известен `pageId`. | Implemented measurement step |
| KZN-018 | Lead status update в dashboard дополнительно фильтруется по `user_id` на клиентском запросе. | Implemented safe step |
| KZN-017 | В `useLeads` убраны оставшиеся `any` на lead source/status/update path. | Implemented safe step |
