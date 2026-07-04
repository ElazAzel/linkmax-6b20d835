-- Offers: remove public read of active offers, keep owner-only ALL policy.
DROP POLICY IF EXISTS "Public read active offers" ON public.offers;
REVOKE SELECT ON public.offers FROM anon;

-- Document signatures: block anon writes, allow signer to insert their own row.
REVOKE INSERT, UPDATE, DELETE ON public.document_signatures FROM anon;

DROP POLICY IF EXISTS "Signers insert own signature" ON public.document_signatures;
CREATE POLICY "Signers insert own signature"
ON public.document_signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Signers update own signature" ON public.document_signatures;
CREATE POLICY "Signers update own signature"
ON public.document_signatures FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);