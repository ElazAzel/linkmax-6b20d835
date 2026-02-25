import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Crown from 'lucide-react/dist/esm/icons/crown';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import type { NewsletterBlock as NewsletterBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
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
    <div className="w-full p-6 sm:p-8 rounded-[2rem] glass-card backdrop-blur-xl border-white/10 shadow-glass-xl relative overflow-hidden group">
      {/* Background glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors duration-500" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm shadow-primary/20">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-gradient">
            {title || t('newsletter.title', 'Подпишитесь')}
          </h3>
        </div>

        {description && (
          <p className="text-sm text-foreground/70 mb-6 leading-relaxed font-medium">
            {description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative group/input">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.emailPlaceholder', 'Ваш email')}
              required
              disabled={status === 'loading'}
              className="h-14 rounded-2xl glass-input border-white/5 focus:border-primary/50 text-base font-medium transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            {status === 'loading' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {buttonText || t('newsletter.subscribe', 'Подписаться')}
          </Button>
        </form>

        {status === 'success' && (
          <p className="text-xs font-bold text-center text-emerald-400 mt-4 animate-in fade-in slide-in-from-top-2">
            {t('newsletter.success', 'Спасибо за подписку!')}
          </p>
        )}

        {status === 'error' && (
          <p className="text-xs font-bold text-center text-red-400 mt-4 animate-in fade-in slide-in-from-top-2">
            {t('newsletter.error', 'Ошибка. Попробуйте снова.')}
          </p>
        )}
      </div>
    </div>
  );
});
