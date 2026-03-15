# LinkMAX Investor/Influencer Ad Concept

## Creative Direction

- Format: `16:9` landscape
- Target runtime: `33s`
- Tone: calm, premium, grounded, investor-grade without startup hype
- Narrative: what starts as a link page becomes the operating system behind a solo business
- Single CTA: `See LinkMAX live at lnkmx.my`
- Sora-safe visual direction: UI-first product film, device mockups, abstract premium environments, no real people, no public figures, no copyrighted characters, no brand-logo dependency

## Script

### Runtime: `0:00-0:33`

**0:00-0:05**

Spoken narration:
`Most link pages stop at attention. LinkMAX is built to take the next step.`

On-screen text:
`A link gets seen.`
`A business gets run.`

**0:05-0:10**

Spoken narration:
`It starts with a polished public page, assembled from modular blocks for the way modern solo businesses actually sell.`

On-screen text:
`Start with the page`

**0:10-0:16**

Spoken narration:
`Then the page starts feeding the system behind it: leads, activity, and follow-up moving into one operating flow.`

On-screen text:
`The page feeds the business`

**0:16-0:22**

Spoken narration:
`Now the signal is measurable: views, clicks, traffic context, and experiments that help you learn what deserves more attention.`

On-screen text:
`Measure. Learn. Improve.`

**0:22-0:29**

Spoken narration:
`From deals and tasks to invoices, documents, calendar, and mobile touchpoints, the stack gets smaller and the business gets clearer.`

On-screen text:
`One stack. More control.`

**0:29-0:33**

Spoken narration:
`LinkMAX is not just a link page. See LinkMAX live at lnkmx.my.`

On-screen text:
`Not just a link page`
`See LinkMAX live at lnkmx.my`

## Shot List

### Shot 1

- Length: `5s`
- Visuals: floating fragments of a solo-business stack, such as page links, notes, charts, bookings, and chat-style alerts, collapsing into one centered LinkMAX-style product frame
- Motion: slow dolly-in
- On screen:
  - `A link gets seen.`
  - `A business gets run.`

### Shot 2

- Length: `5s`
- Visuals: phone mockup with a clean editor surface; modular content blocks snap into place and resolve into a polished public page
- Motion: straight-on push-in
- On screen:
  - `Start with the page`

### Shot 3

- Length: `6s`
- Visuals: the published page morphs into incoming lead cards, notification-style alerts, and a zone-style CRM surface with cards moving into an organized pipeline
- Motion: smooth lateral slide
- On screen:
  - `The page feeds the business`

### Shot 4

- Length: `6s`
- Visuals: analytics panels, event streams, traffic context chips, and an experiment split view; charts animate in while an abstract server-side signal path runs behind the UI
- Motion: left-to-right tracking move
- On screen:
  - `Measure. Learn. Improve.`

### Shot 5

- Length: `7s`
- Visuals: a desktop-plus-mobile dashboard montage showing deals, tasks, invoices, documents, calendar, products, and a mini-app style mobile touchpoint in one ecosystem
- Motion: gentle orbit
- On screen:
  - `One stack. More control.`

### Shot 6

- Length: `4s`
- Visuals: final hero composition with desktop and phone screens layered in a premium abstract environment; the full product stack sits behind the public page
- Motion: slow crane-up
- On screen:
  - `Not just a link page`
  - `See LinkMAX live at lnkmx.my`

## Safe Claims Grounded in Repo Evidence

- LinkMAX supports `28` block types in the editor. Evidence: `src/types/blocks/base.ts`
- The app supports `16` UI languages. Evidence: `src/i18n/config.ts`
- The routed dashboard includes leads plus zone surfaces for analytics, deals, contacts, inbox, tasks, automations, invoices, products, calendar, events, documents, settings, and team. Evidence: `src/main.tsx`, `src/components/zones/*`
- The analytics layer tracks views, clicks, shares, UTM/referrer/device context, and session metadata. Evidence: `src/services/analytics.ts`
- The repo includes client-to-server event forwarding through a pixel proxy flow for server-side tracking. Evidence: `src/lib/analytics.ts`, `supabase/functions/pixel-proxy/index.ts`
- The product includes Telegram notification plumbing and a Telegram mini-app shell. Evidence: `supabase/functions/send-lead-notification/index.ts`, `src/telegram/TelegramApp.tsx`
- The app includes installable/mobile-ready surfaces plus public-page SEO/SSR infrastructure for bots and crawlers. Evidence: `src/components/pwa/PWAInstallPrompt.tsx`, `android/`, `ios/`, `cloudflare-worker/README.md`

## Assumptions

- `Business OS`, `operating system`, and `not just a link page` are positioning language, not literal technical taxonomies.
- If AI is introduced in a later version of this concept, it should be framed as optional or assistive tooling, not autonomous business creation.
- If notification visuals appear as generic chat alerts in video, they are shorthand for the Telegram-backed notification and mini-app surfaces present in the repo.
- The concept shows product breadth, not a guarantee that every user or plan tier gets every capability by default.

## Internal Evidence Map

- Block types: `src/types/blocks/base.ts`
- Languages: `src/i18n/config.ts`
- Routed dashboard and zone surfaces: `src/main.tsx`
- Analytics tracking: `src/services/analytics.ts`
- Server-side tracking helpers: `src/lib/analytics.ts`
- Pixel proxy edge function: `supabase/functions/pixel-proxy/index.ts`
- Telegram notifications: `supabase/functions/send-lead-notification/index.ts`
- Telegram mini-app shell: `src/telegram/TelegramApp.tsx`
- PWA install prompt: `src/components/pwa/PWAInstallPrompt.tsx`
- Public-page SSR and bot routing: `cloudflare-worker/README.md`
