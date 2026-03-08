

# Build `demo-nails` on demoaccount1

## Verdict

`demo-nails` is the single strongest cold-DM asset. Without a live page to link, the outreach copy is abstract. One realistic, mobile-optimized nail master page with visible prices and working booking converts a cold DM from "let me explain my product" to "look at this."

Building all 3 demos in parallel is wasteful — nail masters are Tier 1 ICP. Ship one, start outreach, build the rest while DMs are landing.

## What to Build

**One new edge function: `seed-demo-nails`** that overwrites `demoaccount1` (anna_beauty) with the demo-nails content pack.

### Database Changes via Edge Function

The function will:
1. Look up `demoaccount1`'s user ID
2. Delete existing blocks for their page
3. Update the page: slug → `demo_nails`, title, description, niche, theme
4. Insert exact blocks in this order:

| # | Block Type | Content |
|---|-----------|---------|
| 0 | `profile` | name: "Айгерим · Маникюр Алматы", bio with emoji, blockSize: full |
| 1 | `pricing` | 6 services (3000-12000₸), currency KZT, title "Услуги и цены" |
| 2 | `booking` | Mon-Fri 10-19, Sat 10-16, 90min slots, no prepayment, CTA "Записаться онлайн", isPremium: true |
| 3 | `testimonial` | 1 quote from "мастер Айгерим" about switching from DM booking (NOT fake client review) |
| 4 | `faq` | 3 items: how to book, cancellation, location |
| 5 | `messenger` | WhatsApp fallback wa.me/77001234567 |

Also updates `user_profiles` display_name, bio, and the page's theme to warm/feminine palette (#FFF5F7 background).

### Why Edge Function, Not Manual

- Reproducible: can re-run if page gets corrupted
- Exact: block content matches the asset pack spec precisely
- Fast: one API call vs 15 minutes of manual clicking

### Files

1. **`supabase/functions/seed-demo-nails/index.ts`** — the edge function (admin-only, uses service role key)

### After Deployment

The page will be live at `/demo_nails` (underscore per existing slug convention). Founder can then:
1. Visit the page on mobile → take screenshots
2. Use the URL in cold DMs immediately
3. Record the 15-sec booking flow video

### What's NOT included
- No fake reviews from "clients"
- No portfolio/gallery images
- No payment/prepayment block
- No newsletter or download blocks
- No demo-lashes or demo-barber (those come after first outreach wave)

