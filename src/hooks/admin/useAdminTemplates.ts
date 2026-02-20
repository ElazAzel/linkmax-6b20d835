import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { TemplateCategoryKey } from '@/lib/templateCategories';

export interface AdminTemplateData {
    id: string;
    name: string;
    description?: string;
    niches: string[];
    is_premium: boolean;
    is_public: boolean;
    preview_image?: string;
    created_at: string;
    updated_at: string;
    sort_order: number;
}

async function fetchTemplates(): Promise<AdminTemplateData[]> {
    const { data, error } = await (supabase as any)
        .from('page_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdminTemplateData[];
}

export function useAdminTemplates() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['admin-templates'],
        queryFn: fetchTemplates,
        staleTime: 60000,
    });

    const deleteTemplate = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from('page_templates').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
        },
    });

    const updateTemplateStatus = useMutation({
        mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
            const { error } = await (supabase as any)
                .from('page_templates')
                .update({ is_public })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
        },
    });

    return {
        ...query,
        deleteTemplate,
        updateTemplateStatus,
    };
}
