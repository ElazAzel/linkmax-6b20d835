# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Internal Optimization (Agent Rules — 2026-02-20)
- **Agent Roles and Skills Structure**: Relocated the `.agents` directory items into `.agent/rules` to streamline agent context and maintain explicit localization.
- **Config Re-alignment**: Re-aligned `ANTIGRAVITY_CONFIG.md` to refer directly to `.agent/rules` over deprecated paths, safely deleting `.agents`.

### Added (Infrastructure — 2026-02-18)
- **Pixel Proxy**: New `pixel-proxy` edge function forwarding events server-side to Facebook CAPI, TikTok Events API, and GA4 Measurement Protocol — bypasses ad-blockers for ~30-40% event recapture.
- **Dual Pixel Firing**: `TrackingScripts.tsx` now fires both client-side pixel + server-side `sendBeacon` to `/functions/v1/pixel-proxy` for all events (PageView, Lead, Purchase, InitiateCheckout).
- **Edge Function Warm-up**: `pg_cron` job pings `seo-ssr`, `telegram-bot-webhook`, and `pixel-proxy` every 4 minutes via `pg_net` to prevent cold start latency.
- **Warm-up Endpoints**: `?warmup=true` early return added to `seo-ssr`, `telegram-bot-webhook`, and `pixel-proxy`.

### Security (Deep Audit Fixes — 2026-02-18)
- **Critical Auth Bypass**: Added `auth.uid()` checks to `get_token_analytics` (admin-only), `claim_daily_token_reward`, and `process_marketplace_purchase`.
- **Rate Limiting**: Added in-memory rate limiting (60 req/min/IP) to `seo-ssr` edge function to prevent DDoS.
- **Booking Data Leak**: Ensured overly permissive RLS policy dropped, replaced with owner/user-only policies.
- **Double-Booking Prevention**: Added partial unique index on `(page_id, block_id, slot_date, slot_time)` for active bookings.
- **Timezone Support**: Added `timezone` column to bookings table.
- **XSS Hardening**: Removed `allow-forms`, `allow-popups`, `allow-modals` from CustomCodeBlock iframe sandbox.
- **OAuth returnTo**: Fixed `signInWithGoogle`/`signInWithApple` to actually pass `returnTo` parameter in redirect URL.
- **GDPR Compliance**: Added `export_user_data` and `delete_user_account` SQL functions with full cascading delete.
- **Cookie Consent**: Added consent banner with accept/reject, gating all analytics tracking behind explicit consent.

### Anti-Spam & Observability (2026-02-18)
- **Cloudflare Turnstile CAPTCHA**: Added invisible CAPTCHA to `FormBlock` with server-side verification in `create-lead` edge function.
- **Error Reporting**: Replaced Sentry TODO stubs in `logger.ts` with working production error reporter (structured errors via `sendBeacon` to `VITE_SENTRY_DSN`).
- **CSP Hardened**: Added `challenges.cloudflare.com` to script-src, connect-src, frame-src for Turnstile support.

### i18n / Locale Formatting (2026-02-18)
- **Centralized formatters**: New `src/lib/format.ts` with `formatDate`, `formatDateTime`, `formatDateShort`, `formatCurrency`, `formatRelativeTime` using correct BCP 47 locale (ru→ru-RU, en→en-US, kk→kk-KZ).
- **Fixed hardcoded locales**: Replaced 11 `toLocaleDateString('ru-RU', ...)` calls in `TokensPanel`, `LeadsPanel`, `LeadDetails`, `ActivityScreen` with centralized formatters.
- **Fixed hardcoded locales (prices)**: Replaced `toLocaleString('ru-RU')` in `PricingBlock` and `ProductBlock` with `getLocale(i18n.language)`.

### Accessibility (2026-02-18)
- **aria-labels**: Added `aria-label` to 11 icon-only buttons in `EditorToolbar` and `BlockManager`.
- **DialogDescription**: Added missing `DialogDescription` to dialogs in `EventBlock`, `ProductBlock`.

### Bug Fixes (2026-02-18)
- **ProductBlock**: Removed duplicate `redirectToTokenPurchase()` call causing double redirect.

### Added
- `manifest.json` for PWA support (fixed broken `/manifest.webmanifest` link in `index.html`).
- `search` block type added to `block-registry.ts` `PREMIUM_BLOCK_TYPES` (was only in `useFreemiumLimits`).
- Hreflang tags (`ru`, `en`, `kk`, `x-default`) in SSR output for international SEO.

### Added
- **Block Editor Improvements**:
    - Enabled drag-and-drop on mobile devices by attaching listeners to the entire block card (with long-press support).
    - Improved click-to-edit reliability on Desktop by removing restrictive event prevention.
    - Fixed "Editor not opening" on PC by memoizing block icons to prevent re-render loops and suspension issues.
    - Added missing `DialogDescription` to desktop editor for accessibility compliance.
