-- Fix security issue: Move chatbot_context to be accessible only to page owner
-- Create a separate table for private page data

-- Create private_page_data table for sensitive information
CREATE TABLE public.private_page_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL UNIQUE REFERENCES public.pages(id) ON DELETE CASCADE,
  chatbot_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_page_data ENABLE ROW LEVEL SECURITY;

-- Only page owners can view their private data
CREATE POLICY "Page owners can view own private data"
ON public.private_page_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = private_page_data.page_id 
    AND pages.user_id = auth.uid()
  )
);

-- Only page owners can insert their private data
CREATE POLICY "Page owners can insert own private data"
ON public.private_page_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = private_page_data.page_id 
    AND pages.user_id = auth.uid()
  )
);

-- Only page owners can update their private data
CREATE POLICY "Page owners can update own private data"
ON public.private_page_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = private_page_data.page_id 
    AND pages.user_id = auth.uid()
  )
);

-- Only page owners can delete their private data
CREATE POLICY "Page owners can delete own private data"
ON public.private_page_data
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = private_page_data.page_id 
    AND pages.user_id = auth.uid()
  )
);

-- Migrate existing chatbot_context data to new table
INSERT INTO public.private_page_data (page_id, chatbot_context)
SELECT id, chatbot_context FROM public.pages WHERE chatbot_context IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_private_page_data_updated_at
BEFORE UPDATE ON public.private_page_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();