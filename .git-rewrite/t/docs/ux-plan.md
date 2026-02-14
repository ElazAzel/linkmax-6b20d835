# UX/PM Plan for lnkmx.my

Below is a working plan that can be broken down into tasks and shipped without architecture debates. Where facts about the current lnkmx.my interface are missing, I make assumptions and mark them as **[ASSUMPTION]**.

---

## A) UX-DECONSTRUCTION (product diagnostics)

### A1) 3 key user journeys

#### 1) Creator: “one link” + content + clicks

**Scenario**

1. Landing → “Create page”
2. Choose goal: “content clicks / subscriptions / donations / social”
3. AI generates page (8–15 blocks)
4. Quick mode: replace avatar/bio/3 main links
5. Publish → copy link → add to bio
6. After 24–48 hours: check clicks → improve top-3 blocks

**Aha-moment**

* “Published in 1–3 minutes and already see clicks on buttons/links.”

**Friction**

* Too much choice right away (themes/animations/blocks) → loss of focus on “why”. **[ASSUMPTION]**
* No ritual “published → shared → returned to see result”.
* Analytics exist, but don’t translate into “what to change”.

**Payment triggers**

* Wants to remove watermark
* Wants more than 5 blocks
* Wants advanced analytics “what brings clicks”

**Success metrics**

* Activation: `ai_generate_success` + `publish_success` within 10 minutes; `share_copy_link` within 15 minutes.
* Conversion: `upgrade_purchase_success` within 7 days after first publish.
* Retention: D1/D7 return to editor or analytics + at least 1 block edit.

---

#### 2) Expert/Freelancer: “portfolio + pricing + leads”

**Scenario**

1. Landing → “Create page”
2. Goal: “get leads”
3. AI generates: offer, cases, reviews, pricing, lead form (premium), messengers
4. Configure form: fields + where to notify (Telegram)
5. Publish → put in bio/Telegram/WhatsApp
6. Leads fall into Mini-CRM, statuses + quick replies

**Aha-moment**

* First lead + Telegram notification “new lead”.

**Friction**

* Form/CRM can be hidden or look like “just another feature” instead of “here are your leads”. **[ASSUMPTION]**
* Too complex to configure fields/statuses/notifications on mobile.
* No “quick reply” directly from CRM (templates).

**Payment triggers**

* Needs form/CRM/Telegram notifications (Pro)
* Needs premium blocks Pricing/Testimonial/Booking
* Needs 5+ AI generations/month

**Success metrics**

* Activation: `publish_success` + `lead_created` within 7 days.
* Conversion: upgrade after trying to enable form/notifications.
* Retention: WAU with `crm_open` ≥ 2 times/week, `lead_status_changed`.

---

#### 3) Small business: “catalog + booking + notifications”

**Scenario**

1. Goal: “sales/booking”
2. AI generates: offer, catalog/products, map, FAQ, booking
3. Configure slots/services/notifications + reminders
4. Publish → links in 2GIS/Instagram/WhatsApp
5. Manage bookings + reminders

**Aha-moment**

* First booking + reminder sent to client/owner (and not lost in DMs).

**Friction**

* Schedule setup on mobile (slots, timezone, exceptions) is heavy.
* Not obvious “what to put first”: catalog vs booking vs messenger.
* No simple report “what brought leads/bookings”.

**Payment triggers**

* Booking + reminders (Pro)
* Telegram notifications
* Remove watermark and expand blocks

**Success metrics**

* Activation: `publish_success` + `booking_slot_created` + `booking_created`.
* Conversion: upgrade when enabling booking/reminders.
* Retention: `booking_open` weekly + slot/service edits every 2 weeks.

---

## B) UX-AUDIT (20 problems)

Format: **Problem → Why it hurts → Who it hits → How to measure → Solution → Complexity → Effect**

