-- Drop the chatbot_context column from pages table
-- This data is now stored securely in private_page_data table
ALTER TABLE public.pages DROP COLUMN IF EXISTS chatbot_context;