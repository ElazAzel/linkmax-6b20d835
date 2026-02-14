import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateCustomCodeBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function CustomCodeBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('warnings.customCodeSecurity', 'Warning: Only use trusted code. Malicious code can compromise your page security.')}
        </AlertDescription>
      </Alert>

      <MultilingualInput
        label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder="Custom Widget"
      />

      <div>
        <Label>{t('fields.htmlCode', 'HTML Code')}</Label>
        <Textarea
          value={formData.html || ''}
          onChange={(e) => onChange({ ...formData, html: e.target.value })}
          placeholder="<div>Your HTML code here...</div>"
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label>{t('fields.cssCode', 'CSS Code')} ({t('fields.optional', 'optional')})</Label>
        <Textarea
          value={formData.css || ''}
          onChange={(e) => onChange({ ...formData, css: e.target.value })}
          placeholder=".custom-class { color: red; }"
          rows={6}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

export const CustomCodeBlockEditor = withBlockEditor(CustomCodeBlockEditorComponent, {
  isPremium: true,
  description: 'Custom code blocks allow you to embed HTML and CSS for advanced customization',
  validate: validateCustomCodeBlock,
});
