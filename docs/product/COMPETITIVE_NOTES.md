# Competitive Notes & Trend Radar

> **Purpose:** Track competitor features, market trends, and adoption proposals to keep the platform competitive.

---

## Trend Radar

### [2026-02-18]

1. **AEO & GEO Optimization**: Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) are critical. AI search engines (Perplexity, ChatGPT, Gemini) prefer structured, semantic data.
   - **lnkmx status**: ✅ Implemented — `seo-ssr` edge function serves JSON-LD rich pages for bots.

2. **Server-Side Pixel Tracking**: With ad-blockers blocking 30-40% of client-side pixels, server-side event forwarding is now standard.
   - **lnkmx status**: ✅ Implemented — `pixel-proxy` edge function forwards to FB CAPI, TikTok Events API, GA4 MP.

3. **Mini-CRM Integration**: Competitors (Taplink, Linktree) are moving beyond links into business management.
   - **lnkmx status**: ✅ Advantage — full CRM with lead pipeline, Telegram notifications, automated follow-ups.

4. **Multi-Page Bio**: Users want sub-pages within their bio (e.g., /about, /services, /portfolio).
   - **lnkmx status**: ✅ Implemented — up to 6 pages per account (1 free + 5 Pro).

5. **AI Chatbot on Bio Pages**: Emerging trend of conversational AI on personal/business pages.
   - **lnkmx status**: ✅ Implemented — `chatbot-stream` with Gemini AI.

---

## Competitor Teardown

**Phase B (месседжи и сравнения):** Done — месседжи «CRM без внедрения», «со смартфона», «премиум из коробки» добавлены в онбординг/дашборд и на страницу тарифов; страница сравнения [/alternatives](/alternatives) дополнена блоком «Почему не Bitrix24 для соло».

### Taplink (CIS market leader)

| Best Practice | Applicability | Our Status |
|---|---|---|
| Deep payment integration with local processors (Kaspi, Robokassa) | High — essential for KZ market | In progress (RoboKassa) |
| Booking/appointment scheduling built-in | High — core use case for services | ✅ Shipped with time slots + reminders |
| Mini-store with cart and checkout | High — monetization for creators | ✅ Catalog + Pricing blocks |

### Linktree (global market leader)

| Best Practice | Applicability | Our Status |
|---|---|---|
| Extremely simple onboarding (<60 seconds) | High — reduces friction | ✅ AI-powered 3-step onboarding |
| Analytics dashboard with detailed click tracking | Medium — already have | ✅ Block-level analytics + device/geo breakdown |
| Marketplace / template gallery | Medium — drives network effects | ✅ Template gallery + Linkkon token marketplace |

### Bento.me (design-focused)

| Best Practice | Applicability | Our Status |
|---|---|---|
| Grid-based visual layouts (Bento grid) | Medium — differentiation | Planned (custom layouts in roadmap) |
| Beautiful default themes | High — first impression matters | Partial — strong theme system, room for premium templates |
| Mobile-first editing experience | High — most creators use mobile | ✅ PWA + responsive editor |

### Bitrix24 (enterprise CRM / all-in-one)

| Weakness (Bitrix24) | Our response (lnkmx) |
|---|---|
| Сложный интерфейс, долгая адаптация | «3 клика», онбординг без инструкций, «CRM за 15 минут без внедрения» |
| Медленная работа, тяжёлые отчёты | Лёгкий Zone Dashboard, быстрые запросы, кэш (React Query) |
| Слабое мобильное приложение | PWA + нативные приложения (Capacitor), пуш-уведомления |
| Дорого, рост по пользователям | Один тариф Pro ~$6.5/мес, без per-seat |
| Кастомизация = программисты | Только «достаточный» набор: сделки, контакты, задачи, 3–5 автоматизаций, инвойсы — без BPMN, телефонии, документооборота |

**Позиционирование:** lnkmx — «анти-Битрикс» для соло и микро-бизнеса: простая, быстрая, мобильная CRM и визитка за 15 минут, без внедрения и программистов.

---

## Adoption Proposals

| Feature/Trend | Priority | Status | Rationale |
|---|---|---|---|
| Kaspi payment integration | High | Planned | Essential for KZ market; Taplink has it |
| Custom domain support | High | Planned | Pro differentiator; Linktree charges for this |
| Bento grid layouts | Medium | Planned | Visual differentiation from competitors |
| Video testimonials | Low | Planned | Niche feature; standard testimonials work |
| AI personalization (visitor-based) | Low | Research | Complex; requires visitor data tracking |

---

*Last updated: 2026-03-01*
