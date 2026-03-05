import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface WidgetTemplate {
    id: string;
    name: string;
    nameRu: string;
    description: string;
    descriptionRu: string;
    category: string;
    icon: string;
    html: string;
    css: string;
    javascript: string;
}

export function useWidgetTemplates() {
    return useQuery({
        queryKey: ['widget_templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('widget_templates')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            return (data || []).map(t => ({
                id: t.id,
                name: t.name,
                nameRu: t.name_ru || t.name,
                description: t.description || '',
                descriptionRu: t.description_ru || t.description || '',
                category: t.category,
                icon: t.icon || 'Code',
                html: t.html,
                css: t.css || '',
                javascript: t.javascript || ''
            })) as WidgetTemplate[];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
