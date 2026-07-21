
-- Harden document_signatures INSERT policy: signer forgery prevention.
-- Previously anyone authenticated could insert a row with user_id=auth.uid()
-- against any document_id. Restrict inserts to the document owner (who
-- creates signer invitations) OR to a caller who is a zone member of the
-- document's zone AND is inserting their own row against a document that
-- lists them (created_by-only path). Simplest safe rule: only the document
-- owner (created_by on zone_documents) can insert signature invitations.
DROP POLICY IF EXISTS "Signers insert own signature" ON public.document_signatures;
CREATE POLICY "Document owner inserts signature invitations"
ON public.document_signatures
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.zone_documents zd
    WHERE zd.id = document_signatures.document_id
      AND zd.created_by = auth.uid()
  )
);

-- Templates: drop redundant permissive policies that grant SELECT to all
-- authenticated users regardless of is_public, bypassing the intended
-- is_public=true restriction. Keep the two is_public=true SELECT policies
-- plus admin management.
DROP POLICY IF EXISTS "Auth View" ON public.templates;
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON public.templates;
DROP POLICY IF EXISTS "Anyone can view public templates" ON public.templates;
