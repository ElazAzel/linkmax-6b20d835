# Design reference: Open Design catalog

## Mandatory reference for all UI work

Before writing or editing any UI code (components, pages, styles, tokens),
read the relevant files in `docs/design/`:

- Landing/marketing work → `design-templates/saas-landing.md`, `craft/typography.md`,
  `craft/color.md`, `craft/anti-ai-slop.md`, `craft/laws-of-ux.md`
- Dashboard/product work → `design-templates/dashboard.md`,
  `design-templates/live-dashboard.md`, `design-systems/dashboard-DESIGN.md`,
  `craft/state-coverage.md`, `craft/accessibility-baseline.md`,
  `craft/animation-discipline.md`, `craft/typography-hierarchy.md`
- Forms → `craft/form-validation.md` + `craft/state-coverage.md`
- RTL/Arabic locales → `craft/rtl-and-bidi.md`

The upstream catalog lives at
`C:\Users\elaz2\AppData\Local\Programs\Open Design\resources\open-design\`
(design-systems/, craft/, design-templates/, skills/, frames/). Consult it for
additional design systems and artifact blueprints not yet copied into
`docs/design/`.

## LinkMAX brand mapping (Modular Collage)

- Paper surface: `#F4F5F0` (light), brand tokens in `src/index.css`
  (`--brand-paper`, `--brand-ink`, `--brand-coral`, `--brand-mint`,
  `--brand-orange`)
- Dark cloud-platform theme for dashboard/developer/admin surfaces:
  near-black surfaces, hairline borders instead of shadows, coral accent,
  `tabular-nums` on KPIs
- Max component radius 8px (controls 6px, chips/pills 9999px)
- Depth via borders (`--hairline`) not shadows; shadows only for focus and
  small lifts

## Hard rules

1. Never invent tokens: map to existing CSS variables or brand tokens.
2. Accent (coral) at most twice per screen.
3. No emoji as feature icons; monoline SVG with `currentColor` (lucide).
4. No invented metrics in marketing copy; use real product numbers or remove.
5. No two-stop hero gradients, no Tailwind-default-indigo accents.
6. Every stateful widget has loading/empty/error states.
7. Every new string is i18n'd (`t()` + locale JSON), `npm run i18n:fill`.
8. Check RTL layout for `ar`/`ur` locales before finishing a UI change.