1. **No “profit in 30–60 sec” on first screen** → users don’t understand “why” → all segments → bounce rate / CTR on “create” → “3 outcome-CTA” + 20-sec demo (gif/animation) → S → high
2. **Onboarding without goal selection** → AI generates “everything about everything” → all → share of users without publish → “page goal” screen (clicks/leads/bookings) → S → high
3. **Too many settings in editor right away** → cognitive overload → creators/newbies → time-to-first-publish → “Quick edit” mode (only 5 things) → M → high
4. **No “ready to launch” checklist** → publish rough or don’t publish → all → publish rate → onboarding checklist (5 steps) → M → high
5. **Publish not turned into a ritual** → no habit, no return → all → share events / D1 → post-publish “share kit” + “return tomorrow: report” → S → high
6. **Paywall talks about features, not outcomes** → no purchase → all → upgrade_view→purchase → copy through outcome + “what you get in 7 days” → S → high
7. **Free limits don’t explain “why”** (5 blocks/1 AI) → looks greedy → free → rage clicks on locked → “limit = to build MVP, Pro = to get leads/booking” → S → medium
8. **Watermark not sold as a growth channel** → seen as punishment → creators → removal clicks → “remove watermark + look branded” → S → medium
9. **CRM not embedded in flow** → leads exist but don’t become a process → experts/business → leads ignored rate → inbox-style mini-CRM + quick replies + statuses → M → high
10. **Telegram connection hidden/complex** → leads lost → experts/business → % users with tg_connected → 3-step connection wizard → M → high
11. **Analytics don’t answer “what to do next”** → boring to view → creators → analytics_open→edit rate → report “top-3 blocks + tip” → M → high
12. **No UTM/sources “human-readable”** → impossible to optimize → experts/business → % sessions with source_known → “campaigns” (Instagram/Telegram/TikTok) + auto-suggestions → M → high
13. **Niche templates not at first step** → slower start → all → ai_generate_start rate → “choose a niche” (expert/barber/tutor…) → S → high
14. **Gallery doesn’t work as social proof** → can’t see “how it should look” → creators → gallery→create rate → “similar to you” + “use” button → M → high
15. **Mobile drag&drop can be finicky** → frustration → mobile-first → reorder errors → “move up/down” + haptic + big handles → M → medium
16. **Editor lacks “preview like visitor”** → fear to publish → all → preview_open rate → sticky “Preview” + share preview link → S → medium
17. **No “quick optimization of first link”** → lose clicks → creators → click distribution concentration → auto-suggestion: “move button X to top” → M → medium
18. **Empty states are dry** (CRM/analytics/bookings) → no guidance → all → empty_state_exit → “what to do next” + 1 CTA → S → medium
19. **Localization doesn’t cover new copy immediately** → trust breaks → KK/EN → missing key rate → i18n keys + CI check missing keys → S → medium
20. **No “alternatives” and comparisons near paywall** → harder to justify price → all → pricing→purchase → embedded compare (Taplink/Linktree) → S → medium

---

## C) SYSTEM “VALUE → PAYMENT”

### C1) Value Ladder (Free → Pro)

**Free (first win in 10 minutes)**

* Publish a mini-page and place 3 main CTAs (buttons/links).
* Get first clicks and understand what people actually tap. (Basic analytics/counters in any form.)
* “Page MVP”: up to 5 blocks + 1 AI generation/month

**Pro (subscription pays off through outcome)**

* **More leads**: forms + Mini-CRM + Telegram notifications
* **More bookings**: Booking + reminders
* **Traffic insight**: advanced analytics “what brings leads/clicks”
* **Professional look**: no watermark, themes/background/customization
* **Faster launch**: more AI generations/month

---

### C2) New UX copy (RU/EN/KK via i18next)

#### Onboarding: first 3 screens/steps (copy)

**Screen 1: Goal**

* RU: **“Что ты хочешь получить с этой страницы?”**
  Buttons: **“Клики” / “Заявки” / “Запись”**
  Caption: “Выберем блоки так, чтобы это случилось быстрее.”
* EN: **“What do you want from this page?”**
  Buttons: **“Clicks” / “Leads” / “Bookings”**
  Caption: “We’ll build blocks that get you there faster.”
* KK: **“Бұл беттен не алғың келеді?”**
  Buttons: **“Клик” / “Өтінім” / “Жазылу”**
  Caption: “Соған тез жету үшін блоктарды жинаймыз.”

**Screen 2: Description (AI)**

