# i18n and L10n Operations

## Rollout plan

1) Staging validation
- Criteria: CI green, i18n:check passes, lint:i18n passes, e2e:ci passes.
- Validate localized SEO tags on staging for ru, en, kk.

2) Canary release
- Use feature flag or routing rule for 5 to 10 percent traffic.
- Hold for 24 hours with monitoring and alerting enabled.

3) Full rollout
- Proceed after 48 hours with no P0 or P1 alerts.
- Freeze translation edits for 24 hours post rollout.

4) Rollback plan
- Code rollback: revert to previous release tag.
- Content rollback: revert content versions per slug and locale.

## Smoke tests checklist

1) Language switch persists after refresh.
2) Landing hero title changes per locale.
3) Pricing CTA and plan labels localized.
4) Auth error message localized.
5) Billing error and currency formatting localized.
6) Onboarding tooltip localized.
7) Empty state localized.
8) Toast notification localized.
9) Email preview localized.
10) Meta title and description change per locale.
11) Canonical URL matches locale.
12) hreflang includes ru, en, kk, x-default.
13) Sitemap contains locale alternates.
14) No mixed language strings on page.
15) Fallback works for missing locale content.

## Governance and ownership

- Glossary and style guide owner: Localization Lead.
- Translation review: Localization Lead and QA Lead.
- Content publish: Content Manager with QA approval.
- i18n bugs: Engineering Lead.

## RACI

| Activity | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Glossary updates | Localization Lead | Product Lead | Support, Marketing | Engineering |
| Translation review | Localization Lead | Product Lead | QA Lead | Engineering |
| Content publish | Content Manager | Product Lead | QA Lead | Localization Lead |
| i18n CI checks | Engineering Lead | Engineering Manager | QA Lead | Product |
| i18n bug triage | Engineering Lead | Engineering Manager | QA Lead | Support |
| SEO localization checks | SEO Engineer | Product Lead | Engineering | Marketing |
| Monitoring setup | DevOps | Engineering Manager | QA Lead | Product |

## Policies and quality gates

- No PR merge with missing keys or placeholder mismatch.
- No content publish without required locales for critical pages.
- No fallback for billing, auth, and legal content.
- Definition of Ready for new locale: 100 percent coverage for critical flows, SEO tags present, sitemap updated, monitoring enabled.

## Monitoring and alerts

Log events:
- missing_key, missing_content_translation, placeholder_error, mixed_language_detection, seo_missing_tags.

Alerts:
- P0: missing keys on checkout, billing, auth.
- P1: missing translations on public pages.
- P1: placeholder errors on public pages.
- P2: missing hreflang or canonical tags.

Dashboards:
- Locale coverage percent by page and slug.
- Missing keys trend by locale.
- Missing content translations trend.
- E2E i18n pass rate.
- SEO tag compliance by locale.

## KPI and reporting

30 days:
- 95 percent UI coverage ru, en, kk.
- Zero missing keys in critical flows.

60 days:
- 100 percent UI coverage ru, en, kk.
- E2E i18n pass rate at or above 98 percent.

90 days:
- 100 percent UI and content coverage for public pages.
- Zero placeholder errors.

Weekly report:
- Missing keys count and trend.
- Content coverage percent by locale.
- E2E i18n pass rate.

Monthly report:
- KPI progress.
- Regression analysis and root cause summary.
- Upcoming translation scope.

## Handoff package

Playbook outline:
1) Add a new string.
2) Pick a key.
3) Run tests.
4) Use content admin.
5) Fix missing keys.

Checklists:
- PR review checklist.
- Content publish checklist.
- Release checklist.

Known pitfalls:
1) Placeholder mismatch.
2) Missing keys in billing or auth.
3) Mixed language on one page.
4) Locale not persisted.
5) SEO tags not localized.
6) Content published without KK.
7) Outdated import file overwrites translations.
8) Duplicate keys with different meaning.
9) hreflang missing x-default.
10) Canonical for wrong locale.

## Checklists

PR review checklist:
1) New UI strings use `t('...')` and no hardcoded JSX strings.
2) Keys exist in ru, en, kk.
3) Placeholders match across locales.
4) Namespace is consistent with feature scope.
5) CTA labels are short and action based.
6) Errors include action guidance.
7) No mixed language on the same screen.
8) SEO tags updated when public content changes.
9) i18n checks passed.
10) E2E i18n tests updated if copy changed.

Content publish checklist:
1) Slug follows naming rules.
2) Required locales are filled.
3) Placeholders validated.
4) Preview looks correct.
5) SEO fields present per locale.
6) No mixed language in fields.
7) Version incremented.
8) QA approval recorded.
9) Publish to staging first.
10) Smoke tests pass after publish.

Release checklist:
1) CI green.
2) i18n:check passes.
3) lint:i18n passes.
4) E2E i18n tests pass.
5) Coverage report updated.
6) SEO compliance verified.
7) Canary plan ready.
8) Rollback plan confirmed.
9) Stakeholders informed.
10) Monitoring alerts enabled.

## Definition of Done

1) All UI strings in ru, en, kk.
2) All content slugs published in required locales.
3) Placeholders validated for UI and content.
4) lint:i18n passes.
5) i18n:check passes.
6) E2E i18n tests pass.
7) SEO meta tags localized.
8) hreflang and canonical are correct.
9) Sitemap includes locale alternates.
10) Monitoring shows no P0 issues.
11) Rollback validated in staging.
12) Handoff docs updated and shared.
