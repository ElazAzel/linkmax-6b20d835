/**
 * DesignHealthSheet — Phase 6 of the design hierarchy.
 *
 * Shows a deterministic art-direction audit of the current page with one-click
 * fixes. Fixes only touch design fields (sectionId / composition /
 * designVariant) — content and block order stay untouched.
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Check from 'lucide-react/dist/esm/icons/check';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { analyzeDesignHealth, healthTone, type DesignIssue } from '@/lib/design/design-health';
import type { PageTheme } from '@/types/page';
import type { Block } from '@/types/blocks';

export interface DesignHealthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  /** Current page theme — enables the contrast check. */
  theme?: Partial<PageTheme> | null;
  /** Applies design-only changes to the page. */
  onApply: (blocks: Block[], issueId: string) => void;
  /** Applies theme-only fixes (e.g. readable text color). */
  onApplyTheme?: (patch: Partial<PageTheme>, issueId: string) => void;
}

const SEVERITY_ICON = {
  critical: AlertCircle,
  warning: AlertTriangle,
  hint: Lightbulb,
} as const;

const SEVERITY_COLOR = {
  critical: 'text-destructive',
  warning: 'text-amber-500',
  hint: 'text-muted-foreground',
} as const;

const IssueRow = memo(function IssueRow({
  issue,
  onFix,
}: {
  issue: DesignIssue;
  onFix: (issue: DesignIssue) => void;
}) {
  const { t } = useTranslation();
  const Icon = SEVERITY_ICON[issue.severity];
  return (
    <li className="flex gap-3 rounded-xl bg-card p-3">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', SEVERITY_COLOR[issue.severity])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground break-words">
          {t(issue.titleKey, issue.titleFallback)}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground break-words">
          {t(issue.descKey, issue.descFallback)}
        </p>
        {(issue.fix || issue.themeFix) && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 h-8 rounded-full px-3 text-xs"
            onClick={() => onFix(issue)}
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            {t(issue.fixLabelKey ?? 'editor.designHealth.fix.generic', issue.fixLabelFallback ?? 'Исправить')}
          </Button>
        )}
      </div>
    </li>
  );
});

export const DesignHealthSheet = memo(function DesignHealthSheet({
  open,
  onOpenChange,
  blocks,
  theme,
  onApply,
  onApplyTheme,
}: DesignHealthSheetProps) {
  const { t } = useTranslation();

  const report = useMemo(() => analyzeDesignHealth(blocks || [], { theme }), [blocks, theme]);
  const tone = healthTone(report.score);

  const toneClass = {
    good: 'text-emerald-600 dark:text-emerald-400',
    ok: 'text-primary',
    poor: 'text-destructive',
  }[tone];

  const barClass = {
    good: 'bg-emerald-500',
    ok: 'bg-primary',
    poor: 'bg-destructive',
  }[tone];

  const handleFix = (issue: DesignIssue) => {
    if (issue.themeFix) {
      onApplyTheme?.(issue.themeFix, issue.id);
      return;
    }
    if (!issue.fix) return;
    onApply(issue.fix(blocks), issue.id);
  };

  const hasContent = (blocks || []).some((b) => b.type !== 'profile');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-0">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            {t('editor.designHealth.title', 'Качество дизайна')}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t(
              'editor.designHealth.subtitle',
              'Проверка вёрстки без ИИ: ритм секций, герой, визуал и финальный шаг. Исправления не меняют контент.',
            )}
          </SheetDescription>
        </SheetHeader>

        {!hasContent ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('editor.designHealth.empty', 'Сначала добавьте хотя бы один блок на страницу.')}
          </p>
        ) : (
          <div className="mt-4 space-y-4 pb-6">
            <div className="rounded-2xl bg-muted/40 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('editor.designHealth.score', 'Оценка дизайна')}
                  </p>
                  <p className={cn('text-3xl font-bold leading-none', toneClass)}>{report.score}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('editor.designHealth.sections', 'Секций')}: {report.sectionCount}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', barClass)}
                  style={{ width: `${Math.max(4, report.score)}%` }}
                />
              </div>
            </div>

            {report.issues.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                {t('editor.designHealth.allGood', 'Вёрстка выглядит цельно — критичных проблем нет.')}
              </div>
            ) : (
              <ul className="space-y-2">
                {report.issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onFix={handleFix} />
                ))}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});
