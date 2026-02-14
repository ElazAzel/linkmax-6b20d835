import { memo, useState } from 'react';
import { Crown, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FormBlock as FormBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';

interface FormBlockProps {
  block: FormBlockType;
  pageOwnerId?: string;
}

export const FormBlock = memo(function FormBlock({ block, pageOwnerId }: FormBlockProps) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const buttonText = getTranslatedString(block.buttonText, i18n.language as SupportedLanguage) || t('actions.send', 'Send');

  const getFieldKey = (field: FormBlockType['fields'][0], index: number): string => {
    if (typeof field.name === 'object' && field.name) {
      return getTranslatedString(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`;
    }
    return (field.name as string) || `Field ${index + 1}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = block.fields
      ?.filter((field, index) => field.required && !formData[getFieldKey(field, index)])
      .map((field, index) => getFieldKey(field, index));
    
    if (missingFields && missingFields.length > 0) {
      toast.error(t('form.fillRequired', 'Please fill required fields') + `: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create lead via edge function (bypasses RLS for anonymous visitors)
      if (pageOwnerId) {
        const name = formData['name'] || formData['Name'] || formData['Имя'] || formData['имя'] || 'Unknown';
        const email = formData['email'] || formData['Email'] || formData['Почта'] || formData['почта'] || null;
        const phone = formData['phone'] || formData['Phone'] || formData['Телефон'] || formData['телефон'] || null;
        
        const { error } = await supabase.functions.invoke('create-lead', {
          body: {
            pageOwnerId,
            name,
            email,
            phone,
            source: 'form',
            notes: title ? `Form: ${title}` : 'Form submission',
            metadata: formData,
          },
        });

        if (error) {
          console.error('Error creating lead:', error);
        }
      }

      toast.success(t('form.success', 'Form submitted successfully!'));
      setFormData({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('form.error', 'Error submitting form'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormBlockType['fields'][0], index: number) => {
    const fieldName = typeof field.name === 'object' && field.name 
      ? getTranslatedString(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`
      : (field.name as string) || `Field ${index + 1}`;
    
    const fieldPlaceholder = typeof field.placeholder === 'object' && field.placeholder
      ? getTranslatedString(field.placeholder, i18n.language as SupportedLanguage)
      : (field.placeholder as string);

    const commonProps = {
      id: `field-${index}`,
      name: fieldName,
      required: field.required,
      value: formData[fieldName] || '',
      onChange: (e: any) => setFormData({ ...formData, [fieldName]: e.target.value }),
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} placeholder={fieldPlaceholder || t('form.enterPlaceholder', 'Enter') + ` ${fieldName.toLowerCase()}`} />;
      case 'email':
        return <Input {...commonProps} type="email" placeholder={fieldPlaceholder || 'example@email.com'} />;
      case 'phone':
        return <Input {...commonProps} type="tel" placeholder={fieldPlaceholder || '+7 (___) ___-__-__'} />;
      default:
        return <Input {...commonProps} type="text" placeholder={fieldPlaceholder || t('form.enterPlaceholder', 'Enter') + ` ${fieldName.toLowerCase()}`} />;
    }
  };

  const getFieldDisplayName = (field: FormBlockType['fields'][0], index: number) => {
    if (typeof field.name === 'object' && field.name) {
      return getTranslatedString(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`;
    }
    return (field.name as string) || `Field ${index + 1}`;
  };

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm rounded-xl">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h3 className="font-semibold text-base sm:text-lg truncate">{title}</h3>
        <Crown className="h-4 w-4 text-primary flex-shrink-0" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {block.fields?.map((field, index) => (
          <div key={index}>
            <Label htmlFor={`field-${index}`} className="text-sm">
              {getFieldDisplayName(field, index)} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {renderField(field, index)}
          </div>
        ))}
        <Button 
          type="submit" 
          className="w-full h-12 sm:h-10 rounded-xl text-base sm:text-sm font-semibold" 
          disabled={isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? t('form.submitting', 'Submitting...') : buttonText}
        </Button>
      </form>
    </Card>
  );
});
