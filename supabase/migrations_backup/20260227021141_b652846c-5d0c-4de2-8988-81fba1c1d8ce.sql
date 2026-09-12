
-- ============ Zone Conversations ============
CREATE TABLE public.zone_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'telegram',
  external_chat_id TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_conversations_zone ON public.zone_conversations(zone_id);
CREATE INDEX idx_zone_conversations_contact ON public.zone_conversations(contact_id);
CREATE INDEX idx_zone_conversations_external ON public.zone_conversations(external_chat_id);

ALTER TABLE public.zone_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view conversations"
  ON public.zone_conversations FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can insert conversations"
  ON public.zone_conversations FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can update conversations"
  ON public.zone_conversations FOR UPDATE
  USING (public.is_zone_member(zone_id, auth.uid()));

-- ============ Zone Messages ============
CREATE TABLE public.zone_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.zone_conversations(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  sender_type TEXT NOT NULL DEFAULT 'contact',
  sender_id TEXT,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_messages_conv ON public.zone_messages(conversation_id, created_at);
CREATE INDEX idx_zone_messages_zone ON public.zone_messages(zone_id);

ALTER TABLE public.zone_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view messages"
  ON public.zone_messages FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can insert messages"
  ON public.zone_messages FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_conversations;
