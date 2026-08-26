CREATE POLICY "Owners upload their digital goods"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'digital-goods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners read their digital goods"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'digital-goods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners update their digital goods"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'digital-goods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete their digital goods"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'digital-goods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE TABLE public.digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KZT',
  download_limit integer NOT NULL DEFAULT 5,
  access_ttl_hours integer NOT NULL DEFAULT 720,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their digital products"
ON public.digital_products FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_digital_products_user ON public.digital_products(user_id);
CREATE INDEX idx_digital_products_page ON public.digital_products(page_id);

CREATE TABLE public.digital_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KZT',
  status text NOT NULL DEFAULT 'pending',
  provider text,
  provider_ref text,
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  downloads_used integer NOT NULL DEFAULT 0,
  download_limit integer NOT NULL DEFAULT 5,
  expires_at timestamptz,
  paid_at timestamptz,
  last_download_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.digital_purchases TO authenticated;
GRANT ALL ON public.digital_purchases TO service_role;

ALTER TABLE public.digital_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view their sales"
ON public.digital_purchases FOR SELECT TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Buyers view their purchases"
ON public.digital_purchases FOR SELECT TO authenticated
USING (buyer_user_id = auth.uid());

CREATE UNIQUE INDEX idx_digital_purchases_token ON public.digital_purchases(access_token);
CREATE INDEX idx_digital_purchases_seller ON public.digital_purchases(seller_id);
CREATE INDEX idx_digital_purchases_product ON public.digital_purchases(product_id);
CREATE INDEX idx_digital_purchases_ref ON public.digital_purchases(provider_ref);

CREATE OR REPLACE FUNCTION public.get_digital_product_public(_product_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  file_name text,
  file_size bigint,
  price numeric,
  currency text,
  download_limit integer,
  access_ttl_hours integer,
  seller_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.title, p.description, p.file_name, p.file_size,
         p.price, p.currency, p.download_limit, p.access_ttl_hours, p.user_id
  FROM public.digital_products p
  WHERE p.id = _product_id AND p.is_active = true
$$;

GRANT EXECUTE ON FUNCTION public.get_digital_product_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_digital_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW EXECUTE FUNCTION public.tg_digital_touch_updated_at();

CREATE TRIGGER trg_digital_purchases_updated_at
BEFORE UPDATE ON public.digital_purchases
FOR EACH ROW EXECUTE FUNCTION public.tg_digital_touch_updated_at();