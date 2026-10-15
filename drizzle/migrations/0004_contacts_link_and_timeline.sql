CREATE OR REPLACE FUNCTION public.bookings_link_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contact_id IS NULL AND NEW.owner_id IS NOT NULL THEN
    NEW.contact_id := public.upsert_contact(NEW.owner_id, NEW.client_name, NEW.client_email, NEW.client_phone, 'booking', '{}'::jsonb);
  END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bookings_link_contact_trg ON public.bookings;
CREATE TRIGGER bookings_link_contact_trg BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_link_contact();

CREATE OR REPLACE FUNCTION public.event_reg_link_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contact_id IS NULL AND NEW.owner_id IS NOT NULL THEN
    NEW.contact_id := public.upsert_contact(NEW.owner_id, NEW.attendee_name, NEW.attendee_email, NEW.attendee_phone, 'event', coalesce(NEW.utm_json,'{}'::jsonb));
  END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS event_reg_link_contact_trg ON public.event_registrations;
CREATE TRIGGER event_reg_link_contact_trg BEFORE INSERT ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.event_reg_link_contact();

CREATE OR REPLACE FUNCTION public.purchase_link_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contact_id IS NULL AND NEW.seller_id IS NOT NULL THEN
    NEW.contact_id := public.upsert_contact(NEW.seller_id, NULL, NEW.buyer_email, NULL, 'purchase', '{}'::jsonb);
  END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS purchase_link_contact_trg ON public.digital_purchases;
CREATE TRIGGER purchase_link_contact_trg BEFORE INSERT ON public.digital_purchases FOR EACH ROW EXECUTE FUNCTION public.purchase_link_contact();

UPDATE public.bookings SET contact_id = public.upsert_contact(owner_id, client_name, client_email, client_phone, 'booking', '{}'::jsonb) WHERE contact_id IS NULL AND owner_id IS NOT NULL;
UPDATE public.event_registrations SET contact_id = public.upsert_contact(owner_id, attendee_name, attendee_email, attendee_phone, 'event', coalesce(utm_json,'{}'::jsonb)) WHERE contact_id IS NULL AND owner_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_contact_timeline(p_contact_id uuid)
RETURNS TABLE(kind text, title text, amount numeric, currency text, happened_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH c AS (SELECT id FROM contacts WHERE id = p_contact_id AND owner_id = auth.uid())
  SELECT 'lead'::text, coalesce(l.source::text,'form'), NULL::numeric, NULL::text, l.created_at FROM leads l JOIN c ON l.contact_id = c.id
  UNION ALL
  SELECT 'booking', b.slot_date::text || ' ' || coalesce(b.slot_time::text,''), b.payment_amount::numeric, NULL, b.created_at FROM bookings b JOIN c ON b.contact_id = c.id
  UNION ALL
  SELECT 'event', coalesce(e.title_i18n_json->>'ru', e.title_i18n_json->>'en', ''), r.paid_amount::numeric, r.currency, r.created_at FROM event_registrations r JOIN c ON r.contact_id = c.id LEFT JOIN events e ON e.id = r.event_id
  UNION ALL
  SELECT 'purchase', coalesce(p.status,''), p.amount::numeric, p.currency, p.created_at FROM digital_purchases p JOIN c ON p.contact_id = c.id
  ORDER BY 5 DESC LIMIT 200
$$;
REVOKE EXECUTE ON FUNCTION public.get_contact_timeline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contact_timeline(uuid) TO authenticated, service_role;