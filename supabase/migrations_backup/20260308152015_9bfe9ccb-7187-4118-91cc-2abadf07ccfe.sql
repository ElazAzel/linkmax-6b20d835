
-- Expand analytics check constraint with growth surface events
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
  'activation:inbound_blocked_submission', 'activation:upgrade_from_limit',
  'activation:niche_landing_view', 'activation:niche_landing_cta_click',
  'activation:watermark_landing_view', 'activation:watermark_landing_cta_click',
  'activation:gallery_template_click',
  'activation:signup_from_niche_landing', 'activation:signup_from_watermark',
  'activation:signup_from_gallery'
]));
