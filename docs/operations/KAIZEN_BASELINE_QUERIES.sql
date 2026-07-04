-- LinkMAX Kaizen baseline queries
-- Status: Active Draft
-- Cycle: KZN Cycle 01
-- Purpose: read-only queries for the first baseline across signup -> publish -> lead/booking -> CRM.
--
-- Usage:
-- 1. Run in Supabase SQL Editor with a read-capable role.
-- 2. Adjust params.start_at / params.end_at for the baseline window.
-- 3. Do not run as a migration. These queries are read-only.

-- ============================================================================
-- 0) Baseline window
-- ============================================================================

with params as (
  select
    now() - interval '30 days' as start_at,
    now() as end_at
)
select start_at, end_at
from params;

-- ============================================================================
-- 1) Auth funnel baseline
-- Measures successful auth events and common drop-off/error points.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
)
select
  event_type,
  count(*) as event_count,
  count(distinct metadata ->> 'session_id') as sessions
from public.analytics, params
where created_at >= params.start_at
  and created_at < params.end_at
  and event_type like 'auth:%'
group by event_type
order by event_count desc;

-- ============================================================================
-- 2) Activation funnel baseline
-- Uses existing activation events from src/lib/activation-events.ts.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
)
select
  event_type,
  count(*) as event_count,
  count(distinct page_id) filter (where page_id is not null) as pages
from public.analytics, params
where created_at >= params.start_at
  and created_at < params.end_at
  and event_type in (
    'activation:wizard_started',
    'activation:wizard_niche_selected',
    'activation:wizard_completed',
    'activation:page_published',
    'activation:funnel_step_create_page_completed',
    'activation:funnel_step_add_block_completed',
    'activation:funnel_step_publish_completed',
    'activation:first_lead_captured',
    'activation:funnel_step_first_lead_completed'
  )
group by event_type
order by event_type;

-- ============================================================================
-- 3) Publish rate baseline
-- Approximation: unique users with auth success vs unique pages published.
-- If auth events cannot be connected to user_id, use sessions as signup baseline.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
),
auth_success as (
  select count(distinct metadata ->> 'session_id') as successful_signup_sessions
  from public.analytics, params
  where created_at >= params.start_at
    and created_at < params.end_at
    and event_type = 'auth:auth_success'
),
published_pages as (
  select count(distinct page_id) as published_pages
  from public.analytics, params
  where created_at >= params.start_at
    and created_at < params.end_at
    and event_type in (
      'activation:page_published',
      'activation:funnel_step_publish_completed'
    )
)
select
  successful_signup_sessions,
  published_pages,
  case
    when successful_signup_sessions = 0 then 0
    else round((published_pages::numeric / successful_signup_sessions::numeric) * 100, 2)
  end as publish_rate_percent
from auth_success, published_pages;

-- ============================================================================
-- 4) Published pages with leads/bookings
-- Measures whether public pages are producing business value.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
),
published_pages as (
  select id, user_id
  from public.pages, params
  where is_published = true
    and created_at < params.end_at
),
lead_pages as (
  select distinct metadata ->> 'page_id' as page_id
  from public.leads, params
  where created_at >= params.start_at
    and created_at < params.end_at
    and metadata ? 'page_id'
),
booking_pages as (
  select distinct page_id
  from public.bookings, params
  where created_at >= params.start_at
    and created_at < params.end_at
)
select
  count(*) as published_pages,
  count(*) filter (where lead_pages.page_id is not null) as pages_with_leads,
  count(*) filter (where booking_pages.page_id is not null) as pages_with_bookings,
  count(*) filter (where lead_pages.page_id is not null or booking_pages.page_id is not null) as pages_with_lead_or_booking,
  case
    when count(*) = 0 then 0
    else round(
      (count(*) filter (where lead_pages.page_id is not null or booking_pages.page_id is not null)::numeric / count(*)::numeric) * 100,
      2
    )
  end as lead_or_booking_rate_percent
from published_pages
left join lead_pages on lead_pages.page_id = published_pages.id::text
left join booking_pages on booking_pages.page_id = published_pages.id;

-- ============================================================================
-- 5) CRM response baseline
-- First response is the earliest lead_seen / lead_replied / first_lead_reply / status change event after lead creation.
-- The lead id is expected in analytics.metadata->>'leadId'.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
),
lead_events as (
  select
    metadata ->> 'leadId' as lead_id,
    min(created_at) as first_response_at
  from public.analytics, params
  where created_at >= params.start_at
    and created_at < params.end_at
    and event_type in (
      'activation:lead_seen',
      'activation:lead_replied',
      'activation:first_lead_reply',
      'activation:lead_status_changed'
    )
    and metadata ? 'leadId'
  group by metadata ->> 'leadId'
),
lead_response as (
  select
    leads.id,
    leads.created_at,
    lead_events.first_response_at,
    extract(epoch from (lead_events.first_response_at - leads.created_at)) / 60 as response_minutes
  from public.leads, params
  left join lead_events on lead_events.lead_id = leads.id::text
  where leads.created_at >= params.start_at
    and leads.created_at < params.end_at
)
select
  count(*) as leads_total,
  count(first_response_at) as leads_with_response,
  percentile_cont(0.5) within group (order by response_minutes) filter (where response_minutes is not null) as median_response_minutes,
  avg(response_minutes) filter (where response_minutes is not null) as avg_response_minutes
from lead_response;

-- ============================================================================
-- 6) Booking funnel baseline
-- Measures booking progression from slot selection to payment/completion.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
)
select
  event_type,
  count(*) as event_count,
  count(distinct metadata ->> 'bookingId') filter (where metadata ? 'bookingId') as bookings
from public.analytics, params
where created_at >= params.start_at
  and created_at < params.end_at
  and event_type in (
    'activation:booking_slot_selected',
    'activation:booking_form_opened',
    'activation:booking_submitted',
    'activation:booking_prepayment_initiated',
    'activation:booking_payment_confirmed',
    'activation:booking_completed',
    'activation:booking_cancelled'
  )
group by event_type
order by event_type;

-- ============================================================================
-- 7) Editor friction baseline
-- Measures editor actions likely to indicate friction or repeat problems.
-- ============================================================================

with params as (
  select now() - interval '30 days' as start_at, now() as end_at
)
select
  event_type,
  count(*) as event_count
from public.analytics, params
where created_at >= params.start_at
  and created_at < params.end_at
  and event_type like 'editor:%'
  and event_type in (
    'editor:validation_error_seen',
    'editor:friction_detected',
    'editor:friction_suggestion_accepted',
    'editor:friction_suggestion_dismissed',
    'editor:autosave_batch_flushed'
  )
group by event_type
order by event_count desc;

-- ============================================================================
-- 8) Public page performance manual baseline
-- Web Vitals are usually collected outside SQL. Record baseline from monitoring:
-- - FCP public page
-- - LCP public page
-- - FCP editor preview
-- - LCP editor preview
-- ============================================================================
