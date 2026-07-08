/**
 * PaywallModal — Sprint 2 (Conversion).
 * Shown when a Starter user hits the multi-page limit (or any Pro gate).
 * Emits posthog events: paywall_shown, paywall_cta_click, paywall_dismissed.
 */
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Where the paywall was triggered from (e.g. "subpage-limit"). */
  source: string;
  /** Optional headline override. */
  headline?: string;
  /** Optional sub-headline override. */
  description?: string;
}

const safeCapture = (event: string, props: Record<string, unknown>) => {
  try {
    posthog.capture(event, props);
  } catch {
    /* no-op when posthog isn't initialised */
  }
};

export const PaywallModal = memo(function PaywallModal({
  open,
  onOpenChange,
  source,
  headline,
  description,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { inTrial } = usePremiumStatus();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const trialEligible = !inTrial;
  const checkoutPromoCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('promo') ?? params.get('coupon');
  }, []);

  useEffect(() => {
    if (open) {
      safeCapture('paywall_shown', { source, trial_eligible: trialEligible });
    }
  }, [open, source, trialEligible]);

  const handleStartTrial = async () => {
    safeCapture('paywall_cta_click', { source, target: 'trial', promo_code_present: Boolean(checkoutPromoCode) });
    await openCheckout({ priceId: 'pro_monthly', discountCode: checkoutPromoCode });
  };

  const handleUpgrade = () => {
    safeCapture('paywall_cta_click', { source, target: 'pricing' });
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleDismiss = (v: boolean) => {
    if (!v) safeCapture('paywall_dismissed', { source });
    onOpenChange(v);
  };

  const features: string[] = [
    t('paywall.features.unlimitedPages', 'Безлимит страниц на сайте'),
    t('paywall.features.removeBranding', 'Скрыть бренд LinkMAX'),
    t('paywall.features.lowerFee', 'Комиссия 1% вместо 7%'),
    t('paywall.features.advancedCrm', 'CRM, экспорт и аналитика'),
    t('paywall.features.priorityHelp', 'Приоритетная поддержка'),
  ];

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            LinkMAX Pro
          </div>
          <DialogTitle className="text-xl">
            {headline ?? t('paywall.headline', 'Откройте полноценный сайт')}
          </DialogTitle>
          <DialogDescription>
            {description ??
              t(
                'paywall.description',
                'Создавайте неограниченное число страниц, убирайте брендинг и снижайте комиссию.',
              )}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {trialEligible && (
          <p className="text-xs text-muted-foreground -mt-1">
            {t('paywall.trialHint', '7 дней бесплатно, отмена в любой момент. Затем $13/мес.')}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={() => handleDismiss(false)}>
            {t('common.later', 'Позже')}
          </Button>
          <Button variant="outline" onClick={handleUpgrade} className="rounded-xl">
            {t('paywall.compareCta', 'Сравнить тарифы')}
          </Button>
          <Button onClick={handleStartTrial} disabled={checkoutLoading} className="rounded-xl">
            {checkoutLoading
              ? t('common.loading', 'Загрузка…')
              : trialEligible
                ? t('paywall.startTrial', 'Начать 7 дней бесплатно')
                : t('paywall.cta', 'Перейти на Pro')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
