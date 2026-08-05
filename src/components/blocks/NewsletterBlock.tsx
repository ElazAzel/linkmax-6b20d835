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
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('newsletter.subscribe', 'Подписаться');

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
      // Save newsletter subscription using typed client
      const { error: subscriptionError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: trimmedEmail,
          page_id: pageId,
          block_id: block.id,
          owner_id: pageOwnerId,
          status: 'active',
        });

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
          source: 'form',
          status: 'new',
          metadata: {
            block_id: block.id,
            page_id: pageId,
            subscribed_at: new Date().toISOString(),
            source_type: 'newsletter',
          },
        });

      // Lead creation failure is not critical, just log it
      if (leadError) {
        console.warn('Failed to create lead for newsletter subscription:', leadError);
      }

      // Send Telegram notification to page owner
      try {
        await supabase.functions.invoke('send-social-notification', {
          body: {
            type: 'newsletter_subscribed',
            recipientId: pageOwnerId,
            data: {
              subscriberEmail: trimmedEmail,
            },
          },
        });
      } catch (notifError) {
        console.warn('Newsletter notification failed:', notifError);
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
      <Card className="p-5 sm:p-6 bg-card/60  border-hairline shadow-soft rounded-[2rem] animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-3 text-center py-6">
          <div className="p-4 rounded-full bg-primary/20 text-primary shadow-inner">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-xl tracking-tight mt-2">{t('newsletter.thankYou', 'Спасибо!')}</h3>
          <p className="text-sm text-foreground/60 max-w-[200px]">
            {t('newsletter.subscriptionConfirmed', 'Ваша подписка успешно подтверждена.')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full p-6 sm:p-8 rounded-[2.2rem] qb-card border-hairline shadow-lift relative overflow-hidden group transition-all duration-500 hover:shadow-primary/5">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all duration-700" />

      <div className="relative z-10">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-primary/15 text-primary shadow-[0_0_20px_rgba(var(--primary),0.15)] group-hover:scale-110 transition-transform duration-300">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title || t('newsletter.title', 'Подпишитесь')}
          </h3>
        </div>

        {description && (
          <p className="text-[0.95rem] text-foreground/60 mb-7 leading-relaxed font-medium">
            {description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative group/input">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.emailPlaceholder', 'Ваш email')}
              required
              disabled={isSubmitting}
              className="h-14 rounded-2xl glass-input bg-white/5 border-hairline focus:border-primary/40 focus:bg-white/10 text-base font-semibold transition-all duration-300 placeholder:text-foreground/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="default"
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25",
              "hover:scale-[1.01] hover:shadow-primary/35 active:scale-[0.98] transition-all duration-300",
              "gap-2.5 relative overflow-hidden group/btn"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            )}
            {buttonText}
            
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </Button>
        </form>

        <p className="text-[10px] text-center text-foreground/30 mt-5 font-medium flex items-center justify-center gap-1">
          <Crown className="h-2.5 w-2.5 opacity-50" />
          {t('newsletter.verified', 'Безопасная подписка от LinkMAX')}
        </p>
      </div>
    </div>
  );
});
