import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Block } from '@/types/page';

interface VariantBlockEditorProps {
  block: Block;
  onChange: (updatedBlock: Block) => void;
}

/**
 * Simple field definitions per block type for variant editing
 */
const EDITABLE_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'url' | 'number' }>> = {
  link: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'url', label: 'URL', type: 'url' },
    { key: 'description', label: 'Description', type: 'text' },
  ],
  button: [
    { key: 'title', label: 'Button Text', type: 'text' },
    { key: 'url', label: 'URL', type: 'url' },
  ],
  text: [
    { key: 'text', label: 'Text', type: 'textarea' },
  ],
  profile: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
  ],
  image: [
    { key: 'url', label: 'Image URL', type: 'url' },
    { key: 'alt', label: 'Alt Text', type: 'text' },
    { key: 'caption', label: 'Caption', type: 'text' },
  ],
  video: [
    { key: 'url', label: 'Video URL', type: 'url' },
    { key: 'title', label: 'Title', type: 'text' },
  ],
  product: [
    { key: 'name', label: 'Product Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
    { key: 'url', label: 'URL', type: 'url' },
  ],
  download: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ],
  newsletter: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
  ],
  countdown: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ],
  faq: [
    { key: 'title', label: 'Section Title', type: 'text' },
  ],
  pricing: [
    { key: 'title', label: 'Title', type: 'text' },
  ],
  community: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
  ],
  booking: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ],
};

export function VariantBlockEditor({ block, onChange }: VariantBlockEditorProps) {
  const { t } = useTranslation();
  const fields = EDITABLE_FIELDS[block.type] || [
    { key: 'title', label: 'Title', type: 'text' as const },
  ];

  const handleFieldChange = useCallback((key: string, value: string | number) => {
    onChange({ ...block, [key]: value } as Block);
  }, [block, onChange]);

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {t('experiments.setup.editFields', 'Редактировать контент варианта')}
      </p>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          {field.type === 'textarea' ? (
            <Textarea
              value={(block as any)[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="min-h-[60px] text-sm rounded-xl"
              placeholder={`${field.label}...`}
            />
          ) : (
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={(block as any)[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              className="h-10 text-sm rounded-xl"
              placeholder={`${field.label}...`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
