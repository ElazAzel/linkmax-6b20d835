import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Play from 'lucide-react/dist/esm/icons/play';
import Square from 'lucide-react/dist/esm/icons/square';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    useExperimentAnalytics,
    ExperimentWithStats,
    VariantWithStats
} from '@/hooks/analytics/useExperimentAnalytics';
import {
    updateExperimentStatus,
    deleteExperiment,
    setWinningVariant
} from '@/services/experiments';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExperimentsListProps {
    pageId: string;
}

export const ExperimentsList = memo(function ExperimentsList({ pageId }: ExperimentsListProps) {
    const { t } = useTranslation();
    const { handleError } = useAppError();
    const { experiments, loading, refresh } = useExperimentAnalytics(pageId);

    const handleStatusChange = async (expId: string, status: 'running' | 'ended' | 'paused') => {
        try {
            const { error } = await updateExperimentStatus(expId, status);
            if (error) throw error;
            toast.success(t(`experiments.status.${status}Success`, 'Статус обновлен'));
            refresh();
        } catch (error: any) {
            handleError(error);
        }
    };

    const handleDelete = async (expId: string) => {
        if (!confirm(t('experiments.confirmDelete', 'Вы уверены, что хотите удалить этот эксперимент?'))) return;
        try {
            const { error } = await deleteExperiment(expId);
            if (error) throw error;
            toast.success(t('experiments.deleteSuccess', 'Эксперимент удален'));
            refresh();
        } catch (error: any) {
            handleError(error);
        }
    };

    const handleWinner = async (expId: string, variantId: string) => {
        if (!confirm(t('experiments.confirmWinner', 'Версия будет применена ко всем пользователям. Продолжить?'))) return;
        try {
            const { error } = await setWinningVariant(expId, variantId, true);
            if (error) throw error;
            toast.success(t('experiments.winnerSet', 'Победитель выбран и применен'));
            refresh();
        } catch (error: any) {
            handleError(error);
        }
    };

    if (loading && experiments.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <Card key={i} className="p-6 h-48 animate-pulse bg-muted/20" />
                ))}
            </div>
        );
    }

    if (experiments.length === 0) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 glass-card">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">{t('experiments.empty.title', 'Нет активных тестов')}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {t('experiments.empty.desc', 'Протестируйте разные заголовки или кнопки, чтобы узнать, что лучше конвертирует посетителей.')}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="popLayout">
                {experiments.map((exp) => (
                    <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                    >
                        <Card className="overflow-hidden glass-card border-white/10">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{exp.name}</h3>
                                        <Badge className={cn(
                                            "uppercase text-xs font-black tracking-widest px-2 py-0.5",
                                            exp.status === 'running' ? "bg-emerald-500 hover:bg-emerald-600" :
                                                exp.status === 'ended' ? "bg-slate-500 hover:bg-slate-600" :
                                                    "bg-amber-500 hover:bg-amber-600"
                                        )}>
                                            {t(`experiments.status.${exp.status}`, exp.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {exp.started_at && `${t('experiments.started', 'Начат')}: ${format(new Date(exp.started_at), 'dd.MM.yyyy HH:mm')}`}
                                        {exp.ended_at && ` • ${t('experiments.ended', 'Завершен')}: ${format(new Date(exp.ended_at), 'dd.MM.yyyy HH:mm')}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {exp.status === 'draft' && (
                                        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => handleStatusChange(exp.id, 'running')}>
                                            <Play className="h-3.5 w-3.5" />
                                            {t('experiments.actions.start', 'Запустить')}
                                        </Button>
                                    )}
                                    {exp.status === 'running' && (
                                        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => handleStatusChange(exp.id, 'ended')}>
                                            <Square className="h-3.5 w-3.5" />
                                            {t('experiments.actions.stop', 'Остановить')}
                                        </Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(exp.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {exp.variants.map((variant) => {
                                    const isWinner = exp.winning_variant_id === variant.id;
                                    const isLeading = exp.status === 'running' &&
                                        variant.stats.ctr > Math.min(...exp.variants.map(v => v.stats.ctr)) &&
                                        variant.stats.views > 5;

                                    return (
                                        <div key={variant.id} className={cn(
                                            "relative p-5 rounded-2xl transition-all border",
                                            isWinner ? "bg-emerald-500/10 border-emerald-500/30" :
                                                isLeading ? "bg-primary/5 border-primary/20" :
                                                    "bg-muted/5 border-white/5"
                                        )}>
                                            {isWinner && (
                                                <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                                                    <Trophy className="h-4 w-4" />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-black",
                                                        variant.variant_label === 'A' ? "bg-primary text-primary-foreground" : "bg-violet-500 text-white"
                                                    )}>
                                                        {variant.variant_label}
                                                    </div>
                                                    <span className="font-bold text-sm">
                                                        {variant.variant_label === 'A' ? t('experiments.label.original', 'Оригинал') : t('experiments.label.variant', 'Вариант')}
                                                    </span>
                                                </div>
                                                {isLeading && (
                                                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/20 gap-1 h-5 text-xs font-black">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {t('experiments.leading', 'ЛИДИРУЕТ')}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 py-2">
                                                <div className="text-center">
                                                    <div className="text-lg font-black">{variant.stats.views}</div>
                                                    <div className="text-xs uppercase text-muted-foreground font-bold tracking-tight">{t('analytics.views', 'Просмотры')}</div>
                                                </div>
                                                <div className="text-center border-x border-white/5">
                                                    <div className="text-lg font-black">{variant.stats.clicks}</div>
                                                    <div className="text-xs uppercase text-muted-foreground font-bold tracking-tight">{t('analytics.clicks', 'Клики')}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-black text-primary">{variant.stats.ctr.toFixed(1)}%</div>
                                                    <div className="text-xs uppercase text-muted-foreground font-bold tracking-tight">CTR</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                <Progress value={variant.stats.ctr * 5} className="h-1.5" />

                                                {(exp.status === 'running' || (exp.status === 'ended' && !exp.winning_variant_id)) && (
                                                    <Button
                                                        className="w-full h-8 text-xs font-bold gap-2"
                                                        variant={isLeading ? "default" : "outline"}
                                                        onClick={() => handleWinner(exp.id, variant.id)}
                                                    >
                                                        <Trophy className="h-3 w-3" />
                                                        {t('experiments.actions.pickWinner', 'Выбрать победителем')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Prediction/Insight */}
                            {exp.status === 'running' && exp.variants[0].stats.views > 20 && (
                                <div className="px-6 pb-6 pt-0">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                        <FlaskConical className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div className="text-xs leading-relaxed text-muted-foreground">
                                            <strong className="text-foreground font-bold block mb-1">
                                                {t('experiments.insight.title', 'Промежуточный инсайт')}
                                            </strong>
                                            {t('experiments.insight.desc', 'Данных пока недостаточно для 95% уверенности, но Вариант {{variant}} показывает лучший результат по CTR.', {
                                                variant: exp.variants.sort((a, b) => b.stats.ctr - a.stats.ctr)[0].variant_label
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});
