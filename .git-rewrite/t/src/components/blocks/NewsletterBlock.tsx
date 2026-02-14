import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Crown } from 'lucide-react';
import type { NewsletterBlock as NewsletterBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

export const NewsletterBlock = memo(function NewsletterBlock({ block }: NewsletterBlockProps) {
  const { i18n, t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const description = getTranslatedString(block.description, i18n.language as SupportedLanguage);
  const buttonText = getTranslatedString(block.buttonText, i18n.language as SupportedLanguage) || t('actions.subscribe', 'Subscribe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error(t('errors.invalidEmail', 'Enter a valid email'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('success.subscribed', 'Successfully subscribed!'));
      setEmail('');
    } catch (error) {
      toast.error(t('errors.subscription', 'Subscription error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <Crown className="h-4 w-4 text-primary ml-auto" />
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('actions.sending', 'Sending...') : buttonText}
        </Button>
      </form>
    </Card>
  );
});
