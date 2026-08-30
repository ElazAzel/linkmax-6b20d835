import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { parseMoney } from '@/domain/revenue/money';
import { validateServiceOffering } from '@/domain/revenue/service-offering';
import {
  REVENUE_KIT_STEPS,
  type BeautyNiche,
  type RevenueKitDraft,
  type RevenueKitStep,
} from '@/domain/revenue-kits/beauty-v1';
import { useRevenueKit } from '@/hooks/revenue/useRevenueKit';
import type { RevenueKitApplyResult } from '@/services/revenue-kit';
import { AvailabilityStep } from './AvailabilityStep';
import { DepositPolicyStep } from './DepositPolicyStep';
import { IdentityStep } from './IdentityStep';
import { PublishDistributeStep } from './PublishDistributeStep';
import { ServicesStep } from './ServicesStep';
import { TrustPreviewStep } from './TrustPreviewStep';

interface RevenueKitWizardProps {
  pageId: string;
  initialNiche?: BeautyNiche;
  onPublished?: (result: RevenueKitApplyResult) => void;
  onOpenAdvancedEditor?: () => void;
}

type ValidationErrorCode =
  | 'identityRequired'
  | 'activeServiceRequired'
  | 'serviceInvalid'
  | 'workingDayRequired'
  | 'hoursInvalid'
  | 'depositTooHigh'
  | 'percentInvalid'
  | 'depositInvalid'
  | 'paymentInstructionsRequired'
  | 'policyRequired';

const validationFallbacks: Record<ValidationErrorCode, string> = {
  identityRequired: 'Заполните название, город и контакт',
  activeServiceRequired: 'Оставьте хотя бы одну активную услугу',
  serviceInvalid: 'Проверьте цену и длительность услуг',
  workingDayRequired: 'Выберите хотя бы один рабочий день',
  hoursInvalid: 'Время окончания должно быть позже начала',
  depositTooHigh: 'Предоплата не может быть выше цены услуги',
  percentInvalid: 'Процент предоплаты должен быть от 1 до 100',
  depositInvalid: 'Проверьте размер предоплаты',
  paymentInstructionsRequired: 'Добавьте инструкцию по оплате',
  policyRequired: 'Подтвердите цены, расписание и условия',
};

function validateStep(step: RevenueKitStep, draft: RevenueKitDraft): ValidationErrorCode | null {
  if (step === 'identity') {
    if (!draft.identity.displayName.trim() || !draft.identity.city.trim() || !draft.identity.contactValue.trim()) {
      return 'identityRequired';
    }
  }

  if (step === 'services') {
    const activeServices = draft.services.filter((service) => service.active);
    if (activeServices.length === 0) return 'activeServiceRequired';
    const invalidService = activeServices.some((service) => !validateServiceOffering({
      name: service.name.ru || service.name.kk,
      durationMinutes: service.durationMinutes,
      priceAmount: service.priceAmount,
      currency: service.currency,
    }).ok);
    if (invalidService) return 'serviceInvalid';
  }

  if (step === 'availability') {
    if (draft.availability.weekdays.length === 0) return 'workingDayRequired';
    if (draft.availability.startTime >= draft.availability.endTime) {
      return 'hoursInvalid';
    }
  }

  if (step === 'deposit-policy' && draft.depositPolicy.deposit.mode !== 'none') {
    try {
      const deposit = parseMoney(draft.depositPolicy.deposit.value);
      if (draft.depositPolicy.deposit.mode === 'fixed') {
        const lowestPrice = draft.services
          .filter((service) => service.active)
          .map((service) => parseMoney(service.priceAmount))
          .reduce((lowest, price) => (price < lowest ? price : lowest));
        if (deposit > lowestPrice) return 'depositTooHigh';
      } else if (deposit < 100n || deposit > 10_000n) {
        return 'percentInvalid';
      }
    } catch {
      return 'depositInvalid';
    }

    const instructions = draft.depositPolicy.paymentInstructions;
    if (!instructions.ru.trim() && !instructions.kk.trim()) return 'paymentInstructionsRequired';
  }

  if (step === 'trust-preview' && !draft.trust.policyAccepted) {
    return 'policyRequired';
  }

  return null;
}

