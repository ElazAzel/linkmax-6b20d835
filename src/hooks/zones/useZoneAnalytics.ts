import { useMemo } from 'react';
import { useZoneDeals } from './useZoneDeals';
import { useZoneTasks } from './useZoneTasks';
import { useZoneInvoices } from './useZoneInvoices';
import { useZones } from './useZones';
import { differenceInDays, startOfWeek, format } from 'date-fns';

export interface TeamMember {
    userId: string;
    name: string;
    total: number;
    completed: number;
    completionRate: number;
    avgDaysToClose: number;
}

export interface ConversionTrendPoint {
    period: string;
    won: number;
    lost: number;
}

export function useZoneAnalytics(zoneId: string | null) {
    const { deals, stages, loading: dealsLoading } = useZoneDeals(zoneId);
    const { tasks, loading: tasksLoading } = useZoneTasks(zoneId);
    const { invoices, loading: invoicesLoading } = useZoneInvoices(zoneId);
    const { members } = useZones();

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

    // Team performance metrics
    const teamMetrics = useMemo<TeamMember[]>(() => {
        const byAssignee: Record<string, { total: number; completed: number; closeTimes: number[] }> = {};

        tasks.forEach(task => {
            const assignee = task.assignee_user_id || 'unassigned';
            if (!byAssignee[assignee]) {
                byAssignee[assignee] = { total: 0, completed: 0, closeTimes: [] };
            }
            byAssignee[assignee].total++;
            if (task.status === 'done') {
                byAssignee[assignee].completed++;
                // Calculate days to close
                if (task.created_at && task.updated_at) {
                    const days = differenceInDays(new Date(task.updated_at), new Date(task.created_at));
                    byAssignee[assignee].closeTimes.push(Math.max(days, 0));
                }
            }
        });

        return Object.entries(byAssignee).map(([userId, data]) => {
            const member = members.find(m => m.user_id === userId);
            const avgDays = data.closeTimes.length > 0
                ? data.closeTimes.reduce((a, b) => a + b, 0) / data.closeTimes.length
                : 0;

            return {
                userId,
                name: member?.display_name || (userId === 'unassigned' ? 'Unassigned' : userId.slice(0, 8)),
                total: data.total,
                completed: data.completed,
                completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
                avgDaysToClose: Math.round(avgDays * 10) / 10,
            };
        }).sort((a, b) => b.completed - a.completed);
    }, [tasks, members]);

    // Conversion trend (won/lost by week)
    const conversionTrend = useMemo<ConversionTrendPoint[]>(() => {
        const closedDeals = deals.filter(d => d.status === 'won' || d.status === 'lost');
        const byWeek: Record<string, { won: number; lost: number }> = {};

        closedDeals.forEach(deal => {
            const date = new Date(deal.updated_at || deal.created_at);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const key = format(weekStart, 'MM/dd');
            if (!byWeek[key]) byWeek[key] = { won: 0, lost: 0 };
            if (deal.status === 'won') byWeek[key].won++;
            else byWeek[key].lost++;
        });

        return Object.entries(byWeek)
            .map(([period, data]) => ({ period, ...data }))
            .sort((a, b) => a.period.localeCompare(b.period))
            .slice(-8); // Last 8 weeks
    }, [deals]);

    return { metrics, teamMetrics, conversionTrend, loading };
}
