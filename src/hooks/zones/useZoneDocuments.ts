import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { useZoneContext } from '@/contexts/ZoneContext';
import { toast } from 'sonner';
import { ZoneDocument, ZoneDocumentTemplate } from '@/types/zones';

/**
 * Hook for managing Zone Documents (EDO)
 */
export function useZoneDocuments(zoneId: string | null, dealId?: string, contactId?: string) {
    const { isReadOnly } = useZoneContext();
    const queryClient = useQueryClient();

    // 1. Fetch Documents
    const { data: documents, isLoading: isLoadingDocuments } = useQuery({
        queryKey: ['zone-documents', zoneId, dealId, contactId],
        queryFn: async () => {
            if (!zoneId) return [];

            let query = supabase
                .from('zone_documents' as any)
                .select(`
          *,
          template:zone_document_templates(*),
          contact:zone_contacts(id, name, company),
          deal:zone_deals(id, title, value_amount, currency)
        `)
                .eq('zone_id', zoneId)
                .order('created_at', { ascending: false });

            if (dealId) {
                query = query.eq('deal_id', dealId);
            }
            if (contactId) {
                query = query.eq('contact_id', contactId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching zone documents:', error);
                throw error;
            }
            return data as unknown as ZoneDocument[];
        },
        enabled: !!zoneId,
    });

    // 2. Fetch Templates
    const { data: templates, isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['zone-document-templates', zoneId],
        queryFn: async () => {
            if (!zoneId) return [];

            const { data, error } = await supabase
                .from('zone_document_templates' as any)
                .select('*')
                .eq('zone_id', zoneId)
                .eq('is_active', true)
                .order('name');

            if (error) {
                console.error('Error fetching document templates:', error);
                throw error;
            }
            return data as unknown as ZoneDocumentTemplate[];
        },
        enabled: !!zoneId,
    });

    // 3. Create Document Mutation
    const createDocumentMutation = useMutation({
        mutationFn: async (payload: Partial<ZoneDocument>) => {
            if (!zoneId) throw new Error('No active zone');
            if (isReadOnly) throw new Error('Zone is read-only');

            const { data, error } = await supabase
                .from('zone_documents' as any)
                .insert({
                    zone_id: zoneId,
                    title: payload.title || 'Новый документ',
                    deal_id: payload.deal_id,
                    contact_id: payload.contact_id,
                    template_id: payload.template_id,
                    status: payload.status || 'draft',
                    document_number: payload.document_number,
                })
                .select()
                .single();

            if (error) throw error;
            return data as unknown as ZoneDocument;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zone-documents', zoneId] });
            toast.success('Документ создан');
        },
        onError: (error) => {
            toast.error(`Ошибка создания документа: ${error.message}`);
        }
    });

    // 4. Update Document Status
    const updateDocumentStatusMutation = useMutation({
        mutationFn: async ({ id, status, fileUrl }: { id: string, status: ZoneDocument['status'], fileUrl?: string }) => {
            if (isReadOnly) throw new Error('Zone is read-only');

            const payload: any = { status };
            if (fileUrl) payload.file_url = fileUrl;

            const { data, error } = await supabase
                .from('zone_documents' as any)
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as unknown as ZoneDocument;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zone-documents', zoneId] });
            toast.success('Статус документа обновлен');
        },
        onError: (error: any) => {
            toast.error(`Ошибка обновления: ${error.message}`);
        }
    });

    // 5. Delete Document
    const deleteDocumentMutation = useMutation({
        mutationFn: async (id: string) => {
            if (isReadOnly) throw new Error('Zone is read-only');
            const { error } = await supabase.from('zone_documents' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zone-documents', zoneId] });
            toast.success('Документ удален');
        },
        onError: (error: any) => {
            toast.error(`Ошибка удаления: ${error.message}`);
        }
    });

    return {
        documents,
        templates,
        isLoading: isLoadingDocuments || isLoadingTemplates,
        createDocument: createDocumentMutation.mutateAsync,
        isCreating: createDocumentMutation.isPending,
        updateDocumentStatus: updateDocumentStatusMutation.mutateAsync,
        isUpdatingStatus: updateDocumentStatusMutation.isPending,
        deleteDocument: deleteDocumentMutation.mutateAsync,
        isDeleting: deleteDocumentMutation.isPending
    };
}
