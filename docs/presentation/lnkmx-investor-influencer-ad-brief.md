# lnkmx Investor/Influencer Ad Brief

## Goal

Create a 20-45 second investor/influencer-style product ad for `lnkmx` that positions it as more than a link-in-bio tool.

Core narrative:
`lnkmx` starts as a public page builder, then expands into analytics and business operations.

One clear CTA:
`Build the page. Run the business.`

## Sora-Ready Prompt

Create a premium 35-second product ad for `lnkmx`, a mobile-first creator and micro-business platform. The tone is a blend of startup-investor confidence and creator-economy polish. The visual language should feel modern, expensive, fast, and credible, not hype-y or scammy. Use cinematic lighting, macro UI shots, handheld creator-energy moments, subtle camera push-ins, smooth whip transitions, layered screen composites, and elegant motion graphics. Show the product as a progression: from building a public page, to seeing analytics, to managing leads and business workflows in one dashboard.

Style references:
- founder-mode product film
- premium SaaS launch ad
- influencer-tech ad with investor polish
- clean, believable UI-centric storytelling

Visual priorities:
- phone-first product views
- polished dashboard close-ups
- crisp UI overlays
- modern creator workspace
- momentum, clarity, and operational depth

Story beats:
1. Start with the pain of fragmented tools and attention chaos.
2. Show `lnkmx` building a polished page fast with multiple content blocks.
3. Transition into analytics: views, clicks, sources, geography, block performance.
4. Reveal the Business Zone/dashboard: leads, deals, contacts, tasks, invoices, documents, automations, calendar.
5. Land on the positioning: not just a link page, a micro-business operating system.
6. End with one strong CTA to visit `lnkmx.my`.

Important guardrails:
- do not invent revenue, user count, conversion uplift, or market leadership claims
- do not imply payments, AI, or events are universal if shown; keep them framed as product capabilities, not guaranteed outcomes
- do not show fake press logos or fake testimonials
- keep the CTA singular and clean
- keep the final tone confident, grounded, and premium

On-screen final CTA:
`lnkmx.my`
`Build the page. Run the business.`

## Final Script

### Duration: 35 seconds

**0:00-0:04**

Narration:
`Most creator tools stop at the link.`

On-screen text:
`A link is not a business.`

**0:04-0:10**

Narration:
`lnkmx turns that page into a working system: build fast, stack 28 block types, and launch pages that actually move people.`

On-screen text:
`28 block types`
`Multi-page`
`AI-assisted setup`

**0:10-0:15**

Narration:
`Every tap becomes signal: views, clicks, traffic sources, geography, and block-level performance.`

On-screen text:
`Know what converts`

**0:15-0:23**

Narration:
`Then it goes beyond the page: leads, deals, contacts, tasks, invoices, documents, events, and automations in one mobile-first dashboard.`

On-screen text:
`From audience to operations`

**0:23-0:29**

Narration:
`This is not another link-in-bio. It's a micro-business OS for people building with attention.`

On-screen text:
`Public page + CRM + analytics`

**0:29-0:35**

Narration:
`If your link is doing marketing, it should be doing operations too. Build yours at lnkmx.my.`

On-screen text:
`lnkmx.my`
`Build the page. Run the business.`

## Shot List

### Shot 1

Length:
`4s`

Visual:
Creator desk, phone, laptop, multiple tabs and tools open, fast fragmented motion, notifications and tabs piling up.

Motion:
Slow push-in, screen reflections, shallow depth of field, rising tension.

On-screen:
`Too many tools`

### Shot 2

Length:
`6s`

Visual:
Close-up of the `lnkmx` editor on mobile. Blocks snap into place. Quick UI flashes of page setup, block picker, and page creation.

Motion:
Swipe transitions, drag-and-drop motion, crisp UI zooms.

On-screen:
`Build fast`

### Shot 3

Length:
`5s`

Visual:
The page switches from editor to live public profile. Clean mobile page, polished layout, CTA buttons, share flow, QR view, and language switcher.

Motion:
Match cut from edit to publish, gentle parallax, polished live-state reveal.

On-screen:
`Go live`

### Shot 4

Length:
`5s`

Visual:
Analytics view with charts, counters, block performance, traffic sources, and geography widgets.

Motion:
Numbers animate upward, charts draw in, camera tracks left to right across UI panels.

On-screen:
`See what converts`

### Shot 5

Length:
`8s`

Visual:
Business Zone montage: leads list, deals Kanban, contacts, tasks, invoices, documents, automations, and calendar. Optionally flash event QR check-in as a premium capability.

Motion:
Fast modular UI transitions, card drags, sheet opens, smooth dashboard fly-through.

On-screen:
`From audience to operations`

### Shot 6

Length:
`4s`

Visual:
Hero composite of phone plus desktop with the product ecosystem visible at once.

Motion:
Slow dolly-in, premium lighting, subtle floating UI layers.

On-screen:
`Not just a link-in-bio`

### Shot 7

Length:
`3s`

Visual:
Final brand lockup on clean background with one product hero screen.

Motion:
Minimal motion, confident hold.

On-screen:
`lnkmx.my`
`Build the page. Run the business.`

## Safe Claims Grounded In Repo

These claims are supported by the current repository and are safe to use in the ad:

- `lnkmx` includes a public-page experience with sharing, QR, language switching, analytics hooks, and custom-domain-aware loading.
- The editor exposes `28` block types.
- The product includes multi-page management.
- The dashboard includes analytics, leads, pages, settings, events, and team areas.
- The Business Zone includes deals, contacts, inbox, tasks, automations, invoices, documents, calendar, products, and analytics.
- Analytics code supports views, clicks, shares, traffic sources, device breakdown, geography, conversions, heatmap tracking, and experiments.
- The repo includes AI-assisted content/page generation flows.
- The repo includes multilingual support and bot-aware SEO/SSR infrastructure.
- The project is configured for Capacitor mobile builds.

## Assumptions And Boundaries

Use these only with labels or careful phrasing:

- `micro-business OS` is positioning language, not a literal technical category.
- If AI is shown, frame it as `AI-assisted setup` or `AI-assisted generation`, not fully autonomous business creation.
- If event QR scanning is shown, treat it as a premium/product capability, not the main product promise.
- Do not claim proven uplift, traction, market leadership, user volume, or revenue.
- Do not imply all users get every feature by default; some capabilities appear tier-gated in the product.

## Internal Evidence Map

- Public page: `src/pages/PublicPage.tsx`
- Dashboard shell: `src/pages/DashboardV2.tsx`
- Block catalog: `src/components/editor/BlockInsertButton.tsx`
- AI generation UI: `src/components/editor/AIGenerator.tsx`
- Analytics screen: `src/components/dashboard-v2/screens/InsightsScreen.tsx`
- Page analytics hook: `src/hooks/analytics/usePageAnalytics.ts`
- Heatmap tracking: `src/hooks/analytics/useHeatmapTracking.ts`
- Experiments: `src/hooks/page/usePageExperiments.ts`
- Business Zone deals: `src/components/zones/ZoneDealsScreen.tsx`
- Business Zone analytics: `src/components/zones/ZoneAnalyticsScreen.tsx`
- Event scanner: `src/pages/EventScanner.tsx`
- i18n: `src/i18n/config.ts`
- Cloudflare SEO worker: `cloudflare-worker/prerender-worker.js`
- Pixel proxy: `supabase/functions/pixel-proxy/index.ts`
- AI content generator: `supabase/functions/ai-content-generator/index.ts`
- Mobile config: `capacitor.config.ts`
