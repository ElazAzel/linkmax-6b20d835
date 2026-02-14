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

## Workflow (export and import)

- Export command: `npm run i18n:export`
  - Output: `i18n/exports/locales.csv`
  - Columns: key, namespace, en, ru, kk, usage
  - usage field contains the first source file that references the key.
- Import command: `npm run i18n:import [path/to/locales.csv]`
  - Validations: all keys present, no unknown keys, placeholder sets match across languages.
  - Output: overwrites `src/i18n/locales/{en,ru,kk}.json` in place.

## PR Review Checklist (i18n)

1) New UI strings use `t('...')` and no hardcoded JSX strings.
2) New keys follow namespace convention.
3) RU and KK keys are added for every EN key.
4) Placeholders match across languages.
5) CTA labels stay under 3 words and start with a verb.
6) Error messages include action guidance.
7) Plan names use Free and Pro as product names.
8) Mini-CRM casing is "Мини-CRM" in RU and KK.
9) Pricing copy uses correct currency formats.
10) E2E or smoke tests cover language switch if UI text changed.

## Definition of Done (DoD)

- All new keys added to en, ru, kk with matching placeholders.
- `npm run i18n:check` passes.
- `npm run lint:i18n` passes for changed UI components.
- `npm run i18n:export` and `npm run i18n:import` complete without errors for updated files.
- No hardcoded JSX strings introduced in user-facing UI.
