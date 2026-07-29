# LinkMAX Creative OS Roadmap

## Delivered Foundation

- Modular Collage brand assets and semantic design tokens.
- New landing hero and responsive navigation.
- Unified email access, Google/Apple provider path and device account switching.
- Post-auth destination is the dashboard unless an explicit safe deep link exists.
- Dashboard information architecture: Home, Site, Inbox, Analytics and Business.
- Compact block catalog with categories, search and safe localization fallback.
- `PageTheme v2`, legacy preservation and explicit migration action.

## Release Sequence

### Phase 1: Complete Design-System Adoption

- Move remaining marketing templates to the shared hero, navigation, footer and section primitives.
- Replace legacy hard-coded colors, glass surfaces and radii above 8px.
- Add a component showcase for light/dark, focus, loading, empty and error states.
- Create screenshot baselines at `375`, `768`, `1024` and `1440px`.

### Phase 2: Marketing And Onboarding

- Apply one template to Gallery, Pricing, Customers, Experts, Blog and SEO niche pages.
- Add niche personalization without changing page structure.
- Implement onboarding draft persistence: business, style, AI draft and preview.
- Record conversion events with consent-aware analytics and resilient Edge Function fallback.

### Phase 3: Editor And Customization

- Finish the `280 / canvas / 320` desktop editor layout.
- Add mobile preview with bottom actions and separate block/settings sheets.
- Expand `PageTheme v2` controls for semantic states, image treatment and motion.
- Add a background migration job only after opt-in adoption reaches the release threshold.

### Phase 4: Business Workspace

- Consolidate deals, contacts, tasks, invoices, products, calendar, documents, automations and team under Business.
- Use desktop tables and mobile action rows.
- Standardize Inbox and Analytics periods, KPI definitions and accessible statuses.

### Phase 5: Canary And Production

- Ship behind a user/organization feature flag.
- Run the anonymous and authenticated E2E journey.
- Verify WCAG AA and Web Vitals budgets.
- Enable by cohorts, monitor auth, publish, lead and analytics error rates, then remove the legacy shell.

## Exit Gates

- No translation keys or object-valued translations are rendered.
- No data leaks between device accounts or organizations.
- No ordinary login opens the editor.
- Published legacy pages remain visually stable until explicit migration.
- LCP <= 2.5s, CLS <= 0.1 and INP <= 200ms at the 75th percentile.
