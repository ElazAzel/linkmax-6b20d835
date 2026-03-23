import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { Database } from '@/platform/supabase/types';
import type { TemplateCategoryKey } from '@/lib/templateCategories';
import type { Template } from '@/types/templates';

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

            if (error) throw error;

            const templates = (data || []) as unknown as Database['public']['Tables']['templates']['Row'][];

            return templates.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description || '',
                category: t.category as TemplateCategoryKey,
                preview: t.preview_image || '📄', // Default icon if no image
                isPremium: t.is_premium || false,
                blocks: (t.blocks as unknown as Array<{ type: string; overrides?: Record<string, unknown> }>) || [],
            })) as Template[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
