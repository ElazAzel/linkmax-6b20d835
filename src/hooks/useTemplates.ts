import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { Block } from '@/types/page';
import type { TemplateCategoryKey } from '@/lib/templateCategories';

export interface Template {
    id: string;
    name: string;
    description: string;
    category: TemplateCategoryKey;
    preview: string;
    isPremium?: boolean;
    blocks: Array<{ type: string; overrides?: Record<string, unknown> }>;
}

export function useTemplates() {
    return useQuery({
        queryKey: ['templates', 'public'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_public', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            return (data || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category as TemplateCategoryKey,
                preview: t.preview_image || '📄', // Default icon if no image
                isPremium: t.is_premium,
                blocks: t.blocks as Array<{ type: string; overrides?: Record<string, unknown> }>,
            })) as Template[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