* RU: **“Опиши себя в 1–2 фразах. Мы соберём страницу за минуту.”**
  Placeholder: “Напр.: SMM-специалист. Настраиваю рекламу и веду Instagram. Хочу заявки в Telegram.”
  Hint chips: “Ниша”, “Город”, “Цена от”, “Куда писать”
* EN: **“Describe your work in 1–2 lines. We’ll build your page in a minute.”**
* KK: **“Өзіңді 1–2 сөйлеммен сипатта. Біз 1 минутта бетті жинаймыз.”**

**Screen 3: Publish & Share**

* RU: **“Готово. Опубликуй и поставь ссылку в bio.”**
  CTA1: “Опубликовать”
  CTA2: “Скопировать ссылку”
  Mini-check: “Хочешь заявки? Включи форму.”
* EN/KK analogously.

#### Paywall/Upgrade modal (outcome-first)

* Header RU: **“Хочешь больше заявок и запись без лички?”**
  Subheader: “Pro открывает формы, CRM и уведомления, чтобы не терять клиентов.”
* Comparison block (3 points max):

  * Free: “До 5 блоков”, “Watermark”, “Без заявок/записи”
  * Pro: “Без лимитов”, “Без watermark”, “Заявки/запись + уведомления”
* CTA RU: **“Включить Pro и собирать заявки”**
  Secondary: “Пока не нужно”

#### Pricing page (structure)

1. Hero: “Одна ссылка, которая приносит **клики / заявки / запись**”
2. 3 cards by goals (Creator/Expert/Business)
3. Comparison table Free vs Pro (not 30 rows, but 8–10 outcome points)
4. “How much it costs” (3/6/12 months)
5. FAQ: “When does Pro pay off?” (1 lead = subscription)

#### Editor hints (microcopy)

* On button: “Сделай 1 кнопку ‘Записаться’ и поставь её первой.”
* On form: “Это собирает заявки. Уведомление придёт в Telegram.”
* On analytics: “Смотри, что жмут. Поменяй топ-1 блок и вырастут клики.”

##### i18next keys (example)

```json
{
  "onboarding": {
    "goalTitle": { "ru": "Что ты хочешь получить с этой страницы?", "en": "What do you want from this page?", "kk": "Бұл беттен не алғың келеді?" },
    "goalClicks": { "ru": "Клики", "en": "Clicks", "kk": "Клик" },
    "goalLeads":  { "ru": "Заявки", "en": "Leads",  "kk": "Өтінім" },
    "goalBooking":{ "ru": "Запись", "en": "Bookings", "kk": "Жазылу" }
  },
  "upgrade": {
    "title": { "ru": "Хочешь больше заявок и запись без лички?", "en": "Want more leads and bookings without DMs?", "kk": "Личкасыз көбірек өтінім мен жазылу керек пе?" },
    "cta":   { "ru": "Включить Pro и собирать заявки", "en": "Go Pro and capture leads", "kk": "Pro қосып, өтінім жина" }
  }
}
```

---

### C3) Upgrade moments (10 items)

| Moment | Where (UI)       | Trigger                 | Text (RU)                                               | Free vs Pro                          |
| ------ | ---------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------ |
| 1      | Add block        | 6th block               | “Собери страницу до конца: убери лимит блоков.”         | Free: 5 blocks / Pro: unlimited      |
| 2      | Publish          | before publish          | “Убери watermark и выгляди как бренд.”                  | Free: watermark / Pro: no watermark  |
| 3      | Form enable      | enable form             | “Форма = заявки. Pro отправит их в CRM + Telegram.”     | Free: no form / Pro: form+CRM+TG     |
| 4      | CRM open         | open CRM                | “Статусы и быстрые ответы, чтобы не терять клиентов.”   | Free: no CRM / Pro: CRM              |
| 5      | Analytics open   | clicks/sources          | “Узнай, что приносит клиентов, а не просто просмотры.”  | Free: basic / Pro: sources+tips      |
| 6      | Booking enable   | enable booking          | “Запись вместо переписок. Клиент сам выбирает слот.”    | Free: no / Pro: booking+reminders    |
| 7      | Theme customize  | attempt color/bg change | “Сделай страницу ‘своей’. Pro даёт темы и фон.”         | Free: basic / Pro: custom            |
| 8      | AI regenerate    | 2nd generation in month | “Нужен ещё вариант? Pro даёт больше AI-генераций.”      | Free: 1/mo / Pro: 5/mo               |
| 9      | Share kit        | post-publish            | “Хочешь больше трафика? Pro даст отчёт ‘что сработало’.”| Free: link only / Pro: report         |
| 10     | Templates        | choose template         | “Шаблоны по нишам + премиум блоки = быстрее старт.”     | Free: basic / Pro: premium           |

