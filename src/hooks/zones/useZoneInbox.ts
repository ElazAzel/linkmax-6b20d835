/**
 * Hook: Manage inbox conversations and messages for a zone (React Query + Realtime)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  metadata: unknown;
  created_at: string;
}

// ─── Query Keys ───
export const zoneInboxKeys = {
  conversations: (zoneId: string) => ['zone-conversations', zoneId] as const,
  messages: (conversationId: string) => ['zone-messages', conversationId] as const,
};

// ─── Fetch ───
async function fetchConversations(zoneId: string): Promise<ZoneConversation[]> {
  const { data, error } = await supabase
    .from('zone_conversations')
    .select('*, zone_contacts(name, phone, telegram_username)')
    .eq('zone_id', zoneId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    contact: c.zone_contacts || undefined,
  })) as ZoneConversation[];
}

async function fetchMessages(conversationId: string): Promise<ZoneMessage[]> {
  const { data, error } = await supabase
    .from('zone_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ZoneMessage[];
}

// ─── Hook ───
export function useZoneInbox(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: zoneInboxKeys.conversations(safeZoneId),
    queryFn: () => fetchConversations(safeZoneId),
    enabled: !!zoneId,
    staleTime: 10_000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: zoneInboxKeys.messages(activeConversationId || ''),
    queryFn: () => fetchMessages(activeConversationId!),
    enabled: !!activeConversationId,
    staleTime: 5_000,
  });

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
        // Optimistically add message if in active conversation
        if (msg.conversation_id === activeConversationId) {
          queryClient.setQueryData<ZoneMessage[]>(
            zoneInboxKeys.messages(activeConversationId),
            (old) => [...(old || []), msg]
          );
        }
        // Refresh conversation list
        queryClient.invalidateQueries({ queryKey: zoneInboxKeys.conversations(safeZoneId) });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [zoneId, activeConversationId, queryClient, safeZoneId]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
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
        });
      if (error) throw error;
      // Update last_message_at
      await supabase
        .from('zone_conversations')
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    onSuccess: () => {
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: zoneInboxKeys.messages(activeConversationId) });
      }
      queryClient.invalidateQueries({ queryKey: zoneInboxKeys.conversations(safeZoneId) });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ title, contactId }: { title: string; contactId?: string }) => {
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
        })
        .select()
        .single();
      if (error) {
        if (error.code === '42501') {
          throw new Error('У вас нет доступа к этой зоне. Убедитесь, что вы являетесь активным участником.');
        }
        throw error;
      }
      return data as ZoneConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneInboxKeys.conversations(safeZoneId) });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneConversation> }) => {
      const { error } = await supabase
        .from('zone_conversations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneInboxKeys.conversations(safeZoneId) });
    },
  });

  // Backward-compatible API
  const sendMessage = async (conversationId: string, body: string) => sendMessageMutation.mutateAsync({ conversationId, body });
  const createConversation = async (title: string, contactId?: string) => createConversationMutation.mutateAsync({ title, contactId });
  const updateConversation = async (id: string, updates: Partial<ZoneConversation>) => updateConversationMutation.mutateAsync({ id, updates });
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
    refetch: () => queryClient.invalidateQueries({ queryKey: zoneInboxKeys.conversations(safeZoneId) }),
  };
}
