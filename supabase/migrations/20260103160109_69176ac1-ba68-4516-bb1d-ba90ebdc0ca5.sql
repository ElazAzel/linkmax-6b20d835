-- Add verification fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'none', -- none, pending, approved, rejected
ADD COLUMN IF NOT EXISTS verification_type text DEFAULT null, -- individual, business
ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone DEFAULT null,
ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamp with time zone DEFAULT null;

-- Create verification_requests table for storing verification documents
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL, -- 'individual' or 'business'
  face_photo_url text, -- Photo of face with ID for individuals
  id_document_url text, -- ID document
  business_registration_url text, -- Business registration certificate for legal entities
  notes text, -- Optional notes from user
  admin_notes text, -- Notes from admin after review
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS on verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_requests
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification request"
  ON public.verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Users can upload own verification documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own verification documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents'
    AND has_role(auth.uid(), 'admin'::app_role)
  );