---

## D) BACKLOG: UX + FEATURES (RICE, 32 initiatives)

Scales: Reach (1–10), Impact (0.5/1/2/3), Confidence (0.6/0.75/0.9), Effort (days). **RICE = Reach×Impact×Confidence / Effort**.
Sorted by score (top in bold).

### Quick wins (1–3 days)

| Initiative                                                     |  R |  I |    C |  E |    Score |
| -------------------------------------------------------------- | -: | -: | ---: | -: | -------: |
| **Outcome-first paywall copy + Free/Pro compare (8 points)**   |  8 |  3 | 0.75 |  2 |  **9.0** |
| **Onboarding “goal” screen (clicks/leads/bookings)**           |  9 |  2 | 0.75 |  2 | **6.75** |
| **Post-publish Share Kit (copy link + post/story templates)**  |  7 |  2 | 0.75 |  2 | **5.25** |
| **Quick Edit mode (5 required fields)**                        |  8 |  2 |  0.6 |  3 |  **3.2** |
| Locked states (single component + clear text “what Pro gives”) |  8 |  1 | 0.75 |  2 |      3.0 |
| Empty states (CRM/analytics/bookings) with CTA “do 1 step”      |  7 |  1 | 0.75 |  2 |      2.6 |
| Mobile reorder: up/down buttons + large drag handle            |  6 |  1 | 0.75 |  2 |     2.25 |
| “Preview as visitor” sticky button                             |  6 |  1 | 0.75 |  2 |     2.25 |
| Pricing page: rebuild blocks (outcome-first)                    |  7 |  2 |  0.6 |  3 |      2.8 |

### Sprint scope (1–2 weeks)

| Initiative                                            |  R |  I |    C |  E |    Score |
| ----------------------------------------------------- | -: | -: | ---: | -: | -------: |
| **Onboarding checklist (5 steps) + progress**         |  8 |  3 | 0.75 |  6 |  **3.0** |
| **Niche templates at start (10–15 niches)**           |  7 |  3 | 0.75 |  6 |  **2.6** |
| **Upgrade moments (10 points) + unified logic**       |  8 |  2 | 0.75 |  6 |  **2.0** |
| **CRM: statuses + quick replies (templates)**         |  6 |  3 |  0.6 |  8 | **1.35** |
| Telegram connect wizard (3 steps)                     |  6 |  2 | 0.75 |  7 |     1.29 |
| Analytics “what worked” (top blocks + tip)            |  6 |  3 |  0.6 | 10 |     1.08 |
| Campaigns/UTM: Instagram/TikTok/Telegram presets       |  5 |  2 |  0.6 |  8 |     0.75 |
| Gallery: “similar to you” + “use template”            |  5 |  2 |  0.6 |  8 |     0.75 |
| PWA install nudge after publish                        |  4 |  1 | 0.75 |  5 |      0.6 |

### Big bets (3–6 weeks)

| Initiative                                                |  R |  I |    C |  E |   Score |
| --------------------------------------------------------- | -: | -: | ---: | -: | ------: |
| **Reports “what brought leads/bookings” (source→lead)**   |  6 |  3 |  0.6 | 18 | **0.6** |
| **Simplified booking (mobile wizard + exceptions)**       |  5 |  3 |  0.6 | 18 | **0.5** |
| **Mini-CRM inbox: quick actions + notes + tags**          |  5 |  3 |  0.6 | 20 |    0.45 |
| **Auto-followup (simple automation: 1–2 steps)**          |  4 |  3 |  0.6 | 18 |     0.4 |
| **Referral “invite → get Pro days”**                      |  4 |  2 |  0.6 | 18 |    0.27 |
| **Alternatives/compare inside paywall (Taplink/Linktree)**|  4 |  2 | 0.75 | 14 |    0.43 |

