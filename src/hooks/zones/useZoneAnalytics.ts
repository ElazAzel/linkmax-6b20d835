import { useMemo } from 'react';
import { useZoneDeals } from './useZoneDeals';
import { useZoneTasks } from './useZoneTasks';
import { useZoneInvoices } from './useZoneInvoices';

export function useZoneAnalytics(zoneId: string | null) {
    const { deals, stages, loading: dealsLoading } = useZoneDeals(zoneId);
    const { tasks, loading: tasksLoading } = useZoneTasks(zoneId);
    const { invoices, loading: invoicesLoading } = useZoneInvoices(zoneId);

    const loading = dealsLoading || tasksLoading || invoicesLoading;

    const metrics = useMemo(() => {
        // --- Deals ---
        const totalDeals = deals.length;
        const openDeals = deals.filter(d => d.status === 'open');
        const wonDeals = deals.filter(d => d.status === 'won');
        const lostDeals = deals.filter(d => d.status === 'lost');

        const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0);
        const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0);

        const winRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;

        // Funnel (Deals by Stage)
        const funnel = stages.map(stage => ({
            stageName: stage.name,
            count: deals.filter(d => d.stage_id === stage.id).length,
            value: deals.filter(d => d.stage_id === stage.id).reduce((sum, d) => sum + (d.value_amount || 0), 0)
        }));

        // --- Tasks ---
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const pendingTasks = tasks.filter(t => t.status !== 'done').length;
        const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;

        // --- Invoices ---
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(i => i.status === 'paid');
        const pendingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'failed' && i.status !== 'expired');

        const totalPaidAmount = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
        const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

        return {
            deals: {
                total: totalDeals,
                open: openDeals.length,
                won: wonDeals.length,
                lost: lostDeals.length,
                totalOpenValue,
                totalWonValue,
                winRate,
                funnel
            },
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                pending: pendingTasks,
                overdue: overdueTasks
            },
            invoices: {
                total: totalInvoices,
                paid: paidInvoices.length,
                pending: pendingInvoices.length,
                totalPaidAmount,
                totalPendingAmount
            }
        };
    }, [deals, stages, tasks, invoices]);

    return { metrics, loading };
}
