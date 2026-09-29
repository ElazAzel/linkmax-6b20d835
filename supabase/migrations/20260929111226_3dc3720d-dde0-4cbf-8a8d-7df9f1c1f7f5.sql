CREATE OR REPLACE FUNCTION public.protect_user_profile_sensitive_columns()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role text;
BEGIN
  _role := coalesce(current_setting('request.jwt.claim.role', true), current_setting('role', true), 'anon');
  IF _role = 'service_role' OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')) THEN
    RETURN NEW;
  END IF;
  NEW.is_premium := OLD.is_premium;
  NEW.premium_tier := OLD.premium_tier;
  NEW.premium_expires_at := OLD.premium_expires_at;
  NEW.is_verified := OLD.is_verified;
  NEW.verification_status := OLD.verification_status;
  NEW.trial_ends_at := OLD.trial_ends_at;
  RETURN NEW;
END;
$function$;