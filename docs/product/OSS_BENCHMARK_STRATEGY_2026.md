# LinkMAX — OSS Benchmark Strategy 2026

> **Статус**: Активно
> **Создано**: 3 июля 2026
> **Основа**: Deep Research по open-source рынку (LinkStack, Dub, PostHog, Cal.com, Twenty, Formbricks, Lago, DocuSeal, Webstudio, GrapesJS, Plasmic, Activepieces, Medusa/Saleor/Vendure, Chatwoot, Appsmith и др.)

---

## 1. Стратегический тезис

**LinkMAX = Micro-Business Operating System.** Публичная страница — не витрина, а управляемая точка входа в коммерческий pipeline:

> клик → лид → квалификация → запись → оплата → документ → повторная продажа

Мы не конкурируем с «ещё одним конструктором bio». Мы строим сквозную систему для креаторов и микро-бизнеса.

---

## 2. Референсы по слоям

| Слой | Основные референсы | Что берём |
| :--- | :--- | :--- |
| **Presentation** (Page/Block/Theme) | LinkStack, LittleLink, OpenBio, LinkDen, Webstudio, GrapesJS, Plasmic | Multi-user + темизация, минимализм, bento-grid, design tokens, block registry, code components |
| **Growth** (SmartLink/Capture/Experiment) | Dub, Formbricks | Link-as-object, attribution/conversion, cross-domain, in-flow surveys, поведенческий таргетинг |
| **Ops** (Lead/Booking/Pipeline) | Cal.com, Twenty, SuiteCRM | Routing forms, round-robin, routing traces, object graph, workflows, dedupe |
| **Money** (Billing/Commerce) | Lago, Medusa, Saleor, Vendure | Hybrid pricing, metering, workflows/subscribers, apps/webhooks, plugin-first |
| **Trust** (Docs/Signature/Consent) | DocuSeal, Documenso | PDF fill/sign, embed signing, webhooks |
| **Automation** (Flows/Recipes) | Activepieces, (осторожно) n8n | Recipe-based, permission-scoped, no-code-first |
| **Support/Admin** | Chatwoot, Appsmith | Omni-channel inbox, backoffice tooling |
| **Analytics (dual)** | PostHog (internal), Plausible/Umami (creator-facing) | Funnels/replay/flags внутри; простые goals + privacy-first наружу |

---

## 3. Архитектура LinkMAX — 6 слоёв

```text
┌───────────────────────────────────────────────────────────┐
│ Automation:  Trigger · Flow · Action · Connector · Rule    │
├───────────────────────────────────────────────────────────┤
│ Trust:       Proposal · Contract · Signature · Consent     │
├───────────────────────────────────────────────────────────┤
│ Money:       Product · Offer · Checkout · Order · Sub      │
│              Commission · UsageMeter · Invoice · Payout    │
├───────────────────────────────────────────────────────────┤
│ Ops:         Lead · Contact · Company · Opportunity        │
│              Activity · Booking · Owner · Pipeline         │
├───────────────────────────────────────────────────────────┤
│ Growth:      SmartLink · Campaign · Attribution · CTA      │
│              Goal · Survey · Form · Experiment             │
├───────────────────────────────────────────────────────────┤
│ Presentation: Page · Block · Theme · Token · Template      │
└───────────────────────────────────────────────────────────┘
```

### Три обязательных принципа

1. **Разделение editor / renderer / бизнес-объектов.** Блок знает как рендериться и к чему привязан, но не владеет процессом. (Webstudio collections + Plasmic code components.)
2. **Единая event taxonomy.** Один канонический список событий: `page_view`, `link_click`, `cta_opened`, `form_started/submitted`, `survey_completed`, `booking_started/confirmed`, `deal_created`, `checkout_started`, `payment_succeeded`, `document_sent/signed`, `support_conversation_started`. На нём растут обе аналитики.
3. **Плагинность без «превращения в платформу для программистов».** Обычный пользователь выбирает Recipe/Block Pack, power user — registry + manifest + permissions + versioning.

