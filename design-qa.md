# LinkMAX Visual System QA

- Source visual truth: `.codex-artifacts/visual-qa/landing-desktop-ru-final.png`
- Desktop implementation: `.codex-artifacts/visual-qa/auth-desktop-ru-final.png`
- Mobile implementation: `.codex-artifacts/visual-qa/auth-mobile-ru.png`, `.codex-artifacts/visual-qa/landing-mobile-ru-final.png`
- Additional product surface: `.codex-artifacts/visual-qa/gallery-desktop-ru-final.png`
- Combined comparison: `.codex-artifacts/visual-qa/landing-auth-comparison.png`
- Desktop viewport: `1440 x 1000`
- Mobile viewport: `390 x 844`
- State: Russian locale, light product surfaces, anonymous session

## Full-View Comparison

The combined landing/auth capture confirms the intended visual continuity: both use the charcoal frame, warm paper working surface, orange action signal, Manrope headings, Inter UI copy, compact controls, and restrained shadows. Auth no longer introduces the previous purple/blue decorative theme.

Gallery confirms that the paper canvas, orange selected state, shared controls, cards, and typography also carry into a data-rich public product surface.

## Focused Region Comparison

- Landing hero to auth card: action color, surface temperature, radii, and border treatment match.
- Desktop to mobile auth: hierarchy and card proportions remain stable; no horizontal overflow was detected.
- Desktop to mobile landing: primary CTA remains visible, copy wraps correctly, navigation collapses, and the product preview remains legible.
- Gallery filters: decorative emoji were removed from structural filter controls; semantic Lucide icons remain where needed.

## Required Fidelity Surfaces

- Fonts and typography: Manrope headings and Inter UI copy render consistently; Russian text wraps without clipping.
- Spacing and layout rhythm: the `4/8/12/16/24/32` rhythm is visible in shared controls and shells; mobile uses the expected single-column flow.
- Colors and visual tokens: ink, paper, and orange match the landing source; semantic status and chart colors remain distinct.
- Image quality and assets: existing LinkMAX logo, provider logos, user media, and avatars remain source assets; no visible asset was replaced with a code-drawn substitute.
- Copy and content: Russian landing copy renders as real text, not corrupted question marks; the browser console has no React key errors.

## Comparison History

1. P1: Database translation payloads and malformed locale namespaces produced `????` copy and runtime missing keys.
   Fix: restored canonical namespaces for all 16 locales, added corrupted-value filtering for DB overrides, translated the Russian and Kazakh landing branches, and added a structure gate.
   Evidence: final landing DOM contains complete Russian copy and browser error log is empty.
2. P2: Translation collisions created duplicate React keys in landing lists.
   Fix: replaced translated text keys with stable semantic IDs.
   Evidence: final landing browser error log is empty.
3. P2: Auth used unrelated purple/blue decoration and oversized glass surfaces.
   Fix: moved auth to the shared ink/paper/orange system and shared component recipes.
   Evidence: `landing-auth-comparison.png` shows consistent visual foundations at the same desktop viewport.
4. P2: Mobile overflow and CTA visibility required verification.
   Fix: retained responsive shell constraints and checked rendered geometry at `390 x 844`.
   Evidence: both landing and auth report `scrollWidth === viewportWidth`; only the intentionally clipped hero glow extends beyond the landing viewport.

## Findings

No actionable P0, P1, or P2 visual mismatch remains in the captured anonymous journey. Protected dashboard content requires an authenticated session for screenshot coverage; its shared shell and primitives are covered by the same implementation, typecheck, and component tests.

## Follow-Up Polish

- P3: Continue removing content-authored emoji from legacy gallery metadata when those records are edited; structural controls are already clean.

final result: passed
