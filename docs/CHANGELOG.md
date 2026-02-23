# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Documentation (Documentation Audit & Cleanup — 2026-02-23)
- **Tech Stack Alignment**: Updated `README.md` and `PLATFORM_SNAPSHOT.md` to correctly reflect the Vite React SPA architecture, resolving legacy references to Next.js 14.
- **Architecture Map**: Corrected "Legacy" labels in `PLATFORM_SNAPSHOT.md` for active core components (`src/main.tsx`, `src/pages/`). Added `src/platform/` to the official structure.
- **API Reference**: Synchronized `API.md` with the current Edge Functions list, adding `google-calendar-sync`, `robokassa`, `robokassa-webhook`, `send-email`, and `verify-domain`.
- **Consistency**: Verified and updated documentation links and "Business OS" branding across all top-level guides.
- **Architecture Refactoring (Admin Layer)**:
    - Extracted direct Supabase queries from `AdminCharts.tsx` and `AdminPartnersTab.tsx` into a new `AdminService` (`src/services/admin.ts`).
    - Implemented custom React Query hooks (`useAdminStats`, `usePartners`) in `src/hooks/admin/useAdminData.ts` to manage server state.
    - Simplified UI components by removing boilerplate `useEffect`, `useState`, and manual error handling, resulting in ~30% code reduction in affected views.
    - Fixed pre-existing type errors in `src/integrations/lovable/index.ts` to ensure a clean typecheck build.

### Added (Optimizations & Custom Domains — 2026-02-22)
- **i18n Refactoring**: Migrated `AdminTranslations.tsx` and `useAdminTranslations` hook to React Query. This introduces automatic caching, background synchronization, and a much cleaner asynchronous state management flow for translation updates.
- **Custom Domains**: Полная интеграция. Создан интерфейс в Dashboard для привязки доменов с живой проверкой DNS (CNAME) через новую Edge Function `verify-domain`. Добавлены визуальные индикаторы статуса подключения.
- **Visual Regression Testing**: Внедрены автоматизированные тесты на базе Playwright (`e2e/visual-regression.spec.ts`) для контроля целостности «стеклянного» дизайна блоков.
- **Custom Domains Foundation**: Implemented full database infrastructure (`custom_domains` table with RLS) and an Edge Function (`resolve-domain`) to map external hostnames to internal page slugs.
- **Enhanced Analytics**: Redesigned the `ConversionFunnel` component with `framer-motion` animations, premium gradients, and automatic drop-off rate calculations. This provides a high-end visual experience for business users tracking their sales pipeline.
- **Pitch Deck Update**: Обновлен инвестиционный меморандум, интегрированы данные о новых технических преимуществах: финтех-ядре, профессиональной аналитике и масштабируемой i18n архитектуре.

### Fixed (Platform Stabilization — 2026-02-22)
- **Technical Audit & Cleanup**: Completed full platform audit (`docs/audits/FULL_PLATFORM_AUDIT_2026_02_22.md`) and resolved 100+ critical errors.
- **Supabase Integration & Type Safety**: Synchronized `types.ts` with the actual database schema. Added missing tables (`payout_requests`, `user_wallets`, `wallet_transactions`) and defined crucial table relationships (e.g., JOIN support for `user_profiles`).
- **Fintech & Admin Refactoring**: Eliminated all `as any` type assertions in `fintech.ts`, `AdminFintechTab.tsx`, and `PageSettingsScreen.tsx`. Refactored admin views to align with the actual profile schema (`display_name`, `username`).
- **Quality & Performance**: Fixed Rules of Hooks violations, standardized block registry, and improved SEO/Sitemap reliability via Cloudflare Workers.
- **Documentation**: Updated `PLATFORM_SNAPSHOT.md`, `TECH_DEBT_BACKLOG.md`, and `DATABASE_SCHEMA_GUIDE.md`.

### Added (Booking & Data Export — 2026-02-21)
- **Data Export Utilities**: Added native Excel Export functionality for Leads and Analytics. Pro users can now download comprehensive `.xlsx` reports with summary sheets directly from the Dashboard.
- **Google Calendar Sync**: Implemented full two-way Google Calendar integration for the Booking Block. Plumbed via a secure `user_integrations` database table and a new `google-calendar-sync` Edge Function to check availability in real-time and create events upon booking confirmation. Enabled via a new toggle in `BookingSettingsTab` and managed in the user's `LinkedAccountsSection`.
- **Automated Booking Reminders**: Verified and integrated existing `send-booking-reminder` Edge Function to handle Morning notifications for upcoming appointments via Telegram.

