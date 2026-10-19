import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Check from 'lucide-react/dist/esm/icons/check';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCrmStages } from '@/hooks/crm/useCrmStages';
import {
  CRM_LITE_STAGE_ORDER,
  getDefaultStageLabel,
  type CrmStageLabels,
} from '@/lib/crm/crm-lite';
import type { LeadStatus } from '@/hooks/crm/useLeads';

interface StageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StageSettingsDialog = memo(function StageSettingsDialog({
  open,
  onOpenChange,
}: StageSettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { customLabels, saveStageLabels, resetStageLabels } = useCrmStages();

  const [draft, setDraft] = useState<Record<LeadStatus, string>>(() => ({
    new: customLabels.new || getDefaultStageLabel('new', i18n.language),
    contacted: customLabels.contacted || getDefaultStageLabel('contacted', i18n.language),
    qualified: customLabels.qualified || getDefaultStageLabel('qualified', i18n.language),
    converted: customLabels.converted || getDefaultStageLabel('converted', i18n.language),
    lost: customLabels.lost || getDefaultStageLabel('lost', i18n.language),
  }));

  useEffect(() => {
    if (!open) return;
    setDraft({
      new: customLabels.new || getDefaultStageLabel('new', i18n.language),
      contacted: customLabels.contacted || getDefaultStageLabel('contacted', i18n.language),
      qualified: customLabels.qualified || getDefaultStageLabel('qualified', i18n.language),
      converted: customLabels.converted || getDefaultStageLabel('converted', i18n.language),
      lost: customLabels.lost || getDefaultStageLabel('lost', i18n.language),
    });
  }, [open, customLabels, i18n.language]);

  const handleSave = () => {
    const next: Partial<CrmStageLabels> = {};
    for (const status of CRM_LITE_STAGE_ORDER) {
      const val = draft[status]?.trim() || '';
      const def = getDefaultStageLabel(status, i18n.language);
      if (val && val !== def) {
        next[status] = val;
      }
    }
    saveStageLabels(next);
    toast.success(t('common.saved', 'Сохранено'));
    onOpenChange(false);
  };

  const handleReset = () => {
    resetStageLabels();
    setDraft({
      new: getDefaultStageLabel('new', i18n.language),
      contacted: getDefaultStageLabel('contacted', i18n.language),
      qualified: getDefaultStageLabel('qualified', i18n.language),
      converted: getDefaultStageLabel('converted', i18n.language),
      lost: getDefaultStageLabel('lost', i18n.language),
    });
    toast.success(t('crm.stages.resetDone', 'Названия стадий сброшены'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl" data-testid="crm-stage-settings-dialog">
        <DialogHeader>
          <DialogTitle>{t('crm.stages.title', 'Стадии заявок')}</DialogTitle>
          <DialogDescription>
            {t(
              'crm.stages.description',
              'Назовите этапы так, как принято в вашей работе (например: Новые → Связались → Записан → Оплатил → Завершено).',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {CRM_LITE_STAGE_ORDER.map((status, index) => (
            <div key={status} className="space-y-1">
              <Label htmlFor={`crm-stage-${status}`} className="text-xs text-muted-foreground">
                {index + 1}. {getDefaultStageLabel(status, i18n.language)}
              </Label>
              <Input
                id={`crm-stage-${status}`}
                data-testid={`crm-stage-input-${status}`}
                value={draft[status]}
                maxLength={40}
                onChange={(e) => setDraft(prev => ({ ...prev, [status]: e.target.value }))}
                placeholder={getDefaultStageLabel(status, i18n.language)}
                className="h-10 rounded-xl"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="crm-stage-reset"
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {t('crm.stages.reset', 'По умолчанию')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            data-testid="crm-stage-save"
            className="rounded-xl px-4"
          >
            <Check className="h-4 w-4 mr-1.5" />
            {t('editor.save', 'Сохранить')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
