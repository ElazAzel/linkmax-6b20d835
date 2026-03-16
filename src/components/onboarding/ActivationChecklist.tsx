/**
 * ActivationChecklist v2.0 - Outcome-based progress widget
 * Shows 4 value-driven steps, celebration state on completion
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import PartyPopper from 'lucide-react/dist/esm/icons/party-popper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const activeIndex = steps.findIndex((step) => !step.completed);

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

      {/* Progress bar + stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>{t('activation.progress', '{{done}} из {{total}}', { done: completedCount, total: totalCount })}</span>
          <span>{progress}%</span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isActive = !isCompleted && index === activeIndex;
            return (
              <div key={step.id} className="flex-1 h-2 rounded-full overflow-hidden bg-white/10 border border-white/10">
                <div
                  className={cn(
                    'h-full w-full transition-colors',
                    isCompleted ? 'bg-primary' : isActive ? 'bg-amber-400/90' : 'bg-transparent'
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isActive = !isCompleted && index === activeIndex;
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-sm',
                isCompleted ? 'text-muted-foreground bg-white/5' : 'bg-white/5',
                isActive && 'border border-primary/25 bg-primary/5'
              )}
            >
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black',
                isCompleted
                  ? 'bg-primary/20 text-primary'
                  : isActive
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                  : 'bg-white/10 text-muted-foreground'
              )}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={cn('flex-1', isCompleted && 'line-through')}>
                {t(step.labelKey)}
              </span>
              {!isCompleted && step.action && (
                <Button size="sm" variant={isActive ? 'default' : 'outline'} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-wider" onClick={step.action}>
                  {t(step.ctaKey)}
                </Button>
              )}
            </div>
          );
        })}
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
