-- Create zone_deal_comments table for comments on deals
CREATE TABLE IF NOT EXISTS public.zone_deal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.zone_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_zone_deal_comments_deal_id ON public.zone_deal_comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_zone_deal_comments_zone_id ON public.zone_deal_comments(zone_id);

-- Enable RLS
ALTER TABLE public.zone_deal_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies: zone members can view/manage comments
CREATE POLICY "Zone members can view deal comments"
  ON public.zone_deal_comments FOR SELECT
  TO authenticated
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can create deal comments"
  ON public.zone_deal_comments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Users can update own comments"
  ON public.zone_deal_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments or admins"
  ON public.zone_deal_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_zone_admin(zone_id, auth.uid()));