import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useZoneAnalytics } from '@/hooks/zones/useZoneAnalytics';
import { Target, TrendingUp, Filter, CheckCircle2, Clock, DollarSign, ListTodo, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ZoneAnalyticsScreenProps {
    zoneId: string;
}

export function ZoneAnalyticsScreen({ zoneId }: ZoneAnalyticsScreenProps) {
    const { t } = useTranslation();
    const { metrics, loading } = useZoneAnalytics(zoneId);

    if (loading) {
        return (
            <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }

    const { deals, tasks, invoices } = metrics;

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl flex items-center gap-2 font-bold tracking-tight">
                        <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        {t('zones.analytics.title', 'Аналитика и Отчеты')}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        {t('zones.analytics.subtitle', 'Сводка по продажам, финансам и эффективности команды.')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium">{t('zones.analytics.activeValue', 'Сумма открытых сделок')}</p>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{deals.totalOpenValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">{deals.open} {t('zones.analytics.dealsOpen', 'открытых сделок')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium">{t('zones.analytics.winRate', 'Win Rate')}</p>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{Math.round(deals.winRate)}%</div>
                        <Progress value={deals.winRate} className="h-1 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium">{t('zones.analytics.tasksDone', 'Выполнено задач')}</p>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold flex items-end gap-2">
                            {tasks.completed} <span className="text-sm font-normal text-muted-foreground mb-1">/ {tasks.total}</span>
                        </div>
                        {tasks.overdue > 0 && (
                            <p className="text-xs text-destructive mt-1 font-medium">{tasks.overdue} {t('zones.analytics.overdue', 'просрочено')}</p>
                        )}
                        {tasks.overdue === 0 && (
                            <p className="text-xs text-green-600 mt-1 font-medium">{t('zones.analytics.noOverdue', 'Нет просроченных')}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium">{t('zones.analytics.paidValue', 'Оплачено по счетам')}</p>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{invoices.totalPaidAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ожидается: {invoices.totalPendingAmount.toLocaleString()} ({invoices.pending} шт)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="h-5 w-5" />
                            {t('zones.analytics.funnel', 'Воронка продаж')}
                        </CardTitle>
                        <CardDescription>{t('zones.analytics.funnelDesc', 'Количество и объём сделок на каждом этапе воронки.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {deals.funnel.length > 0 ? (
                            <div className="space-y-4">
                                {deals.funnel.map((stage, idx) => {
                                    const maxCount = Math.max(...deals.funnel.map(s => s.count), 1);
                                    const ptc = (stage.count / maxCount) * 100;
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{stage.stageName}</span>
                                                <span className="text-muted-foreground">{stage.count} шт. ({stage.value.toLocaleString()})</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/80 transition-all rounded-full" style={{ width: `${ptc}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">{t('zones.analytics.funnelEmpty', 'Нет данных для отображения воронки.')}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ListTodo className="h-5 w-5" />
                            {t('zones.analytics.taskMetrics', 'Эффективность задач')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="font-medium">{t('zones.analytics.completed', 'Выполнено')}</p>
                                    <p className="text-2xl font-bold">{tasks.completed}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <p className="font-medium">{t('zones.analytics.pending', 'В работе')}</p>
                                    <p className="text-2xl font-bold">{tasks.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{t('zones.analytics.completionRate', 'Успешность (Completed / Total)')}</span>
                                <span className="font-bold">
                                    {tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
