

# Implementation Plan: Audit P0 Fixes + Retention Hardening

## Summary

Based on the comprehensive audit, there are 3 critical P0 fixes and several P1 improvements to implement. The code already has most retention infrastructure — what's missing are critical fixes that break core loops.

## What We Fix

### P0-1: Remove CRM Premium Gate (Critical — Kills Activation)

**Problem:** `ActivityScreen.tsx` lines 100-120 contain a premium gate JSX block that's actually dead code (JSX expression as statement, never returned). However, the `useFreemiumLimits.ts` has `canUseCRM: false` for free tier and `maxLeadsPerMonth: 0`, which means the intent is to gate CRM. The dead code needs to be removed, and basic CRM needs to be opened for free users.

**Changes:**
- `src/hooks/user/useFreemiumLimits.ts` — Change `FREE_LIMITS.canUseCRM` to `true`, set `maxLeadsPerMonth` to `50` (basic CRM free, with limit)
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — Remove the dead premium gate JSX (lines 100-120). Add a soft upsell banner at the bottom instead of a full gate. Gate only Export to Excel behind premium.

### P0-2: Add Booking Block to Free Tier

**Problem:** `booking` is in `PRO_EXTENDED_BLOCKS`, meaning free users can't even add a booking block. This kills the core thesis (social traffic → booking → prepayment). The most important conversion block is locked behind paywall.

**Changes:**
- `src/hooks/user/useFreemiumLimits.ts` — Move `'booking'` and `'form'` from `PRO_EXTENDED_BLOCKS` to `FREE_BLOCKS`

### P0-3: Simplify Pricing Page (3 tiers → 2 main)

**Problem:** Pricing page has 3 visible plans (Basic, Pro, Business). Business tier has no proven demand and creates confusion. Simplify to 2 main tiers with Business as a small mention.

**Changes:**
- `src/components/screens/Pricing.tsx` — Collapse to 2 prominent cards (Basic, Pro). Business becomes a small "Enterprise" link/note below, not a full card.

### P1-1: "Записаться снова" CTA on Public Booking Page

**Problem:** After a customer's booking date passes, there's no way for them to rebook. No repeat booking loop exists on the public page.

**Changes:**
- `src/components/blocks/BookingBlock.tsx` — In the confirmation screen, after showing booking details, add a "Записаться снова" button that resets the flow. Also detect returning customers (check if phone has previous bookings) and show "С возвращением!" badge.

### P1-2: Fix Activation Milestone — Add "First Booking" Step  

**Problem:** Activation checklist ends at "first lead/click" but for booking-focused product, the real aha-moment is "first booking received."

**Changes:**
- `src/hooks/onboarding/useActivationChecklist.ts` — Add 5th step "Получите первую запись" that checks bookings count > 0

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/user/useFreemiumLimits.ts` | Move booking+form to FREE, enable basic CRM for free |
| `src/components/dashboard-v2/screens/ActivityScreen.tsx` | Remove dead premium gate, add soft upsell |
| `src/components/screens/Pricing.tsx` | Simplify to 2 main tiers |
| `src/components/blocks/BookingBlock.tsx` | Add "Book again" CTA + returning customer detection |
| `src/hooks/onboarding/useActivationChecklist.ts` | Add "first booking" milestone |
| `src/i18n/locales/ru.json` | New keys for book-again, milestone, upsell |
| `src/i18n/locales/en.json` | Same |
| `src/i18n/locales/kk.json` | Same |

## What We Do NOT Change
- OperatorSummaryWidget — already working
- Repeat customer detection — already working  
- Lifecycle nudges — already working
- Follow-up prompts — already working
- Weekly digest edge function — already working

