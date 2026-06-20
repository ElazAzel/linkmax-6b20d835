
REVOKE SELECT (
  contact_email, contact_phone, contact_whatsapp,
  webhook_url, webhook_secret,
  quality_breakdown, index_exclusion_reasons
) ON public.pages FROM anon, authenticated;
