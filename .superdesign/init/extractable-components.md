# Extractable Superdesign components

## DynamicIslandNav
- Source: `src/components/landing/v2/DynamicIslandNav.tsx`
- Category: layout
- Description: Floating responsive public navigation with real LinkMAX logo, anchors, language/theme controls and Login/Create actions.
- Extractable props: onLogin, onSignup.
- Hardcoded: menu labels through i18n, responsive behavior, icons, all classes, logo asset.

## CommercialLandingHero
- Source: `src/components/landing/v3/HeroBentoOS.tsx`
- Category: layout
- Description: Dark two-column commercial hero with slug claim form and product proof cards.
- Extractable props: onStart, onExamples.
- Hardcoded: brand palette, use-case chips, illustrative booking/lead/payment scenario.

## FAQSection
- Source: `src/components/landing/v2/FAQSection.tsx`
- Category: layout
- Description: Public pre-purchase FAQ accordion.
- Extractable props: none.
- Hardcoded: i18n keys, Accordion layout and styles.

## Button
- Source: `src/components/ui/button.tsx`
- Category: basic
- Description: shadcn/Radix button with project variants and sizes.
- Extractable props: variant, size, disabled.
- Hardcoded: CVA classes.

## Card
- Source: `src/components/ui/card.tsx`
- Category: basic
- Description: Shared surface primitives.
- Extractable props: none.
- Hardcoded: semantic subcomponents and classes.

## Input
- Source: `src/components/ui/input.tsx`
- Category: basic
- Description: Shared accessible input.
- Extractable props: type, value, placeholder, disabled.
- Hardcoded: focus, border and validation classes.

