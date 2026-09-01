# LinkMAX commercial landing design system

## Product and audience

LinkMAX is a mobile-first revenue page and operating layer for independent service professionals in Kazakhstan. The primary landing audience is solo beauty specialists who currently manage Instagram traffic, WhatsApp or Telegram conversations, scheduling, deposits and follow-up manually. Secondary audiences include tutors, photographers, coaches and other appointment-led solo businesses.

Primary job: turn one public link into a completed commercial loop — service discovery, available slot, booking, deposit status, confirmation, completed appointment and a clear next action for the specialist.

## Positioning

Lead with the business outcome, never the page builder. The landing must make three truths obvious above the fold:

1. customers can choose a service and time without back-and-forth messages;
2. the specialist can request and track a deposit transparently;
3. LinkMAX brings bookings and outcomes into one operational view.

Avoid invented conversion percentages, fake customer counts and unsupported testimonials. Product UI examples must be clearly presented as demonstrative scenarios.

## Visual identity

- Preserve the existing distinctive LinkMAX palette: ink `#101318`, warm paper `#f6f6f1`, white surfaces and action orange `#ff5701`.
- Use Manrope/Inter only. Marketing headlines are weight 600–800 with tight negative tracking; body copy remains highly readable.
- Hero is dark and cinematic but not glossy or gradient-heavy. Use a single restrained orange glow and product UI as the visual proof.
- Content sections alternate warm paper, white cards and occasional ink/orange conversion panels.
- Controls use 14–16px radii; cards 20–32px; pills only for labels, filters and compact trust statements.
- Icons are Lucide line icons from the real source. No emojis, invented brand marks, purple/blue SaaS gradients, glassmorphism overload or decorative serif fonts.
- Use the actual supplied LinkMAX logo in every logo position.

## Landing structure

1. Floating brand navigation with anchors for result, workflow, examples, pricing and FAQ; Login and primary signup CTA.
2. Outcome-first hero: booking and deposit promise, one primary CTA and one secondary demo CTA. Product proof shows a beauty service progressing from selected slot to deposit and completed visit.
3. Trust strip: free start, no code, KZT/local workflow, transparent payment state.
4. Outcome section: four connected facts — service viewed, booking created, deposit confirmed, visit completed — plus owner-facing next action.
5. Golden path: setup services and hours, publish/share, receive and manage bookings.
6. Curated examples for beauty first, with secondary profession chips.
7. Honest comparison with a plain link-in-bio: page only versus booking/deposit/operations loop.
8. Pricing framed around the value of one additional completed appointment; no unsupported financial promise.
9. Compact FAQ with no duplicated accordions.
10. One orange final conversion panel and minimal legal footer.

## Responsive behavior

- At 360–430px, maintain a single-column reading order, 44px minimum tap targets and no overlapping absolute cards.
- Product proof may stack into compact timeline cards on mobile; desktop can use an offset bento composition.
- Keep the primary CTA visible early; never require horizontal scrolling.
- Headline should remain within roughly 11–13 words and avoid orphaned prepositions.

## Interaction and motion

- CTA hover: subtle 1–2px lift and color darkening.
- Cards: light hover elevation only where clickable.
- Section reveals may use existing fade/blur utilities but essential content must remain visible without animation.
- Accordion and navigation state must be keyboard accessible.
- Respect `prefers-reduced-motion`.

## Conversion and analytics requirements

Retain the existing tracked paths to signup, gallery/demo, pricing and login. Section ids must allow observation of hero, outcomes, workflow, examples, pricing and FAQ. Every CTA must carry a stable location identifier. Signup with a desired slug continues through the existing `/auth?mode=signup&from=landing&slug=...` path.

## Implementation constraints

Reuse React, Tailwind, shadcn Button and existing analytics hooks. Preserve SEO components and structured metadata. Copy must use i18n keys for RU, KK and EN; Uzbek remains governed by the existing translation baseline. Avoid adding new runtime dependencies.

