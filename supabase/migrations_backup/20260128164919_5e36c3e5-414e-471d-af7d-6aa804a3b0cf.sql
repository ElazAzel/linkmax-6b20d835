-- Create newsletter_subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for email per page
CREATE UNIQUE INDEX idx_newsletter_subscriptions_email_page 
ON public.newsletter_subscriptions(email, page_id) 
WHERE status = 'active';

-- Create index for owner lookups
CREATE INDEX idx_newsletter_subscriptions_owner ON public.newsletter_subscriptions(owner_id);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

-- Policy: Owners can view their subscriptions
CREATE POLICY "Owners can view their newsletter subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (auth.uid() = owner_id);

-- Policy: Owners can update subscriptions (e.g., unsubscribe)
CREATE POLICY "Owners can update their newsletter subscriptions"
ON public.newsletter_subscriptions
FOR UPDATE
USING (auth.uid() = owner_id);