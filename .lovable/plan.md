

# P1-B/C: Creator-Facing Search Readiness & Publish Governance

## 1. Technical Verdict

**Bottleneck**: Entity fields exist in DB (`city`, `profession`, `entity_type`, `contact_*`) but zero UI surfaces them. `quality_score` is computed but invisible to creators. `notify-indexnow` edge function exists but is never called from client code. Creators have no idea why their page is or isn't indexed.

**Why hidden quality_score fails**: A score that only affects sitemap inclusion without creator visibility creates a black box. Users publish incomplete pages, wonder why they don't appear in search, and blame the platform.

**P1-B/C principle**: Search readiness must be a visible, actionable product feature — not hidden backend logic.

---

## 2. Implementation Plan

### P1-B1: Entity Data Capture + Quality Score UI (~4 changes)

**A. Add entity fields to PageSettingsTab**

In `src/components/dashboard-v2/screens/settings/PageSettingsTab.tsx`, add a new "Search Identity" section between the existing "SEO" and "Category" sections:
- `profession` (text input): "Ваша профессия / специализация"
- `city` (text input): "Город"
- `entity_type` (select: person/organization): "Тип профиля"
- `contact_email` (text input, optional): "Публичный email"
- `contact_phone` (text input, optional): "Публичный телефон"
- `contact_whatsapp` (text input, optional): "WhatsApp"

These save to the `pages` table via a new `onUpdateEntityFields` callback.

**Props flow**: `DashboardV2.tsx` → `SettingsScreen` → `PageSettingsTab` → new `EntityFieldsSection` component.

**B. Surface quality_score as "Search Readiness" card**

New component: `src/components/dashboard-v2/widgets/SearchReadinessCard.tsx`

Shows:
- Score as progress bar (0-100)
- Status label: "Готово к поиску" (≥40) / "Почти готово" (20-39) / "Не готово" (<20)
- Checklist of missing items (computed client-side from pageData):
  - "Добавьте профессию" (if no profession)
  - "Укажите город" (if no city)
  - "Заполните описание (от 50 символов)" (if bio < 50 chars)
  - "Добавьте хотя бы одну услугу" (if no pricing block)
  - "Загрузите фото профиля" (if no avatar)
  - "Добавьте ссылки на соцсети" (if no socials block)
  - "Настройте запись или контакт" (if no booking/contact)

Place this card on `HomeScreen` below the page card and in `PageSettingsTab` SEO section.

**C. Fetch entity fields from DB**

Update `src/services/pages.ts` (or `SupabasePageRepository`) to include `city`, `profession`, `entity_type`, `contact_email`, `contact_phone`, `contact_whatsapp` in the page load query and expose them in `PageData`.

Update `src/types/page.ts` `PageData` interface to include these fields.

**D. Save entity fields**

New service function `updatePageEntityFields(pageId, fields)` that updates the `pages` table directly. Called from `PageSettingsTab` on blur/save.

**Files changed**:
- `src/types/page.ts` — add entity fields to PageData
- `src/services/pages.ts` — add entity fields to load/save
- `src/repositories/implementations/SupabasePageRepository.ts` — include entity fields in queries
- `src/components/dashboard-v2/screens/settings/PageSettingsTab.tsx` — add EntityFieldsSection
- New: `src/components/dashboard-v2/widgets/SearchReadinessCard.tsx`
- `src/components/dashboard-v2/screens/HomeScreen.tsx` — add SearchReadinessCard
- `src/hooks/page/useCloudPageState.ts` — expose entity fields in state

---

### P1-B2: IndexNow Wiring (~2 changes)

**A. Wire notify-indexnow into publish flow**

In `src/hooks/page/useCloudPageState.ts`, after successful `publishPageMutation.mutateAsync()` in both `autoSaveAndPublish` and `publish`, add:

