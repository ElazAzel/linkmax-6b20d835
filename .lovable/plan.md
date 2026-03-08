

# LinkMAX Pricing / Packaging Audit

---

## 1. Verdict

The pricing structure is **70% coherent, 30% confused**.

**Where it works:**
- Free tier now correctly includes booking + form + CRM (50 inbound/mo). This aligns perfectly with core thesis.
- 2-card pricing layout (Free vs Pro) is the right simplification.
- Pro at ~3,045₸/mo ($6) annual is aggressively competitive for the KZ market.
- Server-side inbound limit enforcement exists.

**Where it breaks:**
- **Starter tier exists in code but is invisible on pricing page.** `usePremiumStatus` maps it, `useFreemiumLimits` gives it PRO_LIMITS, ADR 0026 defines 7% commission — but the user never sees "Starter" anywhere. It's a ghost tier that will cause support confusion.
- **Business tier is half-visible.** The pricing page shows a tiny link ("Узнать о тарифе BUSINESS →"), but clicking it calls `handleSelectPlan('business')` which does nothing useful (no Robokassa flow for business). Dead end.
- **Token/Linkkon system competes with subscription.** "100 Linkkon = 1 day Premium" on the pricing page creates a parallel payment rail that confuses the value prop. Users see: subscription OR tokens OR WhatsApp purchase. Three ways to pay = no clarity.
- **`openPremiumPurchase()` still sends to WhatsApp** in multiple places (`SimplePricingSection`, `FreemiumAILimit`, `MobileSettingsSheet`), while the pricing page uses Robokassa. Two payment paths coexist.
- **FREE_LIMITS says `maxBlocks: Infinity`** but pricing page card says "10 блоков максимум". Contradiction.

**Danger level:** Medium. The core freemium→Pro path works, but the noise from tokens, WhatsApp, ghost Starter tier, and contradictory limits will erode trust as traffic scales.

---

## 2. What LinkMAX Can Charge For

**Free-worthy (core thesis, must stay free):**
- 1 page with all basic blocks
- Booking block + form block
- CRM-light with 50 inbound/mo
- WhatsApp/Kaspi prepayment options
- Basic view stats
- QR code
- "Powered by LinkMAX" watermark
- 1 AI generation/mo

**Pay-worthy (proven value acceleration):**
- Remove watermark (vanity + professionalism)
- Unlimited inbound (growth scaling)
- Advanced analytics (click heatmaps, funnels)
- Export to Excel/CSV (operator efficiency)
- Automation/notifications (Telegram alerts, auto follow-up)
- Custom domain
- Multi-page (up to 6)
- Premium blocks (video, carousel, catalog, countdown, testimonials)
- Premium themes/frames
- Scheduler (block visibility timing)

**Too early to monetize:**
- Chatbot (not proven usage)
- Pixel proxy (niche)
- Verification badge (no social proof of demand)
- Token economy as payment method (creates confusion)

---

## 3. Product Thesis vs Pricing Alignment

The thesis: `social traffic → page → booking → prepayment → CRM → repeat`

**Current alignment:** ✅ Strong. Free tier lets a user complete the full loop up to 50 times/month. This is correct.

**Remaining conflicts:**
1. Pricing page says "10 блоков максимум" for free, but `FREE_LIMITS.maxBlocks = Infinity`. If 10 is real, it may block users from adding enough booking/form blocks. If Infinity is real, the pricing page lies.
2. `canUsePayments: false` in FREE_LIMITS — but booking prepayment (WhatsApp/Kaspi) works on free tier. This flag name is misleading; it likely means "advanced payment integration" but reads as "can't take payments."
3. `canUseAnalytics: false` on free — users can't even see basic click stats. For a "prove value first" model, hiding ALL analytics before upgrade is too aggressive. Users need to see that their page gets traffic to feel motivated.

---

## 4. ICP Fit

