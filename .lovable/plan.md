

## Analysis & Improvement Plan for Business Zone + Platform

### Build Error Fix
The `gcal-callback/index.ts` has a TypeScript error: `sigBytes as ArrayBuffer` fails because `Uint8Array` and `ArrayBuffer` don't overlap. Fix: use `sigBytes.buffer as ArrayBuffer` instead.

### Business Zone Issues Found

**1. Missing `zone-analytics` route in `main.tsx`**
The sidebar has `zone-analytics` and `DashboardV2.tsx` renders it, but `main.tsx` does not register `dashboard/zone-analytics` as a route. This causes a 404 on direct URL access/refresh.

**2. Documents screen - hardcoded Russian labels**
`ZoneDocumentsScreen.tsx` has hardcoded Russian strings for status labels, filter tabs, and header text instead of using `t()` from i18next. This breaks the RU/EN/KK localization standard.

**3. Documents screen - missing `zoneId` prop pattern**
Unlike other zone screens that receive `zoneId` as a prop, `ZoneDocumentsScreen` uses `useZoneContext()` directly. This is inconsistent but functional. Will leave as-is.

**4. `zone-documents` not in bottom nav**
`DashboardBottomNav.tsx` line 86 is missing `zone-documents` from the mobile nav items array. Documents are unreachable on mobile.

**5. Analytics screen is basic**
`ZoneAnalyticsScreen.tsx` (167 lines) shows simple KPI cards without period filtering, charts, or export. The Dashboard (`ZoneDashboard.tsx`) already has richer analytics. The Analytics page should add value beyond the dashboard with exportable reports and deeper breakdowns.

### Implementation Plan

#### Task 1: Fix build error in `gcal-callback/index.ts`
- Change `sigBytes as ArrayBuffer` to `sigBytes.buffer as ArrayBuffer`

#### Task 2: Add missing `zone-analytics` route
- Add `{ path: "dashboard/zone-analytics", element: <Dashboard /> }` to `main.tsx`

#### Task 3: Localize `ZoneDocumentsScreen.tsx`
- Replace all hardcoded Russian strings with `t()` calls
- Apply to STATUS_CONFIG, FILTER_TABS, headers, buttons, empty states

#### Task 4: Add `zone-documents` to bottom nav
- Add documents entry to `DashboardBottomNav.tsx` mobile items

#### Task 5: Enhance `ZoneAnalyticsScreen.tsx`
- Add period selector (7d/30d/90d/All) like ZoneDashboard
- Add deal conversion funnel chart (using recharts)
- Add revenue timeline (paid invoices over time)
- Add task completion rate metrics
- Add export to Excel button (using existing exceljs dependency)
- Use existing hooks (`useZoneDeals`, `useZoneTasks`, `useZoneInvoices`, `useZoneContacts`)

#### Task 6: Polish the overall zone UX consistency
- Ensure all zone screens use consistent header layout pattern (icon + title + description)
- Add loading skeletons to screens that don't have them (Automations, Products)

### Files to Change
- `supabase/functions/gcal-callback/index.ts` (build fix)
- `src/main.tsx` (add zone-analytics route)
- `src/components/zones/documents/ZoneDocumentsScreen.tsx` (localization)
- `src/components/dashboard-v2/layout/DashboardBottomNav.tsx` (add documents)
- `src/components/zones/ZoneAnalyticsScreen.tsx` (major enhancement)

