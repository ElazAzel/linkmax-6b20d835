-- Keep public payment instructions attached to the authoritative service offering.
-- The value is intentionally limited to localized instructions; payment secrets and
-- provider payloads must never be stored in this public-readable field.

ALTER TABLE public.service_offerings
  ADD COLUMN IF NOT EXISTS payment_instructions_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.service_offerings
  DROP CONSTRAINT IF EXISTS service_offerings_payment_instructions_object;

ALTER TABLE public.service_offerings
  ADD CONSTRAINT service_offerings_payment_instructions_object
  CHECK (jsonb_typeof(payment_instructions_i18n) = 'object');

UPDATE public.service_offerings offering
SET payment_instructions_i18n = draft.draft #> '{depositPolicy,paymentInstructions}',
    updated_at = now()
FROM public.revenue_kit_drafts draft
WHERE offering.page_id = draft.page_id
  AND offering.source_kit_id = draft.kit_id
  AND jsonb_typeof(draft.draft #> '{depositPolicy,paymentInstructions}') = 'object';

CREATE OR REPLACE FUNCTION public.sync_revenue_kit_payment_instructions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.service_offerings
  SET payment_instructions_i18n = CASE
        WHEN jsonb_typeof(NEW.draft #> '{depositPolicy,paymentInstructions}') = 'object'
          THEN NEW.draft #> '{depositPolicy,paymentInstructions}'
        ELSE '{}'::jsonb
      END,
      updated_at = now()
  WHERE page_id = NEW.page_id
    AND source_kit_id = NEW.kit_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_revenue_kit_payment_instructions
  ON public.revenue_kit_drafts;

CREATE TRIGGER sync_revenue_kit_payment_instructions
AFTER INSERT OR UPDATE OF draft
ON public.revenue_kit_drafts
FOR EACH ROW
EXECUTE FUNCTION public.sync_revenue_kit_payment_instructions();

CREATE OR REPLACE FUNCTION public.get_public_booking_context(p_page_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object(
      'ok', true,
      'page', jsonb_build_object(
        'id', page.id,
        'slug', page.slug,
        'title', page.title
      ),
      'services', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', offering.id,
          'name', COALESCE(
            NULLIF(btrim(offering.name_i18n->>'ru'), ''),
            NULLIF(btrim(offering.name_i18n->>'kk'), ''),
            NULLIF(btrim(offering.name_i18n->>'en'), '')
          ),
          'description', COALESCE(
            offering.description_i18n->>'ru',
            offering.description_i18n->>'kk',
            offering.description_i18n->>'en'
          ),
          'durationMinutes', offering.duration_minutes,
          'priceAmount', to_char(offering.price_amount, 'FM9999999990.00'),
          'currency', offering.currency,
          'depositMode', offering.deposit_mode,
          'depositValue', to_char(offering.deposit_value, 'FM9999999990.00'),
          'paymentInstructions', offering.payment_instructions_i18n
        ) ORDER BY offering.display_order, offering.created_at)
        FROM public.service_offerings offering
        WHERE offering.page_id = page.id
          AND offering.is_active = true
      ), '[]'::jsonb)
    )
    FROM public.pages page
    WHERE page.id = p_page_id
      AND page.is_published = true
  ), jsonb_build_object('ok', false, 'code', 'page_not_public'));
$$;

REVOKE ALL ON FUNCTION public.get_public_booking_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_booking_context(uuid) TO anon, authenticated;