For KZ/CIS service solopreneurs:
- 3,045₸/mo ($6) annual is **psychologically strong** — cheaper than a business lunch
- Monthly 4,350₸ ($8.90) is still accessible
- **BUT**: Robokassa checkout + KZT pricing + annual commitment creates friction for mobile-first users who think in weekly/daily costs
- Token system adds cognitive overhead that this audience doesn't need
- "Business" tier at 6,930₸-9,900₸/mo is premature — solo users don't think in "business zones"

**Key insight:** This ICP pays when they feel they're losing money by NOT paying. The best trigger is "your 50 leads ran out and customers can't reach you."

---

## 5. Free Tier Audit

| Area | Current | Assessment |
|------|---------|------------|
| Page | 1 page, unlimited blocks (code) / 10 blocks (copy) | **Fix the contradiction.** Unlimited blocks is correct — don't artificially limit. |
| Booking | Free ✅ | Correct |
| Form | Free ✅ | Correct |
| CRM | 50 inbound/mo, server-enforced ✅ | Correct |
| Analytics | Completely locked | **Too aggressive.** Give basic view count. Lock click analytics, funnels, heatmaps. |
| Watermark | Yes ✅ | Correct — this is the #1 visual nudge |
| Export | Locked ✅ | Correct |
| Automation | Locked ✅ | Correct |
| AI gen | 1/mo ✅ | Fine |

**Verdict:** Free tier is almost right. Fix the block limit contradiction, give basic view stats, and it's solid.

---

## 6. Pro Plan Audit

**Current Pro at 3,045₸/mo (annual):**

The feature list is a wall of 13 items. Too many. The user can't parse what matters.

**What should be the TOP 3 reasons to upgrade:**
1. **Unlimited inbound** — "Больше клиентов без лимита"
2. **No watermark** — "Ваш бренд, не наш"
3. **Advanced analytics + export** — "Видьте, что работает"

Everything else (premium blocks, themes, scheduler, multi-page, custom domain, notifications) is bonus, not headline.

**What's missing from Pro narrative:** A clear ROI statement. "Pro окупается с 1 дополнительной записи в месяц" — this is the line that should be on the card.

**What's unnecessary in Pro:** `canUseChatbot`, `canUsePixels`, `canUseVerificationBadge` — these are feature-flag ghosts. Don't list what doesn't work yet.

---

## 7. Business Plan Audit

**Should Business be a public tier right now? No.**

Reasons:
- Business Zones (Kanban, team CRM, roles) are built but serve a fundamentally different user (team lead, not solopreneur)
- Listing it on pricing confuses the solo ICP
- The "Узнать о тарифе BUSINESS →" link goes nowhere useful
- At 6,930-9,900₸/mo it's 2-3x Pro with no clear value bridge

**Recommendation:** Keep Business as an internal/hidden tier. Show it only when a user actively tries to invite team members or create a zone. "Для команд — напишите нам" is sufficient.

---

## 8. Recommended Packaging

**Public tiers: 2 (Free + Pro)**

No Starter. No Business on pricing page. No token purchase section.

```
FREE                          PRO
─────────────────────         ─────────────────────
0₸ навсегда                   от 3,045₸/мес (год)

1 страница                    До 6 страниц
Все базовые блоки             Все 25+ блоков
Запись + форма + CRM          Безлимитные обращения
50 обращений/мес              Расширенная аналитика
Базовая статистика            Экспорт и автоматизации
Водяной знак LinkMAX          Без водяного знака
1 AI-генерация                Безлимитные AI-генерации
                              Свой домен
                              Telegram-уведомления

[Текущий]                     [Подписаться — PRO]
```

**Business:** Hidden. Accessible via "Нужна команда? Напишите нам" link below cards.

**Starter tier (ADR 0026):** Remove from code or keep as internal alias for free. The 7% transaction fee model is not implemented in payment infrastructure — it's vaporware. Don't show it.

**Tokens:** Remove from pricing page entirely. Keep token economy as a gamification/engagement layer in dashboard, not as a payment method on pricing.

---

## 9. Pricing Model