---

## 4. Поэтапный план (P0 → P4)

### P0 — Платформенный каркас
- Новая block schema (design tokens + data bindings).
- Object graph: `leads / contacts / companies / opportunities / bookings / orders / documents`.
- Единая event taxonomy + dual analytics (PostHog внутри, простой Creator Dashboard снаружи).
- Референсы: Webstudio, GrapesJS, Plasmic, PostHog, Plausible, Umami.

**Status (3 июля 2026):**
- ✅ Storage tiering: bucket `user-media-large` (30MB) + edge function `upload-user-media` для файлов >5MB через service_role. Лимиты Free 10MB / Pro 30MB. GIF-анимация сохраняется (без canvas re-encode).
- ✅ Analytics integrity: UUID-guard в `SupabaseAnalyticsRepository` (валидные UUID → колонки, legacy string → `metadata.rawBlockId`) — устраняет 400 на `analytics.insert` и `increment_block_clicks`.
- ✅ Единая event taxonomy: `src/lib/analytics/event-taxonomy.ts` — 15 канонических событий (`page_view / link_click / cta_opened / form_started|submitted / survey_completed / booking_started|confirmed / deal_created / checkout_started / payment_succeeded / document_sent|signed / support_conversation_started / share`). Helper `trackCanonicalEvent()` пишет каноническое имя в `metadata.event` и сохраняет обратную совместимость с legacy колонкой `analytics.event_type`. Индексы `analytics_canonical_event_idx` и `analytics_source_object_id_idx` — для funnel-запросов.
- ✅ Object graph consolidation: view `public.unified_pipeline_contacts` (security_invoker) объединяет `leads` (solo) и `zone_contacts` (B2B) с полями `source_object_type` / `source_object_id`. Один surface для аналитики и CRM; RLS исходных таблиц применяется автоматически.
- ✅ **P1 SmartLink**: таблица `smart_links` (slug/target/UTM/goal_event/downstream_action, counters), RPC `increment_smart_link_click` (atomic), edge-функция `smartlink-redirect` (302 + UTM inject + canonical `link_click` в `analytics.metadata.event`), сервис `src/lib/growth/smart-links.ts` (CRUD). RLS: owner-only write, публичное чтение только активных ссылок.
- ✅ **P2 Offers**: таблица `offers` (one_time / subscription / usage / hybrid / donation, price_cents, currency, billing_interval, usage_config) + сервис `src/lib/money/offers.ts`. Абстракция независима от чекаут-провайдера (Robokassa/Paddle) — orders остаются точкой интеграции.
- ✅ **P2 Trust**: таблица `document_signatures` (pending/viewed/signed/declined/expired, signature_data, IP, UA) над `zone_documents` + сервис `src/lib/trust/document-signatures.ts`. Готово к embed-интеграции с DocuSeal/Documenso.
- ✅ **P1 SmartLink UI + public route**: страница `/dashboard/smart-links` (CRUD, toggle активности, copy/open/delete, показатели clicks/conversions) и публичный маршрут `/s/:slug` → edge-функция `smartlink-redirect` (клиентский bridge через `window.location.replace`, чтобы работать на кастомном домене lnkmx.my без Cloudflare Worker).
- ✅ **P2 Offer Checkout Adapter**: edge-функция `create-offer-checkout` (Offer → `orders` (pending) → Robokassa signed URL, поддерживает one_time / donation, работает и для соло-креаторов без zone_id, и для zone-офферов) + клиентский сервис `src/lib/money/offer-checkout.ts` (`startOfferCheckout` / `redirectToOfferCheckout`). Триггерит канонический `checkout_started` через `trackCanonicalEvent` с `source_object=order:{offer_id}`. Провайдер-специфичные адаптеры (Paddle/Stripe) подключаются рядом с тем же контрактом `{ orderId, paymentUrl }`.
- ✅ **P0 Canonical click migration**: `trackPageView` / `trackBlockClick` / `trackBlockView` / `trackShare` в `src/services/analytics.ts` теперь всегда пишут канонические поля `metadata.event` (`page_view` / `link_click` / `share`), `taxonomy_version: 1` и `source_object` (page/block). Legacy колонка `analytics.event_type` сохраняется для обратной совместимости; funnel-запросы по `metadata->>event` и `metadata->>source_object_id` работают сразу для всех существующих call-sites (`useAnalyticsTracking`, ссылки, share).
- ⏳ Следующие шаги: (a) subscription/usage-биллинг поверх Paddle/Lago, (b) DocuSeal embed для реального PDF-подписания, (c) в `smart-links.ts` / `offers.ts` использовать `Database['public']['Tables']` вместо `as never` после регенерации типов.