---

## E) IMPLEMENTATION PLAN (4 sprints x 2 weeks)

### Sprint 1: “Value clarity in 60 seconds”

**Goal (metric):** +20–30% to `create_start → publish_success` in first 24 hours.
**Deliverables**

* Onboarding “goal” + simplified input for AI
* Quick Edit mode
* Outcome-first paywall + unified LockedState
* Share Kit after publish

**UI/UX**

* `pages/OnboardingGoal.tsx`, `pages/OnboardingDescribe.tsx`, `pages/OnboardingPublish.tsx`
* `components/ui/LockedFeature.tsx`, `components/ui/ShareKitSheet.tsx`
* `pages/DashboardEditor.tsx`: tab “Quick edit”

**Backend**

* No new tables (only analytics events).

**Acceptance criteria**

* New user can: choose goal → generate → edit 3 fields → publish → copy link in ≤ 3 minutes (mobile).
* Paywall everywhere is outcome-first (no list of “features for features”).

**Risks**

* Reworking onboarding and breaking old flow → feature flag `onboarding_v2`.

---

### Sprint 2: “Habit: checklist and return”

**Goal:** +15% to D1 retention (any action: edit/analytics/crm).
**Deliverables**

* Onboarding checklist (5 steps) with progress
* Empty states (CRM/analytics/bookings)
* Upgrade moments (first 6 points)

**UI/UX**

* `components/ui/ChecklistCard.tsx`
* `hooks/useChecklist.ts`
* `pages/DashboardHome.tsx` (progress widget)

**Backend**

* Tables: `user_checklist_progress` (see F) + RLS
* Edge: `send-weekly-digest` already exists, connect “page readiness” in digest.

**Acceptance criteria**

* Checklist shows 0–100%, clicks on steps go to right screen.
* After publish, steps “share” and “check report tomorrow” appear.

**Risks**

* Spam feeling from tips → frequency cap + dismiss.

---

### Sprint 3: “Leads as the main Pro driver”

**Goal:** +20% to `upgrade_purchase_success` among those who tried to enable form/CRM.
**Deliverables**

* CRM: statuses + quick replies (3 templates)
* Telegram connect wizard (3 steps)
* Upgrade moments for Form/CRM/Telegram (all points)

**UI/UX**

* `pages/CRMInbox.tsx`, `components/crm/LeadCard.tsx`, `components/crm/QuickReply.tsx`
* `pages/IntegrationsTelegram.tsx`

**Backend**

* Table `crm_quick_replies` + `lead_status_history`
* Edge: update `send-lead-notification` (exists): add “reply template” in payload (optional).

**Acceptance criteria**

* Lead can be moved to a status in 1 tap (mobile).
* Quick reply is copied/sent (minimum: copy-to-clipboard + deeplink).

**Risks**

* CRM complexity → start with “inbox-lite”, no full suite.

---

### Sprint 4: “What brings customers” (analytics → action)

**Goal:** +25% to weekly active for Pro (analytics/crm/bookings).
**Deliverables**

* Report “what worked”: sources → clicks → leads/bookings (if available)
* UTM presets/campaigns
* Booking wizard (simplified)

**UI/UX**

* `pages/AnalyticsInsights.tsx`
* `components/analytics/TopBlocksCard.tsx`, `components/analytics/SourcesCard.tsx`
* `pages/BookingSetupWizard.tsx`

**Backend**

* Tables `traffic_sources`, `attribution_events` (or analytics extension)
* Edge: if needed, nightly aggregation.

**Acceptance criteria**

* Report shows 3 concrete “next steps”: reorder block, change CTA, add form.
* Campaign can be created in 15 seconds.

**Risks**

* Attribution incomplete → honest “unknown source” statuses + gradual improvement.

---

## F) TECHNICAL IMPLEMENTATION (TOP-5 initiatives)

### 1) Onboarding v2: “goal → AI → publish”

**Mini-spec**

* For: all new users.
* Where: `/auth` after signup or first visit to `/dashboard`.
* Scenarios: choose goal → describe → AI generate → quick edit → publish.

