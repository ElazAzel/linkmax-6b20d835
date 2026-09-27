ALTER TABLE public.events
  ALTER COLUMN checkin_token
  SET DEFAULT replace(replace(replace(encode(extensions.gen_random_bytes(24), 'base64'), '/', ''), '+', ''), '=', '');

CREATE OR REPLACE FUNCTION public.rotate_event_checkin_token(p_event_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  UPDATE public.events
  SET checkin_token = replace(replace(replace(encode(extensions.gen_random_bytes(24), 'base64'), '/', ''), '+', ''), '=', ''),
      updated_at = now()
  WHERE id = p_event_id
    AND owner_id = auth.uid()
  RETURNING checkin_token INTO v_token;

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_event_checkin_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.rotate_event_checkin_token(uuid) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.gen_event_checkin_token();