### P1 — Acquisition OS
- **SmartLink**: ссылка как объект с целью, атрибуцией, downstream-действием (Dub-модель).
- Dynamic CTA logic на странице.
- Multi-step form/survey qualification (Formbricks-модель).
- Booking с routing/round-robin/embed + routing traces (Cal.com-модель).
- Всё приземляется как `Lead → Contact → Opportunity` с источником и owner.

### P2 — Monetization & Fulfilment OS
- Абстракции `Product / Offer / Checkout`.
- Commission logic + usage-based / hybrid billing (Lago-модель).
- Расширяемая commerce-модель (уроки Medusa/Saleor/Vendure).
- Document workflows: оффер → договор → счёт → акт → подпись (DocuSeal/Documenso embed).
- Цель этапа: пользователь проходит путь **интерес → оплата → подписанный документ** без выхода из LinkMAX.

### P3 — Operator Tooling & Team Surfaces
- Recipe-based automation builder (Activepieces UX).
- Support inbox (Chatwoot).
- Backoffice-инструменты (Appsmith).
- Explainable routing trace для записей.
- Experiments/flags для rollout блоков и фич.
- Shared boards / public dashboards для команд и клиентов.

### P4 — Marketplace & Ecosystem
- Маркетплейс блоков, шаблонов, flow recipes и app connectors.
- Manifest + versioning + permissions (LinkStack themes, Saleor apps, Vendure plugins, Activepieces pieces).
- Core UX для обычного пользователя остаётся простым.

**Жёсткий порядок:** builder schema + event model → smart links + forms + booking + CRM → billing + checkout + docs → automation/support/admin → ecosystem marketplace.

---

## 5. Продуктовые режимы страницы

- **Express Mode** — быстрый запуск на шаблоне (умолчание для 80% новых пользователей).
- **Studio Mode** — продвинутая композиция блоков через block registry + design tokens.

---

## 6. Риски и митигации

| Риск | Митигация |
| :--- | :--- |
| Слишком сложная платформа слишком рано | Guided flows + шаблоны по умолчанию; глубина — по требованию. |
| Automation как security-риск (см. n8n advisories 2025–2026) | Recipe-based + permission-scoped + declarative. Код-расширения — только для power users в sandbox. |
| Копирование OSS как «production reality» (пример Cal.com → Cal.diy split) | OSS = архитектурный/продуктовый референс, не гарантия parity. |
| Смешение creator-facing и internal analytics | Две панели, две аудитории, одна event taxonomy. |

---

## 7. Итоговый стратегический набор

**Core benchmarks:** Dub · PostHog · Cal.com · Twenty · Formbricks · Lago · DocuSeal.
**Architectural background:** Webstudio · GrapesJS · Plasmic · Activepieces · Plausible · Umami · Medusa/Saleor/Vendure · Chatwoot · Appsmith.

---

## Связанные документы

- [Дорожная карта продукта](5_PRODUCT_ROADMAP.md)
- [Стратегический план 2026](STRATEGIC_PLAN_2026.md)
- [Product Vision](1_PRODUCT_VISION.md)
- [Архитектура платформы](../architecture/2_PLATFORM_ARCHITECTURE.md)
- [Features](../features/Features.md)
