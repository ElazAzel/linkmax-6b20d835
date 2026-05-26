/**
 * PaywallModal — Sprint 2 (Conversion).
 * Shown when a Starter user hits the multi-page limit (or any Pro gate).
 * Emits posthog events: paywall_shown, paywall_cta_click, paywall_dismissed.
 */
import { memo, useEffect, useState } from 'react';
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
import { startProTrial } from '@/services/user';
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
  const { inTrial, trialEndsAt, refresh } = usePremiumStatus();
  const [trialLoading, setTrialLoading] = useState(false);
  const trialEligible = !inTrial && !trialEndsAt;

  useEffect(() => {
    if (open) {
      safeCapture('paywall_shown', { source, trial_eligible: trialEligible });
    }
  }, [open, source, trialEligible]);

  const handleUpgrade = () => {
    safeCapture('paywall_cta_click', { source, target: 'pricing' });
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleStartTrial = async () => {
    setTrialLoading(true);
    safeCapture('paywall_cta_click', { source, target: 'trial' });
    const res = await startProTrial();
    setTrialLoading(false);
    if (res.ok) {
      safeCapture('trial_started', { source });
      await refresh();
      toast.success(t('paywall.trialStarted', 'Pro-триал на 7 дней активирован'));
      onOpenChange(false);
    } else if (res.error === 'trial_already_used') {
      toast.error(t('paywall.trialUsed', 'Пробный период уже использован'));
    } else if (res.error === 'already_premium') {
      toast.info(t('paywall.alreadyPro', 'У вас уже активен Pro'));
      await refresh();
      onOpenChange(false);
    } else {
      toast.error(t('paywall.trialError', 'Не удалось активировать триал'));
    }
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
            {t('paywall.trialHint', 'Попробуйте 7 дней Pro бесплатно — без привязки карты.')}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={() => handleDismiss(false)}>
            {t('common.later', 'Позже')}
          </Button>
          {trialEligible && (
            <Button
              variant="outline"
              onClick={handleStartTrial}
              disabled={trialLoading}
              className="rounded-xl"
            >
              {trialLoading
                ? t('common.loading', 'Загрузка…')
                : t('paywall.startTrial', 'Попробовать 7 дней')}
            </Button>
          )}
          <Button onClick={handleUpgrade} className="rounded-xl">
            {t('paywall.cta', 'Перейти на Pro')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
