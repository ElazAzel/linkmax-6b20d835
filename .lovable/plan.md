

# Repeat Booking / Retention Growth Loop

## Verdict

The product has a working acquisition-to-first-booking path but **zero systematic post-service retention**. The OperatorSummaryWidget has a rudimentary "write to yesterday's clients" feature, but:
- There's no `completed` status being set automatically — owners must manually mark bookings
- The follow-up message is generic and doesn't include a rebook link
- There's no rebooking timing logic
- The client never receives a direct "book again" URL
- Repeat customer detection exists (`useRepeatCustomers`) but isn't actionable

This is the single highest-ROI layer to build now because repeat bookings cost zero acquisition effort and directly increase revenue per user — which is the Pro upgrade trigger (50 inbound limit).

## Implementation — 6 Tasks

### Task 1: DB Migration — Add `completed_at` and `followup_sent_at` to bookings

The `bookings` table already has `status` (with `completed` in `statusColors`) and `handleCompleteBooking` exists in `BookingsPanel.tsx`. But there's no `completed_at` timestamp or `followup_sent_at` tracking.

```sql
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;

-- Auto-complete bookings where slot_date is yesterday and status is 'confirmed'
-- This runs as a lightweight trigger approach: when owner opens dashboard,
-- past confirmed bookings auto-transition. But we also add a simple function
-- that can be called to batch-complete.
CREATE OR REPLACE FUNCTION public.auto_complete_past_bookings(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.bookings
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE owner_id = p_owner_id
    AND status = 'confirmed'
    AND slot_date < CURRENT_DATE
  RETURNING 1;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
```

### Task 2: Auto-complete logic on dashboard load + manual complete button

**In `BookingsPanel.tsx`** — call `auto_complete_past_bookings` RPC on mount so confirmed bookings from past dates automatically move to `completed`. Also update `handleCompleteBooking` to set `completed_at`.

**In `OperatorSummaryWidget.tsx`** — change the "yesterday's completed" query: instead of filtering by `status = 'confirmed' AND slot_date = yesterday`, query `status = 'completed' AND followup_sent_at IS NULL AND slot_date < today` (recently completed, no follow-up sent yet). This surfaces follow-up opportunities for the last 3 days, not just yesterday.

### Task 3: Enhanced follow-up with rebook link

Update `OperatorSummaryWidget.tsx` follow-up handler:

1. The WhatsApp message template should include a **direct rebook link**: the page's public URL (e.g., `lnkmx.my/{slug}`)
2. After sending, mark `followup_sent_at = now()` on the booking record
3. Show "Отправлено ✓" state instead of the button after marking

**3 niche-specific message templates** (selected based on page niche or default):

- **Beauty**: "Здравствуйте, {{name}}! Спасибо за визит 💅 Как вам результат? Записаться снова: {{url}}"
- **Wellness/Massage**: "{{name}}, спасибо за визит! Для повторной записи: {{url}} 🙏"
- **Default**: "{{name}}, спасибо! Записаться снова можно здесь: {{url}}"

Pass `pageSlug` (already available via pageData) to construct the URL.

### Task 4: "Repeat Opportunities" section in OperatorSummaryWidget

Add a new section below the follow-up section that shows clients who:
- Had their last completed booking 2-4 weeks ago (configurable later)
- Haven't booked again since
- Have a phone number

This uses the existing `useRepeatCustomers` data + a new query for "clients due for rebooking":

```typescript
// New query in OperatorSummaryWidget
const { data: rebookCandidates } = await supabase
  .from('bookings')
  .select('client_name, client_phone, slot_date, page_id')
  .eq('owner_id', user.id)
  .eq('status', 'completed')
  .gte('slot_date', format(subDays(new Date(), 35), 'yyyy-MM-dd'))
  .lte('slot_date', format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  .order('slot_date', { ascending: false });
```

Then filter out those who already have a newer booking. Show as cards with "Напомнить о записи" button that opens WhatsApp with a rebook message.

**UI**: Purple-tinted card (matching repeat customer theme), icon `Repeat`, max 3 shown.

### Task 5: BookingCard + BookingsPanel — completed state + follow-up indicators

**BookingCard.tsx**: Add `completed` status rendering (blue checkmark badge, like the `statusColors` map already defines). Currently BookingCard only shows pending/confirmed.

**BookingsPanel.tsx**: 
- For completed bookings, show a "Написать" (follow-up) button instead of confirm/cancel actions
- Show a green checkmark if `followup_sent_at` is set
- Add repeat customer badge (already exists inline, just verify it renders for completed bookings too)

### Task 6: Analytics events + DB constraint update

Add new event types to `activation-events.ts`:
- `booking_marked_completed`
- `repeat_followup_sent` (distinct from generic `post_service_followup_sent` — includes rebook URL)
- `repeat_opportunity_shown`
- `repeat_booking_started` (when client clicks rebook link from follow-up — tracked via UTM on page URL)

DB migration to expand analytics constraint with these new types.

Track:
- In `handleCompleteBooking`: track `booking_marked_completed`
- In enhanced follow-up handler: track `repeat_followup_sent` with `{ bookingId, hasRebookLink: true }`
- In rebook opportunity cards: track `repeat_opportunity_shown` on render

---

## What NOT to Do

- No automated WhatsApp sending — always manual tap (avoids spam, keeps trust)
- No loyalty points or gamification
- No client-side portal or client accounts
- No complex rebooking timing engine — simple 14-28 day window is enough
- No push notifications infrastructure
- No email follow-up system (WhatsApp is the channel for KZ/CIS)
- Don't add a separate "Retention" tab — keep everything in existing OperatorSummary + BookingsPanel

## Priority Order

1. **DB migration** (completed_at, followup_sent_at, auto_complete function) — foundation
2. **Auto-complete + enhanced follow-up with rebook link** — highest immediate value, turns existing widget into retention engine
3. **Rebook opportunity cards** — surfaces dormant revenue
4. **BookingsPanel completed state** — operational clarity
5. **Analytics** — measurement

## Fastest ROI Surface

**Enhanced follow-up message with rebook link** (Task 3). It requires minimal code change to an existing feature (OperatorSummaryWidget already has the button), but transforms a generic "how was it?" message into a direct revenue-generating action. Every follow-up becomes a rebooking opportunity.

