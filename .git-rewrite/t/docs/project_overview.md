# lnkmx Project Overview

## Product summary

lnkmx is a mini-site builder for experts, freelancers, and small businesses who need a single link that explains their offer and captures leads. The core promise is simple: a focused page with offer, pricing, and lead capture that can be published in minutes.

## Positioning

- Category: link-in-bio + mini-landing builder with lead capture.
- Differentiator: fast AI-assisted first draft, mini-CRM for leads, RU/EN/KK localization, and pricing in local currency.

## Target segments

- Experts and consultants: sell services, collect inquiries, book calls.
- Freelancers: showcase portfolio, capture briefs, respond quickly.
- Small service businesses: booking, pricing, and FAQs in one page.
- Creators: consolidate links, drive to offers, collect leads.

## Jobs to be Done (JTBD)

- When I share one link in bio, I want visitors to understand my offer and book or leave an inquiry without asking the same questions.
- When I need a landing quickly, I want a strong first draft without hiring a designer or developer.
- When leads arrive, I want a simple pipeline to track status and avoid missing follow ups.

## Key success metrics

- Visitor to signup conversion.
- Signup to publish conversion.
- Publish to Pro conversion.
- Lead form completion rate.
- Time to first publish.

## User journeys

1. Visitor - signup: land on the homepage, understand the promise in 5-10 seconds, click primary CTA.
2. Signup - create: pick niche, fill a short brief, review AI draft.
3. Create - publish: edit blocks, add pricing and contacts, publish the page.
4. Publish - Pro: upgrade when limits are reached or premium blocks are needed.

## Free vs Pro constraints

Free plan is designed to let users launch and validate quickly, while Pro unlocks scale and automation.

- Free: basic blocks, 1 AI generation/month, basic analytics, watermark.
- Pro: all 28 blocks, 5 AI generations/month, advanced analytics, CRM with Telegram notifications, custom branding.
- Business: unlimited AI, white label, priority support.

## Architecture summary

- Frontend: React 18, TypeScript, Vite, Tailwind, shadcn/ui.
- Backend: Supabase (Postgres, Auth, Storage), 20 Edge Functions.
- i18n: RU, EN, KK via i18next.
- Animation: CSS + IntersectionObserver motion system.

## Pricing (KZT)

| Plan     | Price     | Key features                      |
| -------- | --------- | --------------------------------- |
| Free     | 0₸        | Basic blocks, watermark           |
| Pro      | 2,610₸/mo | All blocks, AI, CRM, no watermark |
| Business | 7,500₸/mo | White label, unlimited AI         |

## Block types (28 total)

### Basic (free)

- `link` - Simple URL link
- `button` - Call-to-action button
- `text` - Text content
- `separator` - Visual divider
- `avatar` - Profile avatar

### Media (mixed)

- `image` - Image display (free)
- `video` - Video embed (Pro)
- `carousel` - Image carousel (Pro)
- `before_after` - Before/after slider (Pro)

### Interactive (mixed)

- `form` - Lead capture form (Pro)
- `messenger` - Messenger links (free)
- `map` - Location map (free)
- `faq` - FAQ accordion (free)
- `scratch` - Scratch card game (Pro)
- `search` - Search block (free)

### Commerce (Pro)

- `product` - Product card
- `catalog` - Product catalog
- `pricing` - Pricing table
- `download` - Downloadable content

### Advanced (Pro)

- `custom_code` - Custom HTML/CSS
- `newsletter` - Email signup
- `testimonial` - Customer reviews
- `countdown` - Timer countdown
- `socials` - Social media links
- `booking` - Appointment booking
- `event` - Event management

### Social (Pro)

- `shoutout` - Cross-promotion
- `community` - Community links

## Gamification

- Linkkon tokens for in-app economy
- Daily quests for engagement
- Weekly challenges
- Achievement system
- Referral program

## Contacts

- Email: admin@lnkmx.my
- Website: https://lnkmx.my
