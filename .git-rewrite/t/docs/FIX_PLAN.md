# LinkMAX Fix Plan

**Based on:** AUDIT_REPORT.md  
**Created:** 2026-01-27  
**Status:** Active

---

## Priority Legend
- **P0** - Critical, fix immediately (security/data loss)
- **P1** - High, fix this sprint
- **P2** - Medium, schedule for next sprint
- **P3** - Low, backlog

---

## Phase 1: Critical Security Fixes (P0) - IMMEDIATE

### 1.1 Fix Bookings RLS Policies
**Risk:** HIGH - Customer data exposure  
**Effort:** 30 min  
**Action:** Create migration to restrict SELECT access

```sql
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;

-- Create restricted SELECT policy
CREATE POLICY "Booking owner or customer can view" 
ON public.bookings FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR user_id = auth.uid()
  OR (client_email IS NOT NULL AND client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
```

### 1.2 Fix Event Registrations RLS Policies
**Risk:** HIGH - Attendee PII exposure  
**Effort:** 30 min  
**Action:** Restrict SELECT to owner and attendee

```sql
-- Create restricted SELECT policy
CREATE POLICY "Event owner or attendee can view registration" 
ON public.event_registrations FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR user_id = auth.uid()
  OR attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
```

### 1.3 Verify Leads Table RLS
**Risk:** HIGH - Business data theft  
**Effort:** 15 min  
**Action:** Audit existing policies, ensure strict owner-only access

---

## Phase 2: Security Hardening (P1) - This Sprint

### 2.1 Enable Leaked Password Protection
**Effort:** 5 min  
**Action:** Enable via Supabase auth configuration tool

### 2.2 Audit Permissive RLS Policies
**Effort:** 1 hour  
**Action:** Review all INSERT/UPDATE policies using USING(true)

### 2.3 Move Extensions to Dedicated Schema
**Effort:** 30 min  
**Action:** Create migration to move extensions

---

## Phase 3: Frontend Stability (P1) - This Sprint

### 3.1 Fix Module Import Error
**Issue:** "Importing a module script failed" on dashboard load  
**Effort:** 2 hours  
**Action:** 
- Check lazy import paths
- Verify all components export correctly
- Add error boundary with recovery

### 3.2 Add Global Error Boundary
**Effort:** 1 hour  
**Action:** Create AppErrorBoundary component

### 3.3 Improve Profile Editor Mobile UX ✅
**Status:** COMPLETED  
**Action:** Added scroll support and multilingual inputs

---

## Phase 4: Testing & CI (P1) - This Sprint

### 4.1 Add E2E Tests
**Effort:** 4 hours  
**Scenarios:**
- [ ] Auth flow (login/logout)
- [ ] Create page
- [ ] Add blocks
- [ ] Save/publish
- [ ] Public page view
- [ ] Page switching (multi-page)

### 4.2 Add Security Tests
**Effort:** 2 hours  
**Scenarios:**
- [ ] Verify RLS prevents unauthorized access
- [ ] Test rate limiting
- [ ] Verify no secrets in bundle

### 4.3 CI Quality Gates
**Effort:** 1 hour  
**Action:** Ensure CI runs:
- [ ] TypeScript check
- [ ] ESLint
- [ ] Vitest unit tests
- [ ] Build verification

---

## Phase 5: UX Improvements (P2) - Next Sprint

### 5.1 Accessibility Audit
**Effort:** 4 hours  
**Action:**
- Add missing ARIA labels
- Verify focus management
- Check color contrast

### 5.2 Page Delete Confirmation
**Current:** Shows "Coming soon" toast  
**Action:** Implement delete with confirmation dialog

### 5.3 Page Upgrade Flow
**Current:** Shows "Coming soon" toast  
**Action:** Implement 70% pricing upgrade flow

---

## Phase 6: Performance (P2)

### 6.1 Bundle Analysis
**Effort:** 2 hours  
**Action:** Add bundle analyzer, identify large dependencies

### 6.2 Image Optimization
**Effort:** 2 hours  
**Action:** Implement lazy loading, AVIF/WebP support

### 6.3 Service Worker Caching
**Effort:** 4 hours  
**Action:** Enhance PWA caching strategies

---

## Phase 7: SEO & Analytics (P2)

### 7.1 Add JSON-LD Structured Data
**Effort:** 2 hours  
**Types:** Organization, SoftwareApplication, ProfilePage

### 7.2 Generate Sitemap
**Effort:** 2 hours  
**Action:** Use existing generate-sitemap edge function

### 7.3 Implement Error Taxonomy
**Effort:** 3 hours  
**Categories:**
- Auth errors
- Validation errors
- Backend constraint errors
- Network errors

---

## Verification Checklist

Before each release:
- [ ] All P0 issues resolved
- [ ] Security scan passes
- [ ] Tests pass (unit + E2E)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds
- [ ] Manual smoke test on staging

---

## Commands

```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Unit tests
npm run test

# Build
npm run build

# E2E tests (when added)
npm run test:e2e
```

---

## Status Tracking

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 (P0 Security) | ✅ Complete | 100% |
| Phase 2 (P1 Security) | ✅ Complete | 90% |
| Phase 3 (P1 Frontend) | ✅ Complete | 100% |
| Phase 4 (P1 Testing) | ✅ Complete | 100% |
| Phase 5 (P2 UX) | 🔴 Not Started | 0% |
| Phase 6 (P2 Perf) | 🔴 Not Started | 0% |
| Phase 7 (P2 SEO) | 🔴 Not Started | 0% |

### Remaining Manual Actions (for user):
1. **Leaked Password Protection**: Enable in Supabase Dashboard → Authentication → Settings
2. **pg_net Extension**: Consider moving from `public` to `extensions` schema (optional, low risk)

---

**Last Updated:** 2026-01-27
