/**
 * PageHealthMeter — компактный индикатор «насколько страница готова к продажам».
 *
 * Источник данных — `useActivationChecklist`. Показывает прогресс-бар + tooltip
 * со следующим невыполненным шагом. Клик раскрывает popover со всем чек-листом.
 *
 * Используется внутри EditorTopBar, заменяет постоянно висящий ActivationChecklist
 * на канвасе.
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils/utils';
import type { ActivationStep } from '@/hooks/onboarding/useActivationChecklist';

export interface PageHealthMeterProps {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  progress: number; // 0..1
  isComplete?: boolean;
  onStepClick?: (step: ActivationStep) => void;
  className?: string;
}

export const PageHealthMeter = memo(function PageHealthMeter({
  steps,
  completedCount,
  totalCount,
  progress,
  isComplete,
  onStepClick,
  className,
}: PageHealthMeterProps) {
  const { t } = useTranslation();

  const nextStep = useMemo(
    () => steps.find((s) => !s.completed),
    [steps],
  );

  // Цвет тон-в-тон со степенью готовности
  const tone = isComplete
    ? 'emerald'
    : progress >= 0.6
    ? 'primary'
    : 'muted';

  const barColor = {
    emerald: 'bg-emerald-500',
    primary: 'bg-primary',
    muted: 'bg-muted-foreground/40',
  }[tone];

  const labelColor = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    primary: 'text-primary',
    muted: 'text-muted-foreground',
  }[tone];

  if (totalCount === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('editor.health.label', 'Готовность страницы')}
          className={cn(
            'group flex items-center gap-2.5 px-3 h-10 rounded-full',
            'bg-card hover:bg-accent transition-colors border border-border/10',
            'active:scale-[0.98] transition-transform',
            className,
          )}
        >
          {isComplete ? (
            <Sparkles className={cn('h-4 w-4', labelColor)} />
          ) : (
            <div className="relative h-2 w-16 sm:w-24 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out', barColor)}
                style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
              />
            </div>
          )}
          <span className={cn('text-xs font-semibold whitespace-nowrap', labelColor)}>
            {isComplete
              ? t('editor.health.ready', 'Готово к продажам')
              : `${completedCount}/${totalCount}`}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" sideOffset={8} className="w-[320px] p-0 overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t('editor.health.title', 'Путь к первому лиду')}
            </h3>
            <span className={cn('text-xs font-bold', labelColor)}>
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500 ease-out', barColor)}
              style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
            />
          </div>
          {nextStep && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t('editor.health.next', 'Дальше')}:{' '}
              <span className="font-medium text-foreground">
                {t(nextStep.labelKey, nextStep.id)}
              </span>
            </p>
          )}
        </div>

        <ul className="max-h-[280px] overflow-y-auto py-1">
          {steps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepClick?.(step)}
                disabled={step.completed}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent',
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    step.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border border-border/40 bg-background',
                  )}
                >
                  {step.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <span
                  className={cn(
                    'text-sm flex-1 truncate',
                    step.completed
                      ? 'text-muted-foreground line-through decoration-1'
                      : 'text-foreground font-medium',
                  )}
                >
                  {t(step.labelKey, step.id)}
                </span>
                {!step.completed && (
                  <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100">
                    →
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
});
