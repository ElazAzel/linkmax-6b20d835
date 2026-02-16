# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Block Editor Improvements**:
    - Enabled drag-and-drop on mobile devices by attaching listeners to the entire block card (with long-press support).
    - Improved click-to-edit reliability on Desktop by removing restrictive event prevention.
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
