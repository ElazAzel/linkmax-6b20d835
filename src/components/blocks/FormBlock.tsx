import { memo, useState } from 'react';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Send from 'lucide-react/dist/esm/icons/send';
import { useTranslation } from 'react-i18next';
import type { FormBlock as FormBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';
import { fintechService } from '@/services/fintech';
import { TurnstileWidget } from '@/components/legal/TurnstileWidget';

import { trackLead } from '@/lib/analytics';

interface FormBlockProps {
  block: FormBlockType;
  pageOwnerId?: string;
  pageId?: string;
}

export const FormBlock = memo(function FormBlock({ block, pageOwnerId, pageId }: FormBlockProps) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('actions.send', 'Send');

  const getFieldKey = (field: FormBlockType['fields'][0], index: number): string => {
    if (typeof field.name === 'object' && field.name) {
      return getI18nText(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`;
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

        // Capture UTM parameters and Referrer
        const urlParams = new URLSearchParams(window.location.search);
        const utmMetadata = {
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign'),
          utm_term: urlParams.get('utm_term'),
          utm_content: urlParams.get('utm_content'),
          referrer: document.referrer || 'direct',
        };

        const { data: fnResponse, error } = await supabase.functions.invoke('submit-lead', {
          body: {
            pageId,
            blockId: block.id,
            formData: formData,
            metadata: utmMetadata,
          },
        });

        if (error) {
          console.error('Error creating lead:', error);
        } else if (fnResponse && !fnResponse.success && fnResponse.error === 'inbound_limit_reached') {
          toast.error(t('form.limitReached.customer', 'Форма временно недоступна.'));
          setIsSubmitting(false);
          return;
        } else {
          // Track lead event on success
          trackLead();

          // Record in Fintech Ledger if it's a lead form with potential value
          try {
            await fintechService.recordPendingIncome({
              userId: pageOwnerId,
              amount: 0, // Forms usually don't have fixed price in Phase 1
              description: `Лид из формы: ${name}`,
              relatedEntityId: block.id,
              relatedEntityType: 'lead',
              metadata: {
                form_data: formData
              }
            });
          } catch (fintechErr) {
            console.error('Failed to record fintech transaction for lead', fintechErr);
          }
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
      ? getI18nText(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`
      : (field.name as string) || `Field ${index + 1}`;

    const fieldPlaceholder = typeof field.placeholder === 'object' && field.placeholder
      ? getI18nText(field.placeholder, i18n.language as SupportedLanguage)
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
      return getI18nText(field.name, i18n.language as SupportedLanguage) || `Field ${index + 1}`;
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
        <TurnstileWidget onToken={setTurnstileToken} className="mt-2" />
      </form>
    </Card>
  );
});
