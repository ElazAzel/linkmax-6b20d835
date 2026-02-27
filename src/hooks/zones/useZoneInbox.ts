/**
 * Hook: Manage inbox conversations and messages for a zone
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/platform/supabase/client';

export interface ZoneConversation {
  id: string;
  zone_id: string;
  contact_id: string | null;
  channel: string;
  external_chat_id: string | null;
  title: string | null;
  status: string;
  assigned_to: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: { name: string; phone?: string; telegram_username?: string };
  last_message?: string;
  unread_count?: number;
}

export interface ZoneMessage {
  id: string;
  conversation_id: string;
  zone_id: string;
  direction: string;
  sender_type: string;
  sender_id: string | null;
  body: string;
  metadata: any;
  created_at: string;
}

export function useZoneInbox(zoneId: string | null) {
  const [conversations, setConversations] = useState<ZoneConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ZoneMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_conversations')
        .select('*, zone_contacts(name, phone, telegram_username)')
        .eq('zone_id', zoneId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      const mapped = (data || []).map((c: any) => ({
        ...c,
        contact: c.zone_contacts || undefined,
      }));
      setConversations(mapped);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) { setMessages([]); return; }
    setMessagesLoading(true);
    try {
      const { data } = await supabase
        .from('zone_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });
      setMessages((data as ZoneMessage[]) || []);
    } finally {
      setMessagesLoading(false);
    }
  }, [activeConversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!zoneId) return;
    const channel = supabase
      .channel(`zone-messages-${zoneId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'zone_messages',
        filter: `zone_id=eq.${zoneId}`,
      }, (payload) => {
        const msg = payload.new as ZoneMessage;
        if (msg.conversation_id === activeConversationId) {
          setMessages(prev => [...prev, msg]);
        }
        // Update conversation list
        fetchConversations();
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [zoneId, activeConversationId, fetchConversations]);

  // Send message
  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    if (!zoneId) throw new Error('No zone');
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('zone_messages')
      .insert({
        conversation_id: conversationId,
        zone_id: zoneId,
        direction: 'outbound',
        sender_type: 'member',
        sender_id: userId || '',
        body,
      } as any);
    if (error) throw error;

    // Update last_message_at
    await supabase
      .from('zone_conversations')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq('id', conversationId);
  }, [zoneId]);

  // Create conversation
  const createConversation = useCallback(async (title: string, contactId?: string) => {
    if (!zoneId) throw new Error('No zone');
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('zone_conversations')
      .insert({
        zone_id: zoneId,
        title,
        contact_id: contactId || null,
        assigned_to: userId,
        channel: 'internal',
      } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchConversations();
    return data;
  }, [zoneId, fetchConversations]);

  // Update conversation status
  const updateConversation = useCallback(async (id: string, updates: Partial<ZoneConversation>) => {
    const { error } = await supabase
      .from('zone_conversations')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetchConversations();
  }, [fetchConversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    messages,
    loading,
    messagesLoading,
    sendMessage,
    createConversation,
    updateConversation,
    refetch: fetchConversations,
  };
}