**UI (files)**

* `pages/onboarding/Goal.tsx`
* `pages/onboarding/Describe.tsx`
* `pages/onboarding/Publish.tsx`
* `components/ui/GoalCard.tsx`
* `services/ai/generatePage.ts`

**Data/DB**

* Not required. But helpful to store goal: field in `pages` or `user_profiles`.

  * `pages.primary_goal` enum('clicks','leads','bookings') **[ASSUMPTION]**

**Migration**

```sql
alter table pages add column if not exists primary_goal text;
```

**Edge functions**

* Use existing `ai-content-generator`
* Add parameter `primary_goal` to prompt.

**Tracking events**

* `onboarding_goal_selected {goal}`
* `ai_generate_started {goal, locale}`
* `ai_generate_success {blocks_count}`
* `publish_success {goal}`

**Test plan**

* Mobile smoke: pass full flow at 360px width.
* i18n: RU/EN/KK without missing keys.
* AI error: show retry + keep input text.

**Release**

* Feature flag `onboarding_v2` + 20% rollout → 50% → 100%.

---

### 2) Outcome-first paywall + Upgrade moments engine

**Mini-spec**

* Contextual upgrades on actions, not “go to pricing”.
* 10 moments (from C3), frequency caps, respect dismiss.

**UI**

* `components/upgrade/UpgradeModal.tsx`
* `components/upgrade/UpgradeBannerInline.tsx`
* `lib/upgrade/moments.ts` (rules)
* `hooks/useUpgradeMoment.ts`

**Data/DB**

* `user_upgrade_state` (to avoid endless showing)

```sql
create table if not exists user_upgrade_state (
  user_id uuid primary key,
  dismissed_moments text[] default '{}',
  last_shown_at timestamptz
);
```

RLS: owner-only.

**Edge**

* Not needed.

**Events**

* `upgrade_view {moment_id, placement}`
* `upgrade_click {moment_id}`
* `purchase_success {plan, period}`

**Test**

* Moment shown once per 24h, after dismiss doesn’t return for 7 days.

**Release**

* Feature flag `upgrade_moments_v1`.

---

### 3) Onboarding checklist (ritual “build → publish → share → return”)

**Mini-spec**

* 5 steps: (1) avatar/name (2) 3 CTAs (3) publish (4) share (5) enable lead goal (form/booking per goal).
* Shows on dashboard home + in editor.

**UI**

* `components/ui/ChecklistCard.tsx`
* `components/ui/ChecklistItem.tsx`
* `hooks/useChecklistProgress.ts`

**DB**

```sql
create table if not exists user_checklist_progress (
  user_id uuid primary key,
  steps jsonb not null default '{}', -- { "publish": true, "share": false, ... }
  updated_at timestamptz default now()
);
```

**Events**

* `checklist_step_completed {step}`
* `share_copy_link {channel}`

**Test**

* Steps auto-complete on events (publish_success → publish=true).
* Mobile: card doesn’t take half screen, collapsible.

**Release**

* For all (low risk), but with config toggles.

---

### 4) Mini-CRM “inbox-lite”: statuses + quick replies

**Mini-spec**

* Statuses: New / In progress / Won / Lost.
* Quick replies: 3 default templates + custom in Pro.
* Actions: change status in 1 tap, copy reply, open WhatsApp/Telegram with prefill.

**UI**

* `pages/crm/Inbox.tsx`
* `components/crm/LeadCard.tsx`
* `components/crm/StatusPill.tsx`
* `components/crm/QuickReplyDrawer.tsx`

**DB**

* `leads.status` (if missing) + history:

```sql
alter table leads add column if not exists status text default 'new';

create table if not exists lead_status_history (
  id bigserial primary key,
  lead_id bigint not null,
  user_id uuid not null,
  from_status text,
  to_status text,
  created_at timestamptz default now()
);
```

**Edge**

* Use existing `send-lead-notification`, add “action links”.

**Events**

* `crm_open`
* `lead_status_changed {from,to}`
* `quick_reply_used {template_id, action:copy|open_app}`

**Test**

* RLS: user sees only own leads.
* Mobile: cards clickable, no tiny targets.

