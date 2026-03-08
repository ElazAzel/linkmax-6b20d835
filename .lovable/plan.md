

# Growth Package: Niche Acquisition Surfaces for LinkMAX

## 0. Critical Build Fix (P0 — before anything else)

`index.html` line 9 has a **duplicated CSP meta tag** — the `content="..."` attribute appears twice on the same tag, breaking the HTML parser. The entire CSP string was doubled during the previous telegram.org edit. Must be fixed to a single valid `content` attribute.

---

## 1. Verdict

LinkMAX has a complete product loop but zero dedicated acquisition surfaces. Every visitor lands on a generic "Micro-Business OS" homepage. The watermark links to the homepage. The gallery has no signup CTA beyond a generic "Создать" button. Share messages say "Смотри мою страницу!" — meaningless to cold traffic.

This growth package creates **4 new conversion surfaces** that turn existing traffic (watermark clicks, gallery browsing, share messages) into signups and published pages. No paid ads needed — this amplifies traffic that already exists but currently bounces.

---

## 2. Implementation Scope — 8 Tasks

### Task 1: Fix CSP build error
Fix `index.html` line 8-9 — remove the duplicated `content=` attribute, keeping one valid CSP string with `https://telegram.org` included.

### Task 2: Niche landing page `/for-masters`
Create a new page component `src/pages/ForMasters.tsx` and route it in `main.tsx`.

**Structure:**
- Hero: "Онлайн-запись для мастеров — бесплатно, за 5 минут"
- Subheadline: "Клиенты записываются прямо из Instagram. Без звонков, без переписки."
- 3 value props with icons: (1) Ссылка для записи в bio, (2) Клиент видит цену и свободные слоты, (3) Вы видите все заявки в одном месте
- Social proof: gallery cards from `beauty` niche (reuse `getGalleryPages('beauty')`)
- Objection block: "Бесплатно навсегда до 50 записей/мес. Без карты. Без скрытых платежей."
- Primary CTA: "Создать страницу записи →" → `/auth?niche=beauty&from=masters-landing`
- Secondary CTA: "Посмотреть примеры →" → `/gallery?niche=beauty`
- Mobile-first, single-column, no 3D/heavy animations
- SEO: indexable, `<title>` = "Онлайн-запись для мастеров красоты — бесплатно | lnkmx"

### Task 3: Watermark conversion landing `/from/[slug]`
Create `src/pages/FromPage.tsx` routed as `/from/:slug`.

**Flow:** When user clicks "Made with lnkmx" watermark → instead of homepage, go to `/from/[slug]`.

**Page structure:**
- Fetch referring page data: `supabase.from('pages').select('title, avatar_url, preview_url, niche, slug').eq('slug', slug).eq('is_published', true).single()`
- Show: "Эта страница создана на lnkmx" + preview card of the referring page
- Headline: "Создайте такую же — бесплатно за 5 минут"
- CTA: "Создать свою страницу →" → `/auth?from=watermark&ref_slug=[slug]&niche=[niche]`
- If page not found or not published → redirect to `/`
- Privacy: only show public data (title, avatar, niche). Never show owner contact info.

**Watermark change:** Update `FreemiumWatermark.tsx` href from `getAppDomain()` to `getAppDomain() + '/from/' + slug` (pass `slug` as new prop).

### Task 4: Gallery "Use this template" CTA
Modify `GalleryPageCard.tsx`:
- Replace the Copy button with "Создать такую же" button
- On click: navigate to `/auth?from=gallery&ref_slug=[slug]&niche=[niche]`
- Keep View and Like buttons as-is

Add a banner at top of Gallery grid for unauthenticated users:
- "Нравится страница? Создайте похожую за 5 минут →"

### Task 5: Niche-specific share copy
Update `ShareAfterPublishDialog.tsx`:
- Replace generic "Смотри мою страницу!" with niche-aware messages
- Beauty: "Записаться ко мне онлайн: {url}"
- Fitness: "Запишись на тренировку: {url}"
- Default: "Мои услуги и запись: {url}"
- Pass `niche` prop from dashboard context
- WhatsApp and Telegram buttons use the niche-specific text

### Task 6: Auth flow — pass source & niche params
Update `Auth.tsx` to read URL params (`from`, `niche`, `ref_slug`) and:
- Store in sessionStorage for post-auth redirect
- After signup, pass `niche` to the wizard/onboarding so it's pre-selected
- Track `signup_source` in the activation event metadata

### Task 7: Growth analytics events
Add new event types to `activation-events.ts`:
- `niche_landing_view`, `niche_landing_cta_click`
- `watermark_landing_view`, `watermark_landing_cta_click`
- `gallery_template_click`
- `signup_from_niche_landing`, `signup_from_watermark`, `signup_from_gallery`

Update the analytics constraint in a new migration to include these events.

Track on each new surface:
- `ForMasters.tsx`: track `niche_landing_view` on mount, `niche_landing_cta_click` on CTA
- `FromPage.tsx`: track `watermark_landing_view` on mount
- `GalleryPageCard.tsx`: track `gallery_template_click` on "Use template" click

### Task 8: Route registration
Add to `main.tsx`:
```
{ path: "for-masters", element: <ForMasters /> }
{ path: "from/:slug", element: <FromPage /> }
```

---

## 3. What NOT to do

- Don't rebuild the landing page — this is a separate niche page
- Don't add a comparison table or feature grid to the niche landing
- Don't mention "AI", "Micro-Business OS", or "экосистема" on growth surfaces
- Don't add social login, comments, or "community" features to gallery
- Don't gate template copying behind auth — let the CTA go to `/auth` with params
- Don't build separate pages for every niche now — start with beauty only

---

## 4. Priority Order

1. **Fix CSP** (unblocks build)
2. **Watermark landing** `/from/[slug]` + FreemiumWatermark href update (highest traffic potential — every page view generates watermark impressions)
3. **Niche landing** `/for-masters` (needed for any outreach or content)
4. **Share copy** update (quick win, improves every share)
5. **Gallery CTA** update (converts browsing to signups)
6. **Auth params + analytics** (instrumentation)

