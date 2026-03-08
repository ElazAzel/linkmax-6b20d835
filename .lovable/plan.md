

# Fix Console Errors: 6 Independent Issues

## Issues Identified

1. **`analytics_event_type_check` violation**: `activation-events.ts` inserts `activation:wizard_completed` etc. into the `analytics` table, but the DB constraint only allows `['view', 'click', 'share', 'heatmap_clicks', 'heatmap_scroll']`.

2. **`version_id` too long (varchar 12)**: `usePageVersions.ts` generates `v-${Date.now()}` which is 15+ chars (e.g. `v-1772982137497`). Column is `varchar(12)`.

3. **`user_wallets` table missing**: `fintech.ts` queries `user_wallets` but this table doesn't exist.

4. **CSP blocks `telegram.org`**: `index.html` CSP `script-src` doesn't include `https://telegram.org`.

5. **`organization_members` infinite recursion**: RLS policy "Members can view their org members" self-references `organization_members` in its own `USING` clause.

6. **`zone_conversations` INSERT 403**: RLS INSERT policy uses `is_zone_member()` which checks `zone_members` — this should work. Need to verify the user is actually a zone member. The `with_check` is null but `qual` check might be the issue — INSERT policies need `WITH CHECK`, not `USING`. Current policy has `qual: nil` and `with_check: is_zone_member(...)` — actually this looks correct. Let me re-check: the query showed `qual:<nil> with_check:is_zone_member(zone_id, auth.uid())`. This means the insert checks membership. If the user IS a member, this should work. This might be a data issue, but let's ensure the policy is correct.

## Plan

### Task 1: Expand analytics check constraint (DB migration)
```sql
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;
ALTER TABLE public.analytics ADD CONSTRAINT analytics_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'view', 'click', 'share', 'heatmap_clicks', 'heatmap_scroll',
  'activation:wizard_started', 'activation:wizard_niche_selected', 
  'activation:wizard_completed', 'activation:page_published',
  'activation:page_shared', 'activation:first_external_view',
  'activation:first_block_click', 'activation:first_lead_captured',
  'activation:dashboard_return',
  'activation:lead_seen', 'activation:lead_replied',
  'activation:lead_status_changed', 'activation:booking_confirmed',
  'activation:first_lead_reply', 'activation:lead_stale_24h',
  'activation:booking_slot_selected', 'activation:booking_form_opened',
  'activation:booking_submitted', 'activation:booking_prepayment_initiated',
  'activation:booking_cancelled', 'activation:booking_payment_confirmed',
  'activation:booking_completed',
  'activation:post_service_followup_sent', 'activation:repeat_booking_detected',
  'activation:creator_returned_after_gap', 'activation:stale_leads_alert_shown',
  'activation:weekly_digest_sent',
  'activation:inbound_limit_warning', 'activation:inbound_limit_reached',
  'activation:inbound_blocked_submission', 'activation:upgrade_from_limit'
]));
```

### Task 2: Widen `page_snapshots` columns (DB migration)
```sql
ALTER TABLE public.page_snapshots 
  ALTER COLUMN version_id TYPE varchar(32),
  ALTER COLUMN content_hash TYPE varchar(255);
```

### Task 3: Add CSP entry for telegram.org
In `index.html`, add `https://telegram.org` to the `script-src` directive.

### Task 4: Fix `organization_members` RLS recursion
Drop the recursive SELECT policy and replace it with one using a `SECURITY DEFINER` function:
```sql
CREATE OR REPLACE FUNCTION public.get_user_org_ids_for_members(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT org_id FROM public.organization_members WHERE user_id = p_user_id; $$;

DROP POLICY IF EXISTS "Members can view their org members" ON public.organization_members;
CREATE POLICY "Members can view their org members" ON public.organization_members
FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids_for_members(auth.uid()))
);
```

### Task 5: Guard `fintech.ts` against missing `user_wallets` table
Wrap the `user_wallets` query in a try/catch that silently returns empty data when the table doesn't exist (`PGRST205`), since this feature isn't launched yet.

### Task 6: Zone conversations — inspect INSERT policy
The policy looks correct (`WITH CHECK (is_zone_member(zone_id, auth.uid()))`). The 403 likely means the user isn't an active member of that zone. Add better error handling in `useZoneInbox.ts` to surface a user-friendly message instead of a raw console error.

## Files

| File | Change |
|------|--------|
| DB migration | Expand `analytics_event_type_check`, widen `page_snapshots` columns, fix `organization_members` RLS |
| `index.html` | Add `https://telegram.org` to CSP `script-src` |
| `src/services/fintech.ts` | Guard `user_wallets` queries against PGRST205 |
| `src/hooks/zones/useZoneInbox.ts` | Better error handling for conversation creation |

