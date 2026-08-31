
-- =============================================
-- 1. Trigger: auto-sync leads (from Form block) to zone contacts
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_lead_to_zone_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_id uuid;
BEGIN
  -- leads don't have page_id directly; find primary page of user
  SELECT id INTO v_page_id
  FROM public.pages
  WHERE user_id = NEW.user_id AND organization_id IS NOT NULL
  LIMIT 1;

  IF v_page_id IS NULL THEN RETURN NEW; END IF;

  PERFORM public.sync_block_contact_to_zone(
    v_page_id,
    NEW.name,
    NEW.email,
    NEW.phone,
    'form'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_sync_contact ON public.leads;
CREATE TRIGGER trg_lead_sync_contact
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_lead_to_zone_contact();

-- =============================================
-- 2. Trigger: paid event registrations → zone deals
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_paid_event_to_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_zone_id uuid;
  v_event_title text;
  v_contact_id uuid;
  v_stage_id uuid;
BEGIN
  -- Only process paid registrations
  IF NEW.payment_status != 'paid' OR NEW.paid_amount IS NULL OR NEW.paid_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get zone from page
  SELECT organization_id INTO v_zone_id
  FROM public.pages WHERE id = NEW.page_id;

  IF v_zone_id IS NULL THEN RETURN NEW; END IF;

  -- Get event title
  SELECT COALESCE(title_i18n_json->>'ru', title_i18n_json->>'en', 'Event') INTO v_event_title
  FROM public.events WHERE id = NEW.event_id;

  -- Find or create contact
  SELECT id INTO v_contact_id
  FROM public.zone_contacts
  WHERE zone_id = v_zone_id AND email = NEW.attendee_email
  LIMIT 1;

  -- Get default/first stage
  SELECT id INTO v_stage_id
  FROM public.zone_deal_stages
  WHERE zone_id = v_zone_id AND is_default = true
  LIMIT 1;

  IF v_stage_id IS NULL THEN
    SELECT id INTO v_stage_id
    FROM public.zone_deal_stages
    WHERE zone_id = v_zone_id
    ORDER BY order_index ASC
    LIMIT 1;
  END IF;

  -- Create deal
  INSERT INTO public.zone_deals (
    zone_id, contact_id, title, stage_id, value_amount, currency, source, status
  ) VALUES (
    v_zone_id,
    v_contact_id,
    v_event_title || ' — ' || NEW.attendee_name,
    v_stage_id,
    NEW.paid_amount,
    COALESCE(NEW.currency, 'KZT'),
    'event',
    'won'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paid_event_to_deal ON public.event_registrations;
CREATE TRIGGER trg_paid_event_to_deal
  AFTER INSERT OR UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_paid_event_to_deal();

-- =============================================
-- 3. Trigger: pricing block save → zone_products upsert
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_pricing_block_to_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_zone_id uuid;
  v_item jsonb;
  v_items jsonb;
BEGIN
  -- Only process pricing blocks
  IF NEW.type != 'pricing' THEN RETURN NEW; END IF;

  -- Get zone from page
  SELECT organization_id INTO v_zone_id
  FROM public.pages WHERE id = NEW.page_id;

  IF v_zone_id IS NULL THEN RETURN NEW; END IF;

  -- Extract items from content
  v_items := NEW.content->'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN RETURN NEW; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    INSERT INTO public.zone_products (zone_id, name, unit_price, currency, unit, is_active)
    VALUES (
      v_zone_id,
      COALESCE(v_item->>'title', v_item->>'name', 'Product'),
      COALESCE((v_item->>'price')::numeric, 0),
      COALESCE(v_item->>'currency', 'KZT'),
      COALESCE(v_item->>'unit', 'шт'),
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pricing_to_products ON public.blocks;
CREATE TRIGGER trg_pricing_to_products
  AFTER INSERT OR UPDATE ON public.blocks
  FOR EACH ROW
  WHEN (NEW.type = 'pricing')
  EXECUTE FUNCTION public.trigger_pricing_block_to_products();

-- =============================================
-- 4. Add calendar_feed_token to zones table
-- =============================================
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS calendar_feed_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex');
