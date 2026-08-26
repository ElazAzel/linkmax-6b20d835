/**
 * PrePublishDesignGate — Phase 9 quality gate.
 *
 * Shown right before publishing when the deterministic design audit finds the
 * page below the readable-quality bar. It never blocks publishing: the user can
 * fix the top issues in one tap or publish anyway.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import type { DesignHealthReport } from '@/lib/design/design-health';

export interface PrePublishDesignGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DesignHealthReport;
  /** Applies every auto-fixable issue at once. */
  onFixAll: () => void;
  /** Opens the full design health sheet. */
  onOpenDetails: () => void;
  /** Publish without changes. */
  onPublishAnyway: () => void;
}

export const PrePublishDesignGate = memo(function PrePublishDesignGate({
  open,
  onOpenChange,
  report,
  onFixAll,
  onOpenDetails,
  onPublishAnyway,
}: PrePublishDesignGateProps) {
  const { t } = useTranslation();
  const top = report.issues.slice(0, 3);
  const fixable = report.issues.some((i) => i.fix || i.themeFix);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-0">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            {t('editor.prePublish.title', 'Дизайн можно улучшить за один тап')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              'editor.prePublish.subtitle',
              'Страницу можно опубликовать прямо сейчас — но сначала посмотрите, что портит первое впечатление.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            {t('editor.designHealth.score', 'Оценка дизайна')}
          </p>
          <p
            className={cn(
              'text-3xl font-bold leading-none',
              report.score >= 50 ? 'text-primary' : 'text-destructive',
            )}
          >
            {report.score}
          </p>
        </div>

        <ul className="space-y-2">
          {top.map((issue) => (
            <li key={issue.id} className="flex gap-2 rounded-xl bg-card p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground break-words">
                  {t(issue.titleKey, issue.titleFallback)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground break-words">
                  {t(issue.descKey, issue.descFallback)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {fixable && (
            <Button className="h-11 w-full rounded-xl text-sm font-semibold" onClick={onFixAll}>
              <Wand2 className="mr-2 h-4 w-4" />
              {t('editor.prePublish.fixAll', 'Исправить всё и опубликовать')}
            </Button>
          )}
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl text-sm font-semibold"
            onClick={onOpenDetails}
          >
            {t('editor.prePublish.details', 'Посмотреть детали')}
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full rounded-xl text-xs text-muted-foreground"
            onClick={onPublishAnyway}
          >
            {t('editor.prePublish.publishAnyway', 'Опубликовать как есть')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
