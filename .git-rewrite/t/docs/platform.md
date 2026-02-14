# lnkmx Platform Documentation

## Platform overview

lnkmx is a SaaS platform for building AI-assisted mini-sites and link-in-bio pages. The product is optimized for fast publishing, lead capture, and simple analytics.

## Company information

- Legal entity: ИП BEEGIN
- BIN: 971207300019
- Address: г. Алматы, ул. Шолохова, д. 20/7
- Email: admin@lnkmx.my
- Phone: +7 705 109 76 64

## Architecture

### Frontend

- React 18 + TypeScript + Vite
- Tailwind CSS with shadcn/ui
- i18next for RU/EN/KK
- PWA capabilities
- Motion system (CSS + IntersectionObserver)

### Backend

- Supabase (Postgres, Auth, Storage)
- 20 Edge Functions for AI and notifications
- Row Level Security for data isolation

### AI integration

- AI draft generation for initial page structure and copy
- Translation for RU/EN/KK content
- Chatbot for visitor engagement

## Data model (high level)

### Core entities

- `pages`: public page metadata, SEO settings, theme.
- `blocks`: structured blocks for each page (28 types).
- `user_profiles`: plan, limits, and profile data.
- `subscriptions`: plan status and billing metadata.

### Leads and CRM

- `leads`: lead records collected from forms.
- `lead_interactions`: status history and notes.
- `crm_automations`: automated follow-up rules.

### Analytics

- `analytics`: page views, CTA clicks, block clicks, and marketing events.

### Social features

- `friendships`: user connections.
- `shoutouts`: cross-promotion between users.
- `collaborations`: joint page features.

### Events and Bookings

- `events`: event management.
- `event_registrations`: attendee tracking.
- `bookings`: appointment scheduling.
- `booking_slots`: availability management.

### Gamification

- `user_tokens`: Linkkon token balances.
- `token_transactions`: token economy history.
- `user_achievements`: unlocked achievements.
- `daily_quests_completed`: quest progress.
- `weekly_challenges`: challenge tracking.

## i18n approach

- UI strings live in `src/i18n/locales/{ru,en,kk}.json`.
- Every marketing change requires RU/EN/KK updates.
- Use short, concrete copy and avoid long dash characters.

## SEO approach

- Marketing pages use localized titles, descriptions, and canonical URLs.
- JSON-LD schema is injected for WebPage, Organization, and FAQ.
- Sitemap and robots are maintained in `public/`.
- Dynamic sitemap generation via Edge Function.

## Adding new blocks safely

1. Add the block type to domain types and block registry (`src/lib/block-registry.ts`).
2. Implement renderer (`src/components/blocks/`) and editor UI (`src/components/block-editors/`).
3. Add localization keys for labels and helper text.
4. Update free vs Pro gating rules if needed.
5. Add analytics tracking for clicks or form submits.

## Public routes

- `/` landing (v5)
- `/gallery` gallery
- `/pricing` pricing
- `/alternatives` comparisons
- `/terms` terms
- `/privacy` privacy
- `/payment-terms` payment terms

## Component structure

### Landing page v5 (current)

Located in `src/components/landing-v5/`:

- `NavBar.tsx` - Navigation with scroll effects
- `HeroSection.tsx` - Hero with animated preview
- `ProblemSolutionSection.tsx` - Pain points and solutions
- `HowItWorksSection.tsx` - 3-step process
- `ResultsSection.tsx` - Use cases by niche
- `BlocksShowcaseSection.tsx` - Block type showcase
- `ExamplesGallerySection.tsx` - Live examples
- `TrustSection.tsx` - Social proof
- `PricingSection.tsx` - Pricing plans
- `SEOExplainerSection.tsx` - SEO benefits
- `FAQSection.tsx` - FAQ accordion
- `FinalCTASection.tsx` - Final call to action
- `FooterSection.tsx` - Footer with links

### Motion system

Located in `src/components/motion/`:

- `Reveal.tsx` - Scroll-reveal animation wrapper
- `useReducedMotion.ts` - Accessibility hook for reduced motion
- Supports `fade-up`, `fade-left`, `fade-right`, `scale` directions
- `Stagger` component for cascading animations
- Respects `prefers-reduced-motion`

### Dashboard v2 (current)

Located in `src/components/dashboard-v2/`:

- Layout components (header, sidebar, navigation)
- Screen components (editor, analytics, CRM, settings)
- Common utilities and dialogs

## Edge Functions

| Function                      | Purpose                      |
| ----------------------------- | ---------------------------- |
| `ai-content-generator`        | AI page/block generation     |
| `chatbot-stream`              | AI chatbot responses         |
| `translate-content`           | Content translation          |
| `create-lead`                 | Lead capture                 |
| `send-booking-notification`   | Booking alerts to Telegram   |
| `send-booking-reminder`       | Booking reminder automation  |
| `send-lead-notification`      | Lead alerts to Telegram      |
| `send-collab-notification`    | Collaboration alerts         |
| `send-friend-notification`    | Friend request alerts        |
| `send-social-notification`    | Social activity alerts       |
| `send-team-notification`      | Team activity alerts         |
| `send-trial-ending-notification` | Trial expiry reminders    |
| `send-weekly-digest`          | Weekly summary emails        |
| `send-weekly-motivation`      | Motivational notifications   |
| `telegram-bot-webhook`        | Telegram bot integration     |
| `telegram-password-reset`     | Password reset via Telegram  |
| `validate-telegram`           | Telegram auth verification   |
| `generate-sitemap`            | Dynamic sitemap generation   |
| `process-crm-automations`     | CRM automation workflows     |
| `seed-demo-accounts`          | Demo data seeding            |
