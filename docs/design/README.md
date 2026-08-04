# LinkMAX Design Reference (Open Design)

> Source: Open Design catalog (`C:\Users\elaz2\AppData\Local\Programs\Open Design\resources\open-design\`).
> These files are working copies for LinkMAX development. Attribution: see
> upstream `README.md` files in the Open Design directory (design-systems from
> VoltAgent/awesome-design-md and hand-authored starters; craft from
> refero_skill, MIT).

## Rules for LinkMAX work

1. **Always consult this directory** before any UI work: landing, dashboard,
   editor, forms, settings. Read the relevant `craft/*.md` rules and apply
   them; read the design-system files for token discipline.
2. **Brand is Modular Collage**: paper `#F4F5F0`, ink `#16131A`, coral accent,
   mint secondary, orange tertiary, 8px max component radii, hairline borders,
   quiet-bento surfaces. The dashboard DS below adapts this brand to a dark
   cloud-platform theme — never copy raw hex values from OD over brand tokens;
   map them to LinkMAX CSS variables (`--brand-*`, `--primary`, etc.).
3. **Dark theme** (dashboard, developer portal, admin): surface `#09090B`,
   raised `#111114`-ish, hairline borders instead of shadows, accent = brand
   coral, `IBM Plex Sans`/system stack, `tabular-nums` for KPIs.
4. **Anti-AI-slop**: no default-Tailwind-indigo accents, no two-stop hero
   gradients, no emoji as feature icons, no invented metrics ("10x faster"),
   no filler copy. Accent used at most twice per screen.
5. **State coverage** (dashboards, forms, lists): loading / empty / error /
   stale states everywhere stateful.
6. **Accessibility baseline**: focus-visible everywhere, contrast >= 4.5:1,
   keyboard paths, aria labels on interactive widgets.
7. **RTL**: LinkMAX ships Arabic (`ar`) and other RTL locales; new UI must
   check `rtl-and-bidi.md` and not hardcode direction/layout.
8. **i18n**: every new string goes through `t()` and locale JSON files
   (`src/i18n/locales/*.json`); run `npm run i18n:fill` after adding keys.

## Contents

### Design systems

| File | Purpose |
|---|---|
| `design-systems/dashboard-DESIGN.md` | Dark cloud-platform dashboard (Vercel/GitHub family) — base for dashboard-v2 rebuild |
| `design-systems/shadcn-DESIGN.md` | Current UI kit reference — component semantics |
| `design-systems/bento-DESIGN.md` | Modular grid, card blocks — landing hero |
| `design-systems/linear-app-DESIGN.md` | Refined dark SaaS reference |

### Craft rules (universal, brand-agnostic)

| File | When to apply |
|---|---|
| `craft/typography.md` | All typed content |
| `craft/typography-hierarchy.md` | Hierarchical surfaces (dashboard, landing) |
| `craft/color.md` | All styled output |
| `craft/anti-ai-slop.md` | Marketing/landing pages, decks |
| `craft/state-coverage.md` | Stateful UI (dashboards, tables, forms) |
| `craft/animation-discipline.md` | Any motion |
| `craft/accessibility-baseline.md` | Interactive UI |
| `craft/rtl-and-bidi.md` | Localized text, Arabic locales |
| `craft/form-validation.md` | Forms (auth, developer portal, settings) |
| `craft/laws-of-ux.md` | Composition decisions (pricing, dashboards) |

### Design templates (artifact blueprints)

| File | Purpose |
|---|---|
| `design-templates/saas-landing.md` | Landing section sequence: hero → features → proof → pricing → FAQ → CTA |
| `design-templates/dashboard.md` | Admin dashboard layout: sidebar + topbar + KPI row + charts |
| `design-templates/live-dashboard.md` | KPI cards, sparkline, activity feed, table — live states |
| `design-templates/pricing-page.md` | Pricing tiers |

## Updating

Re-sync from the Open Design directory when upstream changes. Keep the
attribution headers intact.
