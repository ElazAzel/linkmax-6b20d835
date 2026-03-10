
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import Beaker from 'lucide-react/dist/esm/icons/beaker';
import Split from 'lucide-react/dist/esm/icons/split';
import { createExperiment } from '@/services/experiments';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import { useAppError } from '@/hooks/useAppError';

interface BlockExperimentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pageId: string;
    block: Block;
    onCreated: () => void;
}

export function BlockExperimentDialog({
    open,
    onOpenChange,
    pageId,
    block,
    onCreated,
}: BlockExperimentDialogProps) {
    const { t } = useTranslation();
    const { handleError } = useAppError();
    const [name, setName] = useState(`${t('editor.experiment', 'Эксперимент')}: ${block.type}`);
    const [variantBLabel, setVariantBLabel] = useState('Variant B');
    const [trafficA, setTrafficA] = useState(50);
    const [saving, setSaving] = useState(false);

    // For now, we'll just store a copy of the block data as variant B
    // In a real implementation, we'd allow editing this in a side-by-side preview
    const handleCreate = async () => {
        setSaving(true);
        try {
            const { error } = await createExperiment(
                pageId,
                name,
                block.id,
                [
                    {
                        variant_label: 'Variant A',
                        block_data: block as any, // Original block data
                        traffic_weight: trafficA,
                    },
                    {
                        variant_label: variantBLabel,
                        block_data: { ...(block as any), _is_variant_b: true }, // Placeholder for variant B data
                        traffic_weight: 100 - trafficA,
                    },
                ]
            );

            if (error) throw error;

            toast.success(t('editor.experimentCreated', 'Experiment created! Now you can edit Variant B in the block settings.'));
            onCreated();
            onOpenChange(false);
        } catch (err: any) {
            handleError(err, 'Failed to create experiment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-primary" />
                        {t('editor.setupABTest', 'Настроить A/B Тест')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('editor.abTestDesc', 'Compare two versions of this block to see which performs better.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="exp-name">{t('editor.experimentName', 'Название теста')}</Label>
                        <Input
                            id="exp-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E.g. Pricing Table Test"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Split className="h-4 w-4" />
                                {t('editor.trafficSplit', 'Распределение трафика')}
                            </Label>
                            <div className="flex gap-2">
                                <Badge variant="secondary">{trafficA}% A</Badge>
                                <Badge variant="outline">{100 - trafficA}% B</Badge>
                            </div>
                        </div>
                        <Slider
                            value={[trafficA]}
                            onValueChange={([v]) => setTrafficA(v)}
                            max={100}
                            step={1}
                            className="py-4"
                        />
                    </div>

                    <div className="rounded-lg border border-border/40 p-3 bg-muted/20 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('editor.howItWorks', 'Как это работает')}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {t('editor.abTestInstructions', 'After creating the experiment, you will be able to switch between Variant A and B in the block editor to customize their individual content and styles.')}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        {t('common.cancel', 'Отмена')}
                    </Button>
                    <Button onClick={handleCreate} disabled={saving || !name.trim()}>
                        {saving ? t('common.saving', 'Сохранение...') : t('editor.startExperiment', 'Начать тест')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