- Unit test files for `ai-content-generator` and `create-lead` edge functions.
- `PLATFORM_SNAPSHOT.md`, `RUNBOOKS`, `ADRs` (initial overhaul).
- **Liquid Glass Design Overhaul**: Comprehensive platform-wide refactor to adopt a premium, modern aesthetic.
    - Updated all 28 block types (interactive and static) with glassmorphism, backdrop blurs, and premium shadows.
    - Redesigned `BookingBlock` with a modern calendar UI, floating confirmation cards, and improved time slot selection.
    - Enhanced `CarouselBlock`, `VideoBlock`, and `SocialsBlock` with interactive states and glass-style containers.
    - Standardized naming and subtitles with `text-gradient` and premium typography.
- **Pixel Analytics Integration**: Added support for Facebook, TikTok, GA4, and Yandex Metrika in Page Settings.
- **SEO Landing Page**: Dedicated `/seo-landing` page highly optimized for SEO/AEO/GEO, serving structured data to bots and redirecting humans.
- **Cloudflare Worker**: Added for SEO bot detection and pre-rendering support.
- **Admin Partners**: Added Partners management tab in Admin panel.


### Security
- **Repository Hardening**:
    - Changed visibility to **Private** to prevent unauthorized copying.
    - Rewrote git history cross-branch to purge accidentally committed `.env` secrets.
    - Unified `.gitignore` to ensure core internal docs are tracked in the private repo while keeping secrets out.
    - Documented security decisions in [ADR 0024](file:///c:/Users/admin/OneDrive - УО 'Алматы Менеджмент Университет'/Документы/inkmax/docs/ADR/0024-repository-security.md).
- Hardened `upsert_user_page` function to enforce `auth.uid()` check.
- Fixed RLS policies for `languages` and `language_upload_history` tables to use correct `has_role()` check.
- **Comprehensive Security Hardening**:
  - Secured Token Economy functions (`add_linkkon_tokens`, etc.) with `auth.uid()` checks.
  - Restricted `bookings` table RLS to owner (page owner) and user (client) only.
  - Added input validation (email regex, length limits) to `create-lead` and `send-booking-notification` edge functions.
  - Fixed admin check in `language-upload` edge function to use `has_role` RPC.
- **Content Security Policy (CSP)**: Updated `index.html` to allow analytics (FB, TikTok, GA4, Yandex) and localization (Locize) scripts while maintaining security.

### Fixed
- **Authentication**: Resolved infinite redirect loop during Google/Apple sign-in by correcting the `redirect_uri` to point to `/auth/callback`.
- **Block Editor**: Fixed "Editor not opening" on PC and intermittent issues on mobile by optimizing event handling and drag sensors.
- Type errors and missing Deno namespace references in `ai-content-generator` and `create-lead` edge functions.
- "Screen lock" glitch in Block Editor by disabling modal behavior on style selectors.
- Missing `cn` import in `Pricing.tsx`.
- **Build System**: Restored `vite build` command in `package.json` as the project uses Vite, resolving a mismatch where scripts referenced `next build`.
- **Token System**: Fixed `406 Not Acceptable` error when fetching token balance for new users (caused by `single()` on empty result).
- **Advanced Grid Layout**:
  - Implemented flexible block sizing: 1x1, 2x1, 1x2, 2x2.
  - Added Block Size Selector to the editor interface.
  - Refactored grid system to use dense packing for optimal layout.
- **Audit & Fixes**:
  - Resolved data loss issue in Block Editor with unsaved changes protection.
  - Fixed mobile layout issues in Grid Editor.
  - Removed deprecated `UnifiedBlockEditor` component.

### Optimized
- Codebase quality by resolving over 700 linting warnings/errors.


### Changed
- **Mobile Editor UX**:
    - Implemented dedicated drag handles (`::` icon) for block reordering on mobile to prevent conflict with "Tap to Edit".
    - Removed artificial delays on mobile interactions for instant responsiveness.
    - Added `framer-motion` animations for smoother UI transitions in the editor.
- **Auth Refactoring**:
    - Removed fragile `next/navigation` shim usage in Auth components in favor of standard `react-router-dom` hooks (`useNavigate`, `useSearchParams`).
    - Migrated from `@lovable.dev/cloud-auth-js` wrapper to native `supabase.auth.signInWithOAuth` for better control and stability.
    - Implemented authentic `returnTo` redirection support for Google and Apple sign-ins.
    - Standardized `Auth.tsx` and `AuthCallback.tsx` implementation.
- Standardized local development instructions to use `npm` instead of `bun`.
- Overhauled Pricing page to unify plans into a single Pro card with "Try for free" option.
- **Next.js Migration**:
    - Replaced Vite with Next.js 14+ (App Router).
    - Implemented Server-Side Rendering (SSR) for Public Pages, Landing, Auth, and Pricing.
    - Added Dynamic Metadata Support for better SEO and AI indexing.
    - Updated project structure to use `src/app` directory.
    - **Fixes & Improvements**:
      - Resolved 50+ strict TypeScript errors (implicit any, index types, null checks).
      - Patched `LanguageContext` and `storage.ts` for SSR safety.
      - Fixed Git push timeout and large file errors (`.next` directory removal).
      - Configured `next.config.mjs` for seamless environment variable migration.

## [0.0.0] - 2026-02-13

### Added
- Initial project structure and documentation.