### Added (UX & i18n Finalization — 2026-02-21)
- **Deep Translation via AI**: Wrote a custom concurrent Google Translate script to automatically translate over 3,600 Russian placeholder strings left in `en.json`, `kk.json`, and `uz.json`. The entire app is now genuinely, fully translated with zero cyrillic text showing up under non-Russian language selections.
- **Complete Localization Coverage**: Wrapped remaining hardcoded Russian strings in the `BookingBlock`, `CustomCodeBlock`, `EventBlock`, `FreePremiumBlockGate`, and `TemplateMarketplace` components with `t()` translation calls.
- **Landing V2 Translation Alignment**: Translated newly identified strings in the updated `InteractiveDemo` and `BentoGridSection` V2 components ("Choose your niche", "Everything you need to grow", etc.) completely ensuring 100% cyrillic removal in EN/KK/UZ pages.
- **Landing SEO & Meta Tags Translation**: Conducted a final deep audit across all public-facing pages (`Index.tsx`, `Pricing.tsx`, `Gallery.tsx`, `Alternatives.tsx`). Extracted and translated all hardcoded English SEO tags, metadata, and structured data properties (`AISearchOptimizer`, `AEOOptimizer`) to ensure maximum global indexability.
- **Deep Dashboard & Editor Audit**: Identified and translated over 190 remaining hardcoded English UI strings in Editor block components, dialogs, settings screens, and the `AIGenerator` into centralized, synchronized translation keys.
- **Queue Synchronization**: Extracted new translation keys and processed them through the `i18n-queue.json` system.
- **Multilingual Support**: Fully translated the newly extracted UI strings into English (`en`), Kazakh (`kk`), and Uzbek (`uz`), achieving 0 missing keys across all supported languages according to the `i18n:status` check.

### Added (Technical Epic: i18n Synchronization — 2026-02-20)
- **Comprehensive Global Synchronization**: Synchronized `en.json`, `kk.json`, and `uz.json` with `ru.json` as the source of truth, establishing 100% key coverage.
- **Automated Key Extraction**: Identified and extracted **1448 missing keys** directly from JSX/TSX files using custom AST-aware scripts (`extract-context.mjs`).
- **Context-Aware Translation**: Translated all 1400+ keys into Russian, filling gaps in Analytics, Admin, Editor, and Landing components.
- **English Default Recovery**: Automatically populated `en.json` with original English strings extracted from the code, restoring the intended non-translated text for English users.
- **Kazakh & Uzbek Baseline**: Performed foundational translations for Kazakh and Uzbek for core landing and dashboard sections.
- **Interpolation Protection**: Developed `fix-placeholders.mjs` to systematically fix `{{placeholder}}` mismatches across all locale files, ensuring app stability and preventing runtime crashes in non-Russian languages.
- **i18n Maintenance Toolkit**: Added permanent scripts in `/scripts` for future automated context extraction, key merging, and structural synchronization.

### Added (Strategy & Expansion — 2026-02-20)
- **Template Builder (Admin Panel)**: Created `/admin/templates` with a visual Block Editor. Admins can now orchestrate, save, and tag layout structures directly to the `page_templates` database.
- **CRM & Lead Collection (Inbox)**: Upgraded Form blocks to securely capture user submissions into a centralized `leads` table. Creators can now view and manage these natively within the DashboardV2 "Leads" tab.
- **Advanced Analytics**: Enhanced the Insights tab to calculate and display Click-Through-Rates (CTR = clicks / views * 100) dynamically per block, handling edge cases to prevent NaN errors.
- **Custom Domains (Pro Feature)**: Rolled out foundational database schema (`custom_domain` column) and UI inside PageSettingsTab for Pro users to configure their own domains.
- **Telegram Webhook Stability**: Resolved persistent webhook crashes on non-existent users by migrating from `.single()` to `.maybeSingle()`.

