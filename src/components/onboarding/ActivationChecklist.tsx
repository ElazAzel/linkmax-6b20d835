/**
 * ActivationChecklist v2.0 - Outcome-based progress widget
 * Shows 4 value-driven steps, celebration state on completion
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import Circle from 'lucide-react/dist/esm/icons/circle';
import X from 'lucide-react/dist/esm/icons/x';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import PartyPopper from 'lucide-react/dist/esm/icons/party-popper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';
import type { ActivationStep } from '@/hooks/onboarding/useActivationChecklist';

interface ActivationChecklistProps {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  progress: number;
  canDismiss: boolean;
  onDismiss: () => void;
  onStepClick: (step: ActivationStep) => void;
}

export const ActivationChecklist = memo(function ActivationChecklist({
  steps,
  completedCount,
  totalCount,
  progress,
  canDismiss,
  onDismiss,
  onStepClick,
}: ActivationChecklistProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-5 space-y-4 bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/15">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {t('activation.title', 'Запустите страницу')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('activation.progress', '{{done}} из {{total}}', { done: completedCount, total: totalCount })}
            </p>
          </div>
        </div>
        {canDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => {
              if (step.completed) return;
              onStepClick(step);
              if (step.action) {
                step.action();
              }
            }}
            disabled={step.completed}
            className={cn(
              "flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition-colors text-sm",
              step.completed
                ? "text-muted-foreground"
                : "hover:bg-primary/5 cursor-pointer"
            )}
          >
            {step.completed ? (
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
            <span className={cn(step.completed && "line-through")}>
              {t(step.labelKey, step.id === 'add-block' ? 'Добавить блок' : step.id === 'first-lead' ? 'Получить первый лид' : step.id === 'create-page' ? 'Создать страницу' : 'Опубликовать')}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
});

/** Celebration card shown when all steps are complete */
interface CelebrationCardProps {
  onDismiss: () => void;
}

export const ActivationCelebration = memo(function ActivationCelebration({
  onDismiss,
}: CelebrationCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-primary/10 border-emerald-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <PartyPopper className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {t('activation.celebrationTitle', '🎉 Поздравляем!')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('activation.celebrationDesc', 'Ваша страница работает и приносит результаты')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
});
