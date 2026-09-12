
-- =============================================
-- RPC: sync_block_contact_to_zone
-- When a booking/event registration/form submission/newsletter subscription happens,
-- auto-create a contact in the zone if the page is linked to a zone (organization_id)
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_block_contact_to_zone(
  p_page_id uuid,
  p_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_source_tag text DEFAULT 'block',
  p_owner_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_zone_id uuid;
  v_contact_id uuid;
  v_page_owner uuid;
BEGIN
  -- Get zone_id from page's organization_id
  SELECT organization_id, user_id INTO v_zone_id, v_page_owner
  FROM public.pages WHERE id = p_page_id;

  -- If page is not linked to a zone, skip
  IF v_zone_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if contact already exists by email in this zone
  IF p_email IS NOT NULL AND p_email != '' THEN
    SELECT id INTO v_contact_id
    FROM public.zone_contacts
    WHERE zone_id = v_zone_id AND email = p_email
    LIMIT 1;
  END IF;

  -- If not found by email, check by phone
  IF v_contact_id IS NULL AND p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT id INTO v_contact_id
    FROM public.zone_contacts
    WHERE zone_id = v_zone_id AND phone = p_phone
    LIMIT 1;
  END IF;

  -- If contact exists, update tags to include source
  IF v_contact_id IS NOT NULL THEN
    UPDATE public.zone_contacts
    SET tags = CASE
      WHEN NOT (tags @> ARRAY[p_source_tag]) THEN array_append(tags, p_source_tag)
      ELSE tags
    END,
    updated_at = now()
    WHERE id = v_contact_id;
    RETURN v_contact_id;
  END IF;

  -- Create new contact
  INSERT INTO public.zone_contacts (zone_id, name, email, phone, tags, owner_user_id)
  VALUES (v_zone_id, p_name, p_email, p_phone, ARRAY[p_source_tag], COALESCE(p_owner_user_id, v_page_owner))
  RETURNING id INTO v_contact_id;

  RETURN v_contact_id;
END;
$$;

-- =============================================
-- Trigger: auto-sync bookings to zone contacts
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_booking_to_zone_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_block_contact_to_zone(
    NEW.page_id,
    NEW.client_name,
    NEW.client_email,
    NEW.client_phone,
    'booking'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_sync_contact ON public.bookings;
CREATE TRIGGER trg_booking_sync_contact
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_to_zone_contact();

-- =============================================
-- Trigger: auto-sync event registrations to zone contacts
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_event_reg_to_zone_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_block_contact_to_zone(
    NEW.page_id,
    NEW.attendee_name,
    NEW.attendee_email,
    NEW.attendee_phone,
    'event'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_reg_sync_contact ON public.event_registrations;
CREATE TRIGGER trg_event_reg_sync_contact
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_event_reg_to_zone_contact();

-- =============================================
-- Trigger: auto-sync newsletter subscriptions to zone contacts  
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_newsletter_to_zone_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_id uuid;
BEGIN
  v_page_id := NEW.page_id;
  IF v_page_id IS NULL THEN RETURN NEW; END IF;
  
  PERFORM public.sync_block_contact_to_zone(
    v_page_id,
    split_part(NEW.email, '@', 1), -- use email prefix as name
    NEW.email,
    NULL,
    'newsletter'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_sync_contact ON public.newsletter_subscriptions;
CREATE TRIGGER trg_newsletter_sync_contact
  AFTER INSERT ON public.newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_newsletter_to_zone_contact();
