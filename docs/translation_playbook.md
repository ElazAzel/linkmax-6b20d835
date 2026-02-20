# Translation Playbook

## Glossary

| Term / Key concept | RU | KK | EN | Notes |
| --- | --- | --- | --- | --- |
| Page | страница | бет | page | Use for user mini-site pages. |
| Profile | профиль | парақша | profile | Use for user identity or account profile. |
| Block | блок | блок | block | Use for editor blocks. |
| Template | шаблон | үлгі | template | Use for reusable layouts. |
| Lead | лид | лид | lead | Keep as CRM term, no translation. |
| CRM | CRM | CRM | CRM | Keep as uppercase CRM. |
| Mini-CRM | Мини-CRM | Мини-CRM | Mini-CRM | Use this exact casing. |
| Plan | тариф | жоспар | plan | Use for billing tiers. |
| Free plan | Free | Free | Free | Plan name stays in English. Use "free plan" in sentences. |
| Pro plan | Pro | Pro | Pro | Plan name stays in English. Use "Pro" only for plan. |
| Premium | Premium | Premium | Premium | Use only for legacy or feature bundle if still present. Avoid mixing with Pro. |
| Tokens | токены | токендер | tokens | Use for Linkkon tokens. |
| Linkkon | Linkkon | Linkkon | Linkkon | Brand term, do not translate. |
| Dashboard | дашборд | дашборд | dashboard | Keep as loanword. |
| CTA button | кнопка | батырма | button | Use short, action verbs. |

## Style guide

- Tone: use formal "вы" for RU and polite address for KK. Reason: product targets CIS and Kazakhstan business users, formal tone improves trust for payments and support.
- Button labels: 2 to 3 words max, verb first, no period.
- Headings: sentence case, no period at the end.
- Lists: use commas for short items, semicolon for complex items.
- Numbers and currency:
  - Use space for thousands: 2 610.
  - Currency after amount: 2 610 ₸, $6.99.
  - Use month abbreviations "мес" for RU, "ай" for KK.
- Product entities:
  - Page: use "страница" and "бет".
  - Profile: use "профиль" and "парақша".
  - Block: use "блок" in both RU and KK.
  - Template: use "шаблон" and "үлгі".
  - Mini-CRM: use "Мини-CRM" in RU and KK.
- Errors: format is "что случилось" + "что делать". Example: "Не удалось отправить код. Попробуйте позже".
- Toasts and notifications: 1 short line, start with action verb. Avoid punctuation at end.

## Findings (inventory and inconsistencies)

### Inventory of text domains
- auth: sign in, password reset, telegram auth, referral invites.
- onboarding: landing hero, how it works, FAQ, templates, value props.
- billing: pricing, plan selection, tokens, Premium and Pro references.
- dashboard: CRM, analytics, template marketplace, tokens and streaks.
- editor: block settings, paid content, templates, AI generation.
- notifications: toasts, rewards, referral messages, success states.
- errors: general errors, validation, network, auth issues.
- empty-states: gallery, templates, friends, social panels.

### Inconsistencies and risks
- P0: Pro vs Premium terminology is mixed in pricing and feature areas. Users can interpret this as two different paid plans. Align to one plan name and map legacy keys.
- P1: Mini-CRM casing is inconsistent (Mini-CRM, mini-CRM, Мини-CRM). Normalize to "Мини-CRM" for RU and KK.
- P1: RU and KK titles contain English "vs" in headings. Replace with localized connectors.
- P2: Mixed RU and EN plan labels (Free, Pro) without explicit explanation in copy. Add glossary and keep plan names in English, but use localized descriptors.

### Critical text areas
- CTA buttons: create page, choose plan, upgrade, buy tokens.
- Errors: auth failures, payment failures, insufficient balance.
- Statuses: current plan, premium required, limit reached.
- Billing and legal: pricing descriptions, refund policy, payment provider.

## Migration plan for keys

- Standard namespace format: feature.scope.element. Example: pricing.plan.pro.title.
- Plan for cleanup:
  1) Add new keys with the standard namespace.
  2) Map old keys to new ones in code without deleting old keys.
  3) Keep old keys for one release cycle, then remove after analytics confirms no usage.
  4) Update the i18n export CSV to include both old and new keys during migration.

## Workflow (Unified AI-powered UX)

The platform uses a unified manager for internationalization located in `scripts/i18n-manager.mjs`.

### 1. Unified Sync & Extraction
When you add new `t('key', 'default')` strings in code or add new keys to `ru.json`, run:
```bash
npm run i18n:sync
```
This will:
- Scan `src/` for new strings.
- Add missing keys to `ru.json`.
- Align the JSON structure of all other languages (en, kk, uz, etc.).

### 2. Preparing for AI Translation
To identify what needs translation and prepare a queue for Antigravity (or another AI):
```bash
npm run i18n:prep
```
This generates `i18n-queue.json`. 

### 3. AI Translation Scenario
1. Open `i18n-queue.json`.
2. Ask Antigravity: *"Translate the missing values in this queue for EN, KK, UZ based on the source text. Keep variables like {{count}} exactly as they are."*
3. The AI will populate the empty strings in the queue.

### 4. Merging Translations
After the queue is populated, run:
```bash
npm run i18n:merge
```
This will:
- Distribute translations to `en.json`, `kk.json`, `uz.json`.
- Automatically fix missing `{{placeholders}}` in all target languages.
- Delete the `i18n-queue.json` file.

### 5. Verification
Check the coverage status at any time:
```bash
npm run i18n:status
# OR run validation
npm run i18n:check
```

## Definition of Done (DoD)

- All new UI strings use `t('...')` with proper namespaces.
- `npm run i18n:status` shows 0 missing keys for primary targets.
- `npm run i18n:check` passes without interpolation mismatches.
- `translation_playbook.md` glossary is followed for core business terms (Page, Lead, Mini-CRM).
- No hardcoded JSX strings in user-facing components.