```ts
// Fire-and-forget IndexNow notification
if (slug && pageData?.isPublished) {
  const pageUrl = `https://lnkmx.my/${slug}`;
  supabase.functions.invoke('notify-indexnow', {
    body: { urls: [pageUrl] }
  }).catch(() => {}); // Silent fail
}
```

**B. Deduplicate**: Add a simple throttle — don't send IndexNow more than once per slug per 5 minutes. Use a module-level `Map<string, number>` with last-sent timestamps.

**C. Don't send for noindex pages**: Check `quality_score >= 40` before sending. If quality_score isn't loaded client-side yet, skip the check (SSR will handle noindex anyway).

**Files changed**:
- `src/hooks/page/useCloudPageState.ts` — add IndexNow call after publish
- `src/hooks/page/usePageCache.ts` — ensure slug is returned from publish mutation

---

### P1-B3: Publish Governance Warnings (~1 change)

**A. Publish warning in autoSave flow**

Not blocking — LinkMAX auto-publishes on every edit. Instead, show a non-intrusive toast when page transitions from noindex to indexable or vice versa:

- When quality_score crosses 40 upward: toast.success("Ваша страница теперь видна в поиске")
- When quality_score drops below 40: toast.info("Страница пока не готова для поиска — заполните профиль")

Compute quality_score client-side using the same rubric as the DB function, after each save.

**B. New helper**: `src/lib/seo/quality-score.ts`

```ts
export function computeQualityScore(pageData: PageData): number {
  let score = 0;
  if (pageData.seo?.title || profileBlock?.name) score += 15;
  if (pageData.avatar_url || profileBlock?.avatarUrl) score += 10;
  // ... same rubric as save_page_blocks
  return score;
}
```

**Files changed**:
- New: `src/lib/seo/quality-score.ts`
- `src/hooks/page/useCloudPageState.ts` — compute and track score transitions

---

### P1-C1: Stable Child Page Slugs (~2 changes)

**Problem**: Service child pages derive slugs from service names at SSR time. If user renames a service, the URL changes → broken links, lost indexing.

**Solution**: Add a `service_slugs` JSONB column to `pages` table. When SSR generates a service child page, it checks this map. When a new service name appears without a slug, one is generated and persisted.

**Migration**:
```sql
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS service_slugs jsonb DEFAULT '{}'::jsonb;
```

Format: `{ "Маникюр гель-лак": "manikur-gel-lak", "Педикюр": "pedikur" }`

**SSR behavior**: When building service child pages in `generate-sitemap/index.ts`:
1. Load `service_slugs` from page record
2. For each pricing item, check if slug exists in map
3. If not, generate slug from name, check for collisions, store back to DB
4. Use stable slug for URL

**Slug persistence**: Add a lightweight `UPDATE pages SET service_slugs = $1 WHERE id = $2` call in the SSR handler when new slugs are generated.

**Files changed**:
- DB migration: add `service_slugs` jsonb to `pages`
- `supabase/functions/generate-sitemap/index.ts` — use stable slugs for service child pages, persist new ones

---

### P1-C2: Sitemap Inclusion Governance (~1 change)

Already mostly implemented in `generate-sitemap/index.ts` via `isPageIndexable()`. Tighten:

- Add `service_slugs` check: only include service child URLs if slug exists in `service_slugs` map
- Add event freshness check: exclude events older than 30 days
- Add `<lastmod>` from actual `updated_at`, not current date (verify this is already correct)

**Files changed**:
- `supabase/functions/generate-sitemap/index.ts` — minor tightening of inclusion rules

---

## 3. Copy & States

| State | Label (RU) | Where shown |
|-------|-----------|-------------|
| score ≥ 40 | ✅ Готово к поиску | HomeScreen card, Settings |
| score 20-39 | ⚠️ Почти готово | HomeScreen card |
| score < 20 | 🔴 Не готово для поиска | HomeScreen card |
| Missing profession | Укажите профессию | Checklist item |
| Missing city | Укажите город | Checklist item |
| Missing bio | Добавьте описание (от 50 символов) | Checklist item |
| Missing services | Добавьте хотя бы одну услугу | Checklist item |
| Missing avatar | Загрузите фото профиля | Checklist item |
| Missing socials | Добавьте ссылки на соцсети | Checklist item |
| IndexNow sent | Отправлено в поисковые системы | Toast (once) |
| Score crossed 40↑ | Страница готова к индексации | Toast |
| Score dropped <40 | Заполните профиль для видимости в поиске | Toast |

---

## 4. What NOT to Do

- Don't block publishing based on quality score — auto-publish must keep working
- Don't build a full SEO audit panel — one card with checklist is enough
- Don't gamify the score (no badges, no leaderboard)
- Don't send IndexNow on every keystroke — throttle to 5min per slug
- Don't create child pages for services without stable persisted slugs
- Don't show creator raw JSON-LD or canonical URLs — keep it human

---

## 5. Priority Order

1. **P1-B1** (entity fields in UI + SearchReadinessCard) — highest UX impact, unblocks data collection
2. **P1-B2** (IndexNow wiring) — completes the indexing pipeline
3. **P1-C1** (stable service slugs) — prevents URL drift
4. **P1-B3** (quality transitions + client-side scoring) — polish layer
5. **P1-C2** (sitemap tightening) — minor governance

---

## 6. Final Recommendation

**Architecture in one phrase**: Make search readiness a visible, actionable product feature with entity field capture in settings, a quality checklist on home screen, IndexNow wired into publish flow, and stable child page slugs.

**Main bottleneck**: Entity fields exist in DB but have zero UI — creators can't fill what they can't see.

**Main change**: `SearchReadinessCard` + entity fields in `PageSettingsTab` — turns hidden scoring into an actionable creator tool.

**First phase**: P1-B1 — add entity field inputs to settings and the readiness card to home screen. Everything else depends on creators actually having a way to fill these fields.

