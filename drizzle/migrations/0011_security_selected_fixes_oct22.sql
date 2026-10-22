-- Friendships: new rows may only be pending requests
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND friend_id IS DISTINCT FROM user_id AND status = 'pending');

-- create_user_page: caller may only create pages for themselves
CREATE OR REPLACE FUNCTION public.create_user_page_guard()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
DROP FUNCTION public.create_user_page_guard();

ALTER FUNCTION public.create_user_page(uuid, text, text) RENAME TO create_user_page_unchecked;
REVOKE ALL ON FUNCTION public.create_user_page_unchecked(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_page_unchecked(uuid, text, text) TO service_role;

CREATE FUNCTION public.create_user_page(p_user_id uuid, p_title text, p_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN public.create_user_page_unchecked(p_user_id, p_title, p_slug);
END $$;
REVOKE ALL ON FUNCTION public.create_user_page(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_user_page(uuid, text, text) TO authenticated, service_role;

-- Event registrations: visitors cannot self-confirm paid events or set payment state
CREATE OR REPLACE FUNCTION public.enforce_event_registration_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_paid boolean;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.owner_id IS NOT NULL AND NEW.owner_id = auth.uid() THEN RETURN NEW; END IF;
  SELECT COALESCE(e.is_paid, false) OR COALESCE(e.price_amount, 0) > 0 INTO v_paid
    FROM public.events e WHERE e.id = NEW.event_id;
  IF COALESCE(v_paid, false) THEN
    NEW.status := 'pending';
    NEW.payment_status := 'pending';
  ELSE
    IF NEW.status NOT IN ('pending', 'confirmed') THEN NEW.status := 'pending'; END IF;
    NEW.payment_status := 'free';
  END IF;
  NEW.paid_amount := NULL;
  NEW.provider := NULL;
  NEW.provider_payment_id := NULL;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS aa_enforce_event_registration_payment ON public.event_registrations;
CREATE TRIGGER aa_enforce_event_registration_payment
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_event_registration_payment();