**Recommended: Pure subscription (Free + Pro monthly/annual)**

Kill the hybrid complexity:
- Remove transaction fee tier (Starter 7%) — not implemented, not enforceable
- Remove token-to-premium conversion from pricing page
- Remove WhatsApp purchase path — use only Robokassa
- Keep token economy for engagement (daily quests, referrals) but separate from billing

**Why:** Your ICP needs one decision: "Do I pay 3,045₸/mo or not?" Three payment rails = zero clarity.

---

## 10. Limits Audit

| Limit | Type | Current | Recommendation |
|-------|------|---------|----------------|
| Inbound/mo | Usage | 50 | ✅ Keep |
| Blocks | Feature | Infinity (code) / 10 (copy) | Fix: unlimited for all |
| Pages | Feature | 1 free / 6 pro | ✅ Keep |
| AI gen | Usage | 1 free / ∞ pro | Change pro to 10/mo (∞ is unsustainable) |
| Analytics | Feature | Off/On | Change: basic views free, advanced pro |
| Export | Feature | Pro only | ✅ Keep |
| Custom domain | Feature | Pro only | ✅ Keep |
| Watermark | Feature | Free=on, Pro=off | ✅ Keep |

**Remove from limit system:** `canUseChatbot`, `canUsePixels`, `canUseVerificationBadge` — don't gate features that aren't production-ready.

---

## 11. Upgrade Trigger Audit

| Trigger | Natural? | Value-based? | Recommendation |
|---------|----------|--------------|----------------|
| 50 inbound limit hit | ✅ Yes | ✅ Yes | **Best trigger.** Customer can't reach you = real pain. |
| Want to remove watermark | ✅ Yes | Moderate | Good secondary. |
| Need export | ✅ Yes | ✅ Yes | Good for operators. |
| Want analytics | Moderate | ✅ Yes | Good after first 50 views. |
| Need custom domain | Moderate | Moderate | Niche but clear. |
| Want more pages | Moderate | Moderate | Clear for multi-service users. |
| Premium blocks | Weak | Weak | Most users don't know they need video/carousel upfront. |

**Best upgrade moment:** When free user hits 40/50 inbound, show: "У вас осталось 10 обращений. Снимите лимит, чтобы не терять клиентов."

---

## 12. Pricing Page Fixes Needed

**Remove:**
- Token purchase section (lines 449-474)
- Business tier data from `pricingPlans` object (lines 98-115)
- Block limit "10 блоков максимум" from basic limitations (line 73)

**Fix:**
- Add basic view stats to free features list
- Simplify Pro features to 7-8 items max (not 13)
- Add ROI line: "Окупается с 1 записи" or similar
- Make Business a simple text link, not a plan object

**Add:**
- Social proof: "X пользователей уже на Pro"
- Concrete use case: "Мастер маникюра Алматы получает 120 записей/мес на Pro"

---

## 13. Monetization Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Token system confuses billing | High | Remove from pricing page |
| WhatsApp + Robokassa dual path | High | Standardize on Robokassa only |
| Starter ghost tier | Medium | Remove or hide completely |
| Business dead-end link | Medium | Replace with "contact us" |
| Free block limit contradiction | Medium | Fix copy to match code (unlimited) |
| `canUseAnalytics: false` kills proof | Medium | Add basic view stats to free |
| Pro AI gen = Infinity | Low (for now) | Cap at 10/mo before scaling |

---

## 14. Competitive Context

| Competitor | Free | Paid | LinkMAX advantage |
|------------|------|------|-------------------|
| Taplink | Limited blocks | $5-16/mo | LinkMAX: Free CRM + booking |
| Linktree | Limited | $5-24/mo | LinkMAX: Full page builder + payments |
| Bitrix24 CRM | Very limited | $49+/mo | LinkMAX: 100x simpler, mobile-first |
| Amo CRM | No free | $15+/mo | LinkMAX: Free entry + page builder |