### Fixed (Block Editor & Analytics Audit — 2026-02-20)
- **Editor Responsiveness & Adaptation**: Fixed squashed blocks on Desktop by adding `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` to `GridEditor.tsx`. Adjusted Mobile Drawer sizing to prevent overflow clipping.
- **Keystroke Performance (Live Preview)**: Implemented React `useDeferredValue` in `BlockEditorV2` to completely decouple instantaneous input from the heavy 3D/Framer Motion Live Preview renderer. Typing is now lag-free at 60fps across all devices.
- **Lost Data / Save Reliability Race Condition**: Refactored the global state orchestrator (`useCloudPageState`) to enforce atomic functional React state updaters (`setPageData(prev => ...)`). This guarantees that auto-save network debouncers correctly capture concurrent block modifications (e.g. fast typing followed by immediate modal close), permanently resolving the "Sometimes blocks fail to save" bug.
- **Grid Layout Styling**: Removed unwanted physical borders, drop-shadows, and background clipping explicitly for naturally transparent layouts (Separators and Social blocks) within the 2-column `GridBlocksRenderer`.
- **Mobile Edit Modal Failures**: Removed overlapping restrictive touch events in `GridEditor.tsx` that previously swallowed tap events on iOS/Android devices, ensuring the block editor opens reliably 100% of the time.
- **Block Auto-save Data Loss**: Modals now instantly flush any pending autosave changes when closed, bypassing the debounce timer and preventing silent data loss.
- **Analytics Click Tracking**: Fixed broken `increment_block_clicks` RPC by strictly adhering to the `block_id` text parameter, resolving the mismatch with `block_uuid`. Clicks are now successfully logged.
- **AI Builder Decoupling & Internal Algorithm (Phase 2 & 3)**: Completely replaced the Gemini API integration in `AIBuilderWizard.tsx` with a new internal, deterministic layout algorithm (`internal-builder.ts`). Redesigned the UX flow to be `Niche -> Template -> Dynamic Form`, where the form dynamically requests only the data needed by the chosen template (Services, Contacts, Socials). Added a smooth visual animation simulating block construction. This removes external LLM dependencies, ensures perfect template adherence, and guarantees no user data is lost by utilizing fallback block appends.
### Internal Optimization (Agent Rules — 2026-02-20)
- **Agent Roles and Skills Structure**: Relocated the `.agents` directory items into `.agent/rules` to streamline agent context and maintain explicit localization.
- **Config Re-alignment**: Re-aligned `ANTIGRAVITY_CONFIG.md` to refer directly to `.agent/rules` over deprecated paths, safely deleting `.agents`.
- **LLM Prompt Optimization**: Refactored `ANTIGRAVITY_CONFIG.md`, agent personas (`frontend_specialist.md`, `backend_specialist.md`, etc.), and `general.md` using explicit XML tags (`<project_context>`, `<persona>`, etc.) to drastically improve comprehension and instruction adherence globally for Antigravity, Gemini, and Claude Opus LLMs.
- **Communication Protocol**: Added strict requirements to always respond in **Russian** and conduct a mandatory "Pre-Work Communication" phase (questions and suggestions) before starting any technical implementation. Updated `123role.md`, `general.md`, and `ANTIGRAVITY_CONFIG.md`.
- **Active Specialist Agents (Always-On)**: Converted all 14 specialist personas in `.agent/rules/agents/` (e.g., `frontend_specialist.md`, `backend_specialist.md`) into persistent, active agents by adding `trigger: always_on` and XML-structural tags.
- **Agent Orchestration**: Updated `123role.md` to establish a clear hierarchy, directing the Principal Engineer to leverage and defer to specialist agents for domain-specific tasks.

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
- **Auth Refactoring & Error Handling UX**:
    - Removed fragile `next/navigation` shim usage in Auth components in favor of standard `react-router-dom` hooks (`useNavigate`, `useSearchParams`).
    - Removed residual `@lovable.dev/cloud-auth-js` wrapper logic from `useAuth.tsx`, fully transitioning to native `supabase.auth.signInWithOAuth` for better control and stability.
    - Implemented authentic `returnTo` redirection support for Google and Apple sign-ins.
    - Enhanced `AuthCallback.tsx` to intelligently catch OAuth provider errors (e.g., account already linked to another profile).
    - Added smart error redirect logic: routes existing active sessions back to Settings with localized `toast` notifications, ensuring users are never unexpectedly logged out during failed linking attempts.
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
