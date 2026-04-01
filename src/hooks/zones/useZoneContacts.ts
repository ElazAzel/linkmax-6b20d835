/**
 * Hook: Manage contacts for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import type { ZoneContact, ZoneContactNote, ContactNoteType } from '@/types/zones';
import type { Json } from '@/platform/supabase/types';

// ─── Query Keys ───
export const zoneContactsKeys = {
  all: (zoneId: string) => ['zone-contacts', zoneId] as const,
  detail: (zoneId: string, contactId: string) => ['zone-contacts', zoneId, contactId] as const,
  notes: (zoneId: string, contactId: string) => ['zone-contact-notes', zoneId, contactId] as const,
};

// ─── Fetch functions ───
async function fetchContacts(zoneId: string): Promise<ZoneContact[]> {
  const { data, error } = await supabase
    .from('zone_contacts')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneContact[];
}

async function fetchContactNotes(zoneId: string, contactId: string): Promise<ZoneContactNote[]> {
  const { data, error } = await supabase
    .from('zone_contact_notes')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneContactNote[];
}

// ─── Hooks ───
export function useZoneContacts(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey: zoneContactsKeys.all(safeZoneId),
    queryFn: () => fetchContacts(safeZoneId),
    enabled: !!zoneId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (contact: Partial<ZoneContact>) => {
      if (!zoneId) throw new Error('No zone selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!contact.name) throw new Error('Contact name is required');
      
      const { data, error } = await supabase
        .from('zone_contacts')
        .insert({ 
          name: contact.name,
          zone_id: zoneId, 
          owner_user_id: userId || null,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          position: contact.position || null,
          address: contact.address || null,
          source: contact.source || null,
          notes: contact.notes || null,
          telegram_user_id: contact.telegram_user_id || null,
          telegram_username: contact.telegram_username || null,
          tags: contact.tags || [],
          custom_fields: contact.custom_fields as Json || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Fire automations (non-blocking)
      supabase.functions.invoke('run-zone-automations', {
        body: { zone_id: zoneId, trigger_type: 'new_contact', contact_id: data.id },
      }).catch(() => { });
      
      return data as unknown as ZoneContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.all(safeZoneId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneContact> }) => {
      const { error } = await supabase
        .from('zone_contacts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.all(safeZoneId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('zone_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.all(safeZoneId) });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (contactsList: Partial<ZoneContact>[]) => {
      if (!zoneId) throw new Error('No zone selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const rows = contactsList.map(c => ({
        ...c,
        zone_id: zoneId,
        owner_user_id: userId,
      }));
      const { error } = await (supabase as any)
        .from('zone_contacts')
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.all(safeZoneId) });
    },
  });

  // Backward-compatible API
  const createContact = async (contact: Partial<ZoneContact>) => createMutation.mutateAsync(contact);
  const updateContact = async (id: string, updates: Partial<ZoneContact>) => updateMutation.mutateAsync({ id, updates });
  const deleteContact = async (id: string) => deleteMutation.mutateAsync(id);
  const bulkImport = async (contactsList: Partial<ZoneContact>[]) => bulkImportMutation.mutateAsync(contactsList);

  return { contacts, loading, createContact, updateContact, deleteContact, bulkImport };
}

// ─── Contact Notes Hook ───
export function useZoneContactNotes(zoneId: string | null, contactId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const safeContactId = contactId || '';

  const { data: notes = [], isLoading: loading } = useQuery({
    queryKey: zoneContactsKeys.notes(safeZoneId, safeContactId),
    queryFn: () => fetchContactNotes(safeZoneId, safeContactId),
    enabled: !!zoneId && !!contactId,
    staleTime: 15_000,
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ type, content }: { type: ContactNoteType; content: string }) => {
      if (!zoneId || !contactId) throw new Error('No zone/contact');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('zone_contact_notes')
        .insert({
          zone_id: zoneId,
          contact_id: contactId,
          type,
          content,
          created_by: userId || '',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ZoneContactNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.notes(safeZoneId, safeContactId) });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('zone_contact_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneContactsKeys.notes(safeZoneId, safeContactId) });
    },
  });

  const addNote = async (type: ContactNoteType, content: string) => addNoteMutation.mutateAsync({ type, content });
  const deleteNote = async (noteId: string) => deleteNoteMutation.mutateAsync(noteId);

  return { notes, loading, addNote, deleteNote };
}
