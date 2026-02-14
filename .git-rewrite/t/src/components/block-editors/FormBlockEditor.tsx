import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateFormBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function FormBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const fields = formData.fields || [];

  const addField = () => {
    onChange({
      ...formData,
      fields: [...fields, { name: '', type: 'text', required: false }],
    });
  };

  const removeField = (index: number) => {
    onChange({
      ...formData,
      fields: fields.filter((_: any, i: number) => i !== index),
    });
  };

  const updateField = (index: number, field: string, value: any) => {
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
        placeholder="Contact Form"
      />

      <MultilingualInput
        label={t('fields.buttonText', 'Button Text')}
        value={migrateToMultilingual(formData.buttonText)}
        onChange={(value) => onChange({ ...formData, buttonText: value })}
        placeholder="Send"
      />

      <ArrayFieldList label={t('fields.formFields', 'Form Fields')} items={fields} onAdd={addField}>
        {fields.map((field: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.field', 'Field')}
            onRemove={() => removeField(index)}
          >
            <div>
              <Label className="text-xs">{t('fields.fieldName', 'Field Name')}</Label>
              <Input
                value={field.name}
                onChange={(e) => updateField(index, 'name', e.target.value)}
                placeholder="Name"
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.fieldType', 'Field Type')}</Label>
              <Select
                value={field.type}
                onValueChange={(value) => updateField(index, 'type', value)}
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
