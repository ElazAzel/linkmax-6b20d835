import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Crown, CheckCircle } from 'lucide-react';
import type { NewsletterBlock as NewsletterBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
  pageOwnerId?: string;
  pageId?: string;
}

export const NewsletterBlock = memo(function NewsletterBlock({ block, pageOwnerId, pageId }: NewsletterBlockProps) {
  const { i18n, t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const description = getI18nText(block.description, i18n.language as SupportedLanguage);
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('actions.subscribe', 'Subscribe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      toast.error(t('errors.invalidEmail', 'Enter a valid email'));
      return;
    }

    if (!pageOwnerId || !pageId) {
      toast.error(t('errors.subscription', 'Subscription error'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save newsletter subscription using raw insert (types not yet generated)
      const { error: subscriptionError } = await supabase
        .from('newsletter_subscriptions' as any)
        .insert({
          email: trimmedEmail,
          page_id: pageId,
          block_id: block.id,
          owner_id: pageOwnerId,
          status: 'active',
        } as any);

      if (subscriptionError) {
        // Check if already subscribed (unique constraint violation)
        if (subscriptionError.code === '23505') {
          toast.info(t('newsletter.alreadySubscribed', 'You are already subscribed!'));
          setIsSubscribed(true);
          setEmail('');
          return;
        }
        throw subscriptionError;
      }

      // Also create a lead for CRM integration
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          name: trimmedEmail.split('@')[0], // Use email prefix as name
          email: trimmedEmail,
          user_id: pageOwnerId,
          source: 'form', // Using 'form' as newsletter source
          status: 'new',
          metadata: {
            block_id: block.id,
            page_id: pageId,
            subscribed_at: new Date().toISOString(),
            source_type: 'newsletter',
          },
        } as any);

      // Lead creation failure is not critical, just log it
      if (leadError) {
        console.warn('Failed to create lead for newsletter subscription:', leadError);
      }

      toast.success(t('success.subscribed', 'Successfully subscribed!'));
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(t('errors.subscription', 'Subscription error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm rounded-xl">
        <div className="flex flex-col items-center gap-3 text-center py-4">
          <CheckCircle className="h-10 w-10 text-primary" />
          <h3 className="font-semibold text-lg">{t('newsletter.thankYou', 'Thank you!')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('newsletter.subscriptionConfirmed', 'Your subscription has been confirmed.')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm rounded-xl">
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