**LinkMAX wins on:** "Free CRM that actually works for micro-business, with a page attached." No competitor offers page + booking + CRM at $0. This is the moat.

**Don't compete on:** Feature count, enterprise features, team collaboration.

---

## 15. Final Recommended Structure

**2 public tiers. 1 hidden.**

- **FREE**: Full core workflow (page + booking + form + CRM 50/mo + basic stats + watermark). Named "BASIC" or just "Бесплатный".
- **PRO**: ~3,045₸/mo annual. Unlimited inbound, no watermark, analytics, export, automation, premium blocks, multi-page, custom domain. Named "PRO".
- **BUSINESS**: Hidden. Shown only contextually (team invite, zone creation). Named "Для команд".

**No Starter tier. No token billing. No transaction fee model (yet).**

---

## 16. Copy Recommendations

**Free card headline:** "Начните бизнес бесплатно"
**Free card subtitle:** "Страница + запись + CRM — всё, чтобы получить первых клиентов"

**Pro card headline:** "Растите без ограничений"  
**Pro card subtitle:** "Окупается с первой дополнительной записи"

**Upgrade banner (at 40/50):** "Осталось {{remaining}} обращений. Снимите лимит →"
**Upgrade banner (at 50/50):** "Лимит обращений достигнут. Новые клиенты не смогут записаться."
**Upgrade CTA:** "Перейти на PRO"
**End-customer block:** "Запись временно недоступна. Свяжитесь напрямую."

---

## 17. Implementation Plan

### P0 — Fix contradictions (this sprint)

1. **Remove block limit "10 блоков максимум" from pricing page** — it contradicts `maxBlocks: Infinity`
2. **Remove token purchase section from pricing page** (lines 449-474)
3. **Replace all `openPremiumPurchase()` WhatsApp calls** with navigation to `/pricing` — standardize payment path
4. **Remove Starter tier references** from pricing page and simplify `useFreemiumLimits` (Starter → treat as identity)
5. **Fix Business link** — replace `handleSelectPlan('business')` with WhatsApp/contact link or remove

### P1 — Strengthen Pro value (next sprint)

6. **Add basic view stats to free tier** — set `canUseAnalytics` to a granular model (basic views free, advanced pro)
7. **Simplify Pro feature list** on pricing page to 7-8 items grouped by value
8. **Add ROI copy** to Pro card
9. **Cap AI generations at 10/mo for Pro** (not Infinity)

### P2 — Clean up code

10. **Remove `canUseChatbot`, `canUsePixels`, `canUseVerificationBadge`** from feature flags (or keep but don't expose in UI)
11. **Remove Starter/commission logic** from `User.ts` (`getTierCommissionRate`) until transaction fee infra is built
12. **Audit all 25 files** that reference `openPremiumPurchase` — ensure consistent upgrade path

---

## 18. What NOT to Do

- **Don't add Starter as a visible tier.** Transaction fee model needs payment infra that doesn't exist yet.
- **Don't keep tokens on the pricing page.** Gamification ≠ billing.
- **Don't add per-feature add-ons.** "Analytics add-on $2/mo" is enterprise SaaS thinking, not micro-business UX.
- **Don't show Business prominently.** It's for <1% of current users.
- **Don't gate basic page views behind Pro.** Users need to see their page works before paying.
- **Don't create a "comparison table" with 30 rows.** Your ICP won't read it.
- **Don't add annual-only pricing.** Keep 3/6/12 month options — KZ users think short-term.

---

## 19. Final Recommendation

**One model: Free (full core loop, 50 inbound/mo, watermark) + Pro (unlimited, clean, automated).**

**Why it's best:**
- Matches core thesis exactly — free proves value, Pro removes friction
- Simplest possible decision for ICP
- Watermark + 50 limit = two natural organic upgrade triggers
- No confusion from ghost tiers, tokens, or dual payment paths

**First pricing decision to make:**
Remove the token purchase section and WhatsApp payment path from the pricing page. One payment method. One upgrade path. Today.

