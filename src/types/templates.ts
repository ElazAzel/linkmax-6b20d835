import { type TemplateCategoryKey } from '@/lib/templateCategories';
import type { SmartPageTheme } from '@/lib/onboarding/smart-design';

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
    theme?: SmartPageTheme;
}
