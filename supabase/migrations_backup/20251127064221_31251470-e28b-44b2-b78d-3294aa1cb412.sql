-- Add hidden info field for chatbot context
ALTER TABLE public.pages 
ADD COLUMN chatbot_context TEXT;

COMMENT ON COLUMN public.pages.chatbot_context IS 'Hidden information for AI chatbot to use when answering visitor questions';