export function RevenueKitWizard({
  pageId,
  initialNiche = 'nails',
  onPublished,
  onOpenAdvancedEditor,
}: RevenueKitWizardProps) {
  const { t } = useTranslation();
  const kit = useRevenueKit({ pageId, initialNiche });
  const [draft, setDraft] = useState(kit.draft);
  const [step, setStep] = useState<RevenueKitStep>(kit.step);
  const [validationError, setValidationError] = useState<string | null>(null);
  const publishStarted = useRef(false);

  useEffect(() => {
    setDraft(kit.draft);
    setStep(kit.step);
  }, [kit.draft, kit.step]);

  const stepIndex = REVENUE_KIT_STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / REVENUE_KIT_STEPS.length) * 100;
  const canGoBack = stepIndex > 0;
  const isFinalStep = step === 'publish-distribute';
  const shellError = validationError ?? (kit.error instanceof Error ? kit.error.message : null);
  const stepLabel = useMemo(() => t('revenueKit.progress', 'Шаг {{current}} из {{total}}', {
    current: stepIndex + 1,
    total: REVENUE_KIT_STEPS.length,
  }), [stepIndex, t]);

  const goNext = async () => {
    const errorCode = validateStep(step, draft);
    setValidationError(errorCode
      ? t(`revenueKit.errors.${errorCode}`, validationFallbacks[errorCode])
      : null);
    if (errorCode || isFinalStep) return;

    const nextStep = REVENUE_KIT_STEPS[stepIndex + 1];
    await kit.saveStep(nextStep, draft);
    setStep(nextStep);
  };

  const publish = async () => {
    if (publishStarted.current) return;
    publishStarted.current = true;
    setValidationError(null);
    try {
      const result = await kit.apply();
      onPublished?.(result);
    } catch (error) {
      publishStarted.current = false;
      setValidationError(error instanceof Error
        ? error.message
        : t('revenueKit.errors.publishFailed', 'Не удалось опубликовать страницу'));
    }
  };

  if (kit.isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">{t('common.loading', 'Загрузка…')}</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('revenueKit.title', 'Beauty Revenue Kit')}</span>
          <span>{stepLabel}</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={stepLabel} />
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'identity' && <IdentityStep draft={draft} onChange={setDraft} />}
        {step === 'services' && <ServicesStep draft={draft} onChange={setDraft} />}
        {step === 'availability' && <AvailabilityStep draft={draft} onChange={setDraft} />}
        {step === 'deposit-policy' && <DepositPolicyStep draft={draft} onChange={setDraft} />}
        {step === 'trust-preview' && <TrustPreviewStep draft={draft} onChange={setDraft} />}
        {step === 'publish-distribute' && (
          <PublishDistributeStep
            draft={draft}
            isApplying={kit.isApplying}
            onPublish={publish}
            onOpenAdvancedEditor={onOpenAdvancedEditor}
          />
        )}

        {shellError && <p role="alert" className="text-sm font-medium text-destructive">{shellError}</p>}

        {!isFinalStep && (
          <div className="flex justify-between gap-3 border-t pt-5">
            <Button
              variant="ghost"
              disabled={!canGoBack || kit.isSaving}
              onClick={() => {
                setValidationError(null);
                setStep(REVENUE_KIT_STEPS[stepIndex - 1]);
              }}
            >
              {t('common.back', 'Назад')}
            </Button>
            <Button onClick={() => void goNext()} disabled={kit.isSaving}>
              {kit.isSaving ? t('common.saving', 'Сохраняем…') : t('common.continue', 'Продолжить')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
