CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  candidate text;
  counter integer := 0;
BEGIN
  base_username := lower(regexp_replace(
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'username', ''),
      NULLIF(SPLIT_PART(COALESCE(new.email, ''), '@', 1), ''),
      'user'
    ),
    '[^a-zA-Z0-9_-]', '', 'g'
  ));

  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 6);
  END IF;

  base_username := substr(base_username, 1, 24);
  candidate := base_username;

  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = candidate) LOOP
    counter := counter + 1;
    candidate := substr(base_username, 1, 20) || counter::text;
    IF counter > 500 THEN
      candidate := base_username || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (
    new.id,
    candidate,
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'display_name', ''),
      NULLIF(SPLIT_PART(COALESCE(new.email, ''), '@', 1), ''),
      candidate
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$function$;