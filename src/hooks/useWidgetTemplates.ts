import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { isMissingSchemaError } from '@/lib/resilience/missing-schema';
import type { Database } from '@/platform/supabase/types';

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

// widget_templates may not be deployed. After the first "table missing"
// answer we stop asking for the rest of the session; callers fall back to the
// bundled templates when the list is empty.
let widgetTemplatesMissing = false;

export function resetWidgetTemplatesSchemaState(): void {
    widgetTemplatesMissing = false;
}

export function useWidgetTemplates() {
    return useQuery({
        queryKey: ['widget_templates'],
        queryFn: async () => {
            if (widgetTemplatesMissing) return [] as WidgetTemplate[];
            const { data, error } = await (supabase
                .from('widget_templates' as any)
                .select('*')
                .order('id', { ascending: true }) as any);

            if (error) {
                if (isMissingSchemaError(error)) {
                    widgetTemplatesMissing = true;
                    return [] as WidgetTemplate[];
                }
                throw error;
            }

            return (data || []).map((t: any) => ({
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
        retry: false,
    });
}