**Release**

* Feature flag `crm_inbox_lite`.

---

### 5) Analytics “what brought leads” + campaigns (UTM presets)

**Mini-spec**

* User creates “campaign”: Instagram bio / Telegram channel / TikTok.
* Gets link with UTM.
* Report: clicks/views/leads by source + tip “what to change”.

**UI**

* `pages/analytics/Insights.tsx`
* `components/analytics/Campaigns.tsx`
* `components/analytics/AttributionTable.tsx`

**DB**

```sql
create table if not exists campaigns (
  id bigserial primary key,
  user_id uuid not null,
  name text not null,
  utm_source text not null,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);

-- if analytics already exists: add utm_* fields
alter table analytics add column if not exists utm_source text;
alter table analytics add column if not exists utm_medium text;
alter table analytics add column if not exists utm_campaign text;
```

(An `analytics` table is already claimed.)

**Edge**

* Not required. Aggregations can be done client-side + materialized view later.

**Events**

* `campaign_created {id, source}`
* `analytics_insight_view`
* `cta_recommendation_applied {type}`

**Test**

* Correct UTM parsing on entry (public page view/click).
* No personal visitor data (aggregates only).

**Release**

* Pro-only first, but with preview “see example report” on Free.

---

## G) ANALYTICS AND EXPERIMENTS

### G1) Event taxonomy (26 events)

**Auth/Onboarding**

* `signup_start`
* `signup_success {method}`
* `onboarding_goal_selected {goal}`
* `onboarding_completed {time_sec}`

**AI/Editor**

* `ai_generate_started {goal, locale}`
* `ai_generate_success {blocks_count}`
* `ai_generate_failed {error_code}`
* `block_add {type}`
* `block_edit {type, field}`
* `block_reorder {from,to}`
* `theme_change {theme_id}`
* `preview_open`

**Publish/Share**

* `publish_started`
* `publish_success {page_id}`
* `share_copy_link {channel}`
* `share_open_qr`
* `pwa_install_prompt_shown`
* `pwa_installed`

**Monetization**

* `upgrade_view {moment_id}`
* `upgrade_click {moment_id}`
* `pricing_view`
* `purchase_started {plan, period}`
* `purchase_success {plan, period}`
* `purchase_failed {reason}`

**CRM/Booking**

* `lead_created {source}`
* `crm_open`
* `lead_status_changed {from,to}`
* `booking_created`
* `booking_reminder_sent`

---

### G2) A/B hypotheses (8 tests)

| Test | Change                                              | Metric               | Expected effect | Duration   | Success                     |
| ---- | --------------------------------------------------- | -------------------- | --------------- | ---------- | --------------------------- |
| 1    | Onboarding: “goal” first screen vs current          | publish_success rate | +15%            | 7–10 days  | p<0.05 and +10% minimum     |
| 2    | Paywall: outcome-first vs feature-list              | purchase_success     | +10–20%         | 10–14 days | growth without activation drop |
| 3    | Share Kit: always vs only after publish             | D1 retention         | +5–10%          | 10 days    | D1↑ without complaints      |
| 4    | Pricing: 3 “by goal” packages vs “Free/Pro”         | purchase_started     | +8%             | 14 days    | CAC-neutral                 |
| 5    | Upgrade timing: at 6th block vs at publish          | upgrade_click        | +10%            | 10 days    | purchase↑                   |
| 6    | Checklist: visible progress vs hidden              | onboarding_completed | +10%            | 10 days    | publish time↓               |
| 7    | Pro preview: show analytics report example on Free  | upgrade_view→click   | +15%            | 14 days    | purchase↑                   |
| 8    | CRM empty state: “enable form” vs “connect Telegram”| lead_created         | +10%            | 14 days    | leads↑                      |

---

### Important assumption (and why it’s ok)

* **[ASSUMPTION]** I didn’t rely on the current lnkmx.my UI details (copy/layout), but on your product description and current capabilities: Free/Pro limits, AI generation 8–15 blocks, Mini-CRM/Booking/Analytics/Telegram and stack/architecture. That’s enough to start the sprints “clarity → habit → leads → insights” and measure impact instead of debating hypotheticals.
