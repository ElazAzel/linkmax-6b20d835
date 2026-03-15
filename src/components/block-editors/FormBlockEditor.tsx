import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateFormBlock } from '@/lib/blocks/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { emailSequencesService, type EmailSequence } from '@/services/emailSequences';
import { useEffect, useState } from 'react';

function FormBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const fields = formData.fields || [];

  useEffect(() => {
    const fetchSequences = async () => {
      const { data } = await emailSequencesService.listSequences();
      if (data) {
        setSequences(data.filter(s => s.status === 'active'));
      }
    };
    fetchSequences();
  }, []);

  const addField = () => {
    const newField = {
      name: { ru: '', en: '', kk: '' },
      placeholder: { ru: '', en: '', kk: '' },
      type: 'text' as const,
      required: false
    };
    onChange({
      ...formData,
      fields: [...fields, newField],
    });
  };

  const removeField = (index: number) => {
    onChange({
      ...formData,
      fields: fields.filter((_: unknown, i: number) => i !== index),
    });
  };

  const updateField = (index: number, field: string, value: unknown) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, fields: updated });
  };

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.formTitle', 'Form Title')}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder={t('fields.contactForm', 'Contact Form')}
      />

      <MultilingualInput
        label={t('fields.buttonText', 'Button Text')}
        value={migrateToMultilingual(formData.buttonText)}
        onChange={(value) => onChange({ ...formData, buttonText: value })}
        placeholder={t('fields.send', 'Send')}
      />

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('crm.triggerSequence', 'Trigger Email Sequence')}</Label>
        <Select
          value={formData.sequenceId || 'none'}
          onValueChange={(value) => onChange({ ...formData, sequenceId: value === 'none' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('crm.selectSequence', 'Select a sequence')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('common.none', 'None')}</SelectItem>
            {sequences.map((seq) => (
              <SelectItem key={seq.id} value={seq.id}>
                {seq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic">
          {t('crm.triggerSequenceHint', 'New leads will be automatically subscribed to this sequence if they provide an email.')}
        </p>
      </div>

      <ArrayFieldList label={t('fields.formFields', 'Form Fields')} items={fields} onAdd={addField}>
        {fields.map((field: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.field', 'Field')}
            onRemove={() => removeField(index)}
          >
            <MultilingualInput
              label={t('fields.fieldName', 'Field Name')}
              value={migrateToMultilingual(field.name)}
              onChange={(value) => updateField(index, 'name', value)}
              placeholder={t('fields.fieldNamePlaceholder', 'Name')}
            />

            <MultilingualInput
              label={`${t('fields.placeholder', 'Placeholder')} (${t('fields.optional', 'optional')})`}
              value={migrateToMultilingual(field.placeholder)}
              onChange={(value) => updateField(index, 'placeholder', value)}
              placeholder={t('fields.enterText', 'Enter text...')}
            />

            <div>
              <Label className="text-xs">{t('fields.fieldType', 'Field Type')}</Label>
              <Select
                value={field.type}
                onValueChange={(value: string) => updateField(index, 'type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('fields.text', 'Text')}</SelectItem>
                  <SelectItem value="email">{t('fields.email', 'Email')}</SelectItem>
                  <SelectItem value="phone">{t('fields.phone', 'Phone')}</SelectItem>
                  <SelectItem value="textarea">{t('fields.textarea', 'Textarea')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={field.required || false}
                onChange={(e) => updateField(index, 'required', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor={`required-${index}`} className="cursor-pointer text-xs">
                {t('fields.requiredField', 'Required field')}
              </Label>
            </div>
          </ArrayFieldItem>
        ))}
      </ArrayFieldList>
    </div>
  );
}

export const FormBlockEditor = withBlockEditor(FormBlockEditorComponent, {
  hint: 'Create a contact form with custom fields',
  validate: validateFormBlock,
  isPremium: true,
  description: 'Collect user information with customizable form fields',
});
