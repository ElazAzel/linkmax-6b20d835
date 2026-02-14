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
import { supabase } from '@/integrations/supabase/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = block.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.name);
    
    if (missingFields.length > 0) {
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

  const renderField = (field: FormBlockType['fields'][0]) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      value: formData[field.name] || '',
      onChange: (e: any) => setFormData({ ...formData, [field.name]: e.target.value }),
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} placeholder={t('form.enterPlaceholder', 'Enter') + ` ${field.name.toLowerCase()}`} />;
      case 'email':
        return <Input {...commonProps} type="email" placeholder="example@email.com" />;
      case 'phone':
        return <Input {...commonProps} type="tel" placeholder="+7 (___) ___-__-__" />;
      default:
        return <Input {...commonProps} type="text" placeholder={t('form.enterPlaceholder', 'Enter') + ` ${field.name.toLowerCase()}`} />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Crown className="h-4 w-4 text-primary" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {block.fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.name} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? t('form.submitting', 'Submitting...') : buttonText}
        </Button>
      </form>
    </Card>
  );
});
