import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createExperiment } from '@/services/experiments';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import { cn } from '@/lib/utils/utils';
import { VariantBlockEditor } from '@/components/editor/experiments/VariantBlockEditor';

interface ExperimentSetupDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    pageId: string;
    block: Block;
    onSuccess?: () => void;
}

export function ExperimentSetupDialog({
    isOpen,
    onOpenChange,
    pageId,
    block,
    onSuccess,
}: ExperimentSetupDialogProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(`${t('experiments.defaultName', 'Тест')} - ${block.type}`);
    const [variants, setVariants] = useState<any[]>([
        {
            variant_label: 'A',
            block_data: { ...block },
            traffic_weight: 50,
            isBase: true
        },
        {
            variant_label: 'B',
            block_data: { ...block },
            traffic_weight: 50
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

    const handleWeightChange = (index: number, value: number) => {
        const newVariants = [...variants];
        newVariants[index].traffic_weight = value;
        if (newVariants.length === 2) {
            const otherIndex = index === 0 ? 1 : 0;
            newVariants[otherIndex].traffic_weight = 100 - value;
        }
        setVariants(newVariants);
    };

    const handleVariantBlockChange = (index: number, updatedBlock: Block) => {
        const newVariants = [...variants];
        newVariants[index].block_data = updatedBlock;
        setVariants(newVariants);
    };

    const handleStart = async () => {
        if (!name.trim()) {
            toast.error(t('experiments.error.nameRequired', 'Введите название теста'));
            return;
        }

        setLoading(true);
        try {
            const { error } = await createExperiment(
                pageId,
                name,
                block.id,
                variants.map(v => ({
                    variant_label: v.variant_label,
                    block_data: v.block_data,
                    traffic_weight: v.traffic_weight
                }))
            );

            if (error) throw error;

            toast.success(t('experiments.success.started', 'Эксперимент запущен'));
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || t('experiments.error.starting', 'Ошибка при запуске'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] gap-6 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FlaskConical className="h-4 w-4 text-primary" />
                        </div>
                        <DialogTitle>{t('experiments.setup.title', 'Создать A/B тест')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('experiments.setup.description', 'Сравните две версии блока, чтобы узнать, какая работает лучше.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('experiments.setup.nameLabel', 'Название эксперимента')}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('experiments.setup.namePlaceholder', 'Назовите ваш тест...')}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold">{t('experiments.setup.variants', 'Варианты и трафик')}</Label>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                                {variants.length} {t('experiments.setup.variantsCount', 'варианта')}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {variants.map((v, i) => (
                                <div key={i} className="p-4 rounded-2xl glass-subtle border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                v.variant_label === 'A' ? "bg-primary text-primary-foreground" : "bg-violet-500 text-white"
                                            )}>
                                                {v.variant_label}
                                            </div>
                                            <span className="text-sm font-bold">
                                                {v.variant_label === 'A'
                                                    ? t('experiments.setup.variantA', 'Оригинал')
                                                    : t('experiments.setup.variantB', 'Вариант B')}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-primary">{v.traffic_weight}%</span>
                                    </div>

                                    <Slider
                                        value={[v.traffic_weight]}
                                        onValueChange={([val]) => handleWeightChange(i, val)}
                                        max={100}
                                        step={1}
                                        className="py-2"
                                    />

                                    {v.variant_label !== 'A' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    variant={editingVariantIndex === i ? "secondary" : "ghost"}
                                                    size="sm"
                                                    className="h-8 text-xs font-bold gap-1.5"
                                                    onClick={() => setEditingVariantIndex(editingVariantIndex === i ? null : i)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    {editingVariantIndex === i
                                                        ? t('experiments.setup.hideEditor', 'Скрыть редактор')
                                                        : t('experiments.setup.configure', 'Настроить контент')}
                                                </Button>
                                            </div>
                                            {editingVariantIndex === i && (
                                                <VariantBlockEditor
                                                    block={v.block_data as Block}
                                                    onChange={(updated) => handleVariantBlockChange(i, updated)}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Alert className="bg-primary/5 border-primary/20">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-xs font-bold">{t('experiments.setup.tipTitle', 'Совет')}</AlertTitle>
                        <AlertDescription className="text-[11px] leading-relaxed">
                            {t('experiments.setup.tipDesc', 'Меняйте только одно свойство (например, текст кнопки), чтобы точно знать, что именно повлияло на конверсию.')}
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('common.cancel', 'Отмена')}
                    </Button>
                    <Button onClick={handleStart} disabled={loading} className="gap-2">
                        <FlaskConical className="h-4 w-4" />
                        {loading ? t('common.loading', 'Загрузка...') : t('experiments.setup.start', 'Запустить тест')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}