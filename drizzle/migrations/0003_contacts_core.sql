CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text,
  email_norm text,
  phone_norm text,
  telegram text,
  whatsapp text,
  source text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_owner_phone_uniq ON public.contacts(owner_id, phone_norm) WHERE phone_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_owner_email_uniq ON public.contacts(owner_id, email_norm) WHERE email_norm IS NOT NULL;
GRANT SELECT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read contacts" ON public.contacts FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners update contacts" ON public.contacts FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete contacts" ON public.contacts FOR DELETE TO authenticated USING (owner_id = auth.uid());

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.digital_purchases ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_contact_id_idx ON public.leads(contact_id);

CREATE OR REPLACE FUNCTION public.upsert_contact(p_owner_id uuid, p_name text, p_email text, p_phone text, p_source text DEFAULT NULL, p_utm jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text := nullif(lower(trim(p_email)), '');
        v_phone text := nullif(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), '');
        v_id uuid;
BEGIN
  IF v_phone IS NULL AND v_email IS NULL THEN RETURN NULL; END IF;
  IF v_phone IS NOT NULL AND length(v_phone) = 11 AND left(v_phone,1) = '8' THEN v_phone := '7' || substr(v_phone,2); END IF;
  SELECT id INTO v_id FROM contacts WHERE owner_id = p_owner_id AND ((v_phone IS NOT NULL AND phone_norm = v_phone) OR (v_email IS NOT NULL AND email_norm = v_email)) LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO contacts(owner_id, name, email_norm, phone_norm, source, utm) VALUES (p_owner_id, p_name, v_email, v_phone, p_source, coalesce(p_utm,'{}'::jsonb))
    ON CONFLICT DO NOTHING RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM contacts WHERE owner_id = p_owner_id AND (phone_norm = v_phone OR email_norm = v_email) LIMIT 1;
    END IF;
  ELSE
    UPDATE contacts SET last_seen_at = now(), name = coalesce(name, p_name),
      email_norm = coalesce(email_norm, v_email), phone_norm = coalesce(phone_norm, v_phone) WHERE id = v_id;
  END IF;
  RETURN v_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.upsert_contact(uuid,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_contact(uuid,text,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.leads_link_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contact_id IS NULL THEN
    NEW.contact_id := public.upsert_contact(NEW.user_id, NEW.name, NEW.email, NEW.phone, NEW.source::text, '{}'::jsonb);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS leads_link_contact_trg ON public.leads;
CREATE TRIGGER leads_link_contact_trg BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.leads_link_contact();

UPDATE public.leads l SET contact_id = public.upsert_contact(l.user_id, l.name, l.email, l.phone, l.source::text, '{}'::jsonb)
WHERE l.contact_id IS NULL AND (coalesce(l.phone,'') <> '' OR coalesce(l.email,'') <> '');