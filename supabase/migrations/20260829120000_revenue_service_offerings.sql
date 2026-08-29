-- Revenue Core v1: normalized service offerings and public-safe access.

CREATE OR REPLACE FUNCTION public.is_valid_service_offering_configuration(
  p_name_i18n jsonb,
  p_price_amount numeric,
  p_deposit_mode text,
  p_deposit_value numeric
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    (
      NULLIF(btrim(COALESCE(p_name_i18n->>'ru', '')), '') IS NOT NULL
      OR NULLIF(btrim(COALESCE(p_name_i18n->>'kk', '')), '') IS NOT NULL
    )
    AND CASE p_deposit_mode
      WHEN 'none' THEN p_deposit_value = 0
      WHEN 'fixed' THEN p_deposit_value >= 0 AND p_deposit_value <= p_price_amount
      WHEN 'percent' THEN p_deposit_value BETWEEN 1 AND 100
      ELSE false
    END;
$$;

CREATE TABLE public.service_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_i18n jsonb NOT NULL,
  description_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 720),
  price_amount numeric(12, 2) NOT NULL CHECK (price_amount >= 0),
  currency text NOT NULL DEFAULT 'KZT' CHECK (currency ~ '^[A-Z]{3}$'),
  deposit_mode text NOT NULL DEFAULT 'none'
    CHECK (deposit_mode IN ('none', 'fixed', 'percent')),
  deposit_value numeric(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_value >= 0),
  cancellation_window_hours integer NOT NULL DEFAULT 24
    CHECK (cancellation_window_hours BETWEEN 0 AND 720),
  rebooking_interval_days integer
    CHECK (rebooking_interval_days IS NULL OR rebooking_interval_days BETWEEN 1 AND 365),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_offerings_page_id_id_key UNIQUE (page_id, id),
  CONSTRAINT service_offerings_configuration_check CHECK (
    public.is_valid_service_offering_configuration(
      name_i18n,
      price_amount,
      deposit_mode,
      deposit_value
    )
  )
);

CREATE INDEX idx_service_offerings_page_active_order
  ON public.service_offerings (page_id, is_active, display_order);

CREATE INDEX idx_service_offerings_owner_updated
  ON public.service_offerings (owner_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_service_offering_page_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_page_owner_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
    AND (
      NEW.page_id IS DISTINCT FROM OLD.page_id
      OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    )
  THEN
    RAISE EXCEPTION 'service_offering_ownership_immutable' USING ERRCODE = '42501';
  END IF;

  SELECT page.user_id
  INTO v_page_owner_id
  FROM public.pages page
  WHERE page.id = NEW.page_id;

  IF v_page_owner_id IS NULL THEN
    RAISE EXCEPTION 'service_offering_page_not_found' USING ERRCODE = '23503';
  END IF;

  IF NEW.owner_id IS DISTINCT FROM v_page_owner_id THEN
    RAISE EXCEPTION 'service_offering_owner_mismatch' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_service_offering_page_owner
BEFORE INSERT OR UPDATE OF page_id, owner_id ON public.service_offerings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_service_offering_page_owner();

CREATE TRIGGER update_service_offerings_updated_at
BEFORE UPDATE ON public.service_offerings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.service_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active offerings on published pages"
ON public.service_offerings
FOR SELECT
TO anon, authenticated
USING (
  is_active
  AND EXISTS (
    SELECT 1
    FROM public.pages page
    WHERE page.id = service_offerings.page_id
      AND page.is_published = true
  )
);

CREATE POLICY "Owners and workspace members can view service offerings"
ON public.service_offerings
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.pages page
    JOIN public.organization_members member
      ON member.org_id = page.organization_id
    WHERE page.id = service_offerings.page_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Owners and workspace members can create service offerings"
ON public.service_offerings
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.pages page
    JOIN public.organization_members member
      ON member.org_id = page.organization_id
    WHERE page.id = service_offerings.page_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Owners and workspace members can update service offerings"
ON public.service_offerings
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.pages page
    JOIN public.organization_members member
      ON member.org_id = page.organization_id
    WHERE page.id = service_offerings.page_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.pages page
    JOIN public.organization_members member
      ON member.org_id = page.organization_id
    WHERE page.id = service_offerings.page_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Owners and workspace members can delete service offerings"
ON public.service_offerings
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.pages page
    JOIN public.organization_members member
      ON member.org_id = page.organization_id
    WHERE page.id = service_offerings.page_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin', 'editor')
  )
);

REVOKE ALL ON public.service_offerings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.service_offerings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_offerings TO authenticated;

COMMENT ON TABLE public.service_offerings IS
  'Normalized, owner-controlled source of truth for public bookable services.';
COMMENT ON FUNCTION public.is_valid_service_offering_configuration IS
  'Validates localized name and deposit invariants for a service offering.';
