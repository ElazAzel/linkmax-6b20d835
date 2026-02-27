import { type TemplateCategoryKey } from '@/lib/templateCategories';

export interface TemplateBlockDefinition {
    type: string;
    overrides?: Record<string, unknown>;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: TemplateCategoryKey;
    preview: string;
    isPremium?: boolean;
    blocks: TemplateBlockDefinition[];
}
