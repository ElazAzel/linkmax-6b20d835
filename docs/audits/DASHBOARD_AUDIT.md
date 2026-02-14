# Dashboard V2 Audit Report
**Date:** 2026-02-13
**Scope:** `src/pages/DashboardV2.tsx`, `src/components/dashboard-v2/**`, `src/hooks/**`

## 1. Executive Summary
The Dashboard V2 architecture is robust, leveraging React best practices like **Lazy Loading** and **Component Composition**. The mobile-first approach is well-implemented. However, there are opportunities for optimization in state management (`useDashboard` hook stability) and component modularity (`SettingsScreen` size).

## 2. Architecture & Structure

### Strengths
- **Lazy Loading:** Effective use of `React.lazy` for all main screens (`Editor`, `Insights`, `Activity`, `Settings`), significantly reducing the initial bundle size.
- **Layout Separation:** Clear separation between `DashboardLayout`, `Sidebar`, and `BottomNav` ensures good responsiveness.
- **Feature Encapsulation:** Complex logic is well-encapsulated in custom hooks (`useLeads`, `usePageAnalytics`, `useBlockEditor`).

### Weaknesses / Tech Debt
- **`useDashboard` Hook Stability:** The `useDashboard` hook returns a new object literal on every render. This defeats the purpose of `React.memo` in child components that consume these values, potentially causing unnecessary re-renders.
- **`SettingsScreen` Complexity:** The component is over 700 lines long and handles mixed concerns (User Account Settings vs. Page Settings). It should be refactored into `PageSettingsTab.tsx` and `AccountSettingsTab.tsx`.
- **Naming Discrepancy:** `PLATFORM_SNAPSHOT.md` refers to `InboxScreen.tsx`, but the file is named `ActivityScreen.tsx` (Fixed).

## 3. Component Analysis

### `DashboardV2.tsx` (Entry Point)
- **Status:** ✅ Healthy
- **Notes:** Handles routing and initialization well. Good use of `Suspense`.

### `EditorScreen.tsx` & `GridEditor.tsx`
- **Status:** ✅ Healthy
- **Notes:**
  - `GridEditor` manages complex DnD logic.
  - `organizeBlocksIntoRows` logic runs on render. It's memoized, but for large pages, this could be a bottleneck.
  - `useBlockEditor` cleanly separates editing logic from UI.

### `InsightsScreen.tsx`
- **Status:** ⚠️ Minor Issues
- **Notes:**
  - AI Insights logic is hardcoded. Should be extracted to `useInsights`.

### `ActivityScreen.tsx` (Inbox)
- **Status:** ✅ Healthy
- **Notes:**
  - Handles Leads and Bookings.
  - Premium gate is well-integrated.

### `SettingsScreen.tsx`
- **Status:** ⚠️ Refactor Needed
- **Notes:**
  - **Size:** ~712 lines, 31KB.
  - **Concerns:** Mixes Page Settings (Slug, SEO, Branding) with Account Settings (Profile, Billing, Security).
  - **Recommendation:** Split into `PageSettingsTab` and `AccountSettingsTab`.

### `PagesScreen.tsx` & `useMultiPage.ts`
- **Status:** ✅ Healthy
- **Notes:**
  - `useMultiPage` manually maps DB columns from snake_case to camelCase. This is fragile. Recommendation: Use generated Supabase types.
  - UI is clean and handles empty states well.

### `MonetizeScreen.tsx`
- **Status:** ✅ Healthy
- **Notes:** Purely presentational. Hardcoded feature lists (localized).

## 4. Performance & Best Practices

- **Render Performance:**
  - `useDashboard` returns a new object every render. **High Priority Fix.**
  - `useCloudPageState` returns a new object every render. **Medium Priority Fix.**

- **Internationalization:** Excellent coverage. `t()` is used consistently.

- **Type Safety:** High. Interfaces are strict.

## 5. Recommendations

### Immediate Actions (High Impact)
1.  **Refactor `SettingsScreen`**: Split into `PageSettingsTab` and `AccountSettingsTab`. This improves maintainability and separation of concerns.
2.  **Optimize `useDashboard`**: Wrap the return value in `useMemo` to stabilize references.

### Maintenance (Medium Impact)
1.  **Extract AI Logic**: Move insights generation from `InsightsScreen` to `src/lib/analytics-insights.ts`.
2.  **Type Hardening**: Replace manual mapping in `useMultiPage` with Supabase generated types.

### Low Priority
1.  **Extract Utilities**: Move `groupLeadsByDate` from `ActivityScreen` to `src/lib/date-utils.ts`.
