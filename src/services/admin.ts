import { supabase } from '@/platform/supabase/client';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';

export interface AdminDailyStats {
    date: string;
    users: number;
    pages: number;
    views: number;
    clicks: number;
    shares: number;
    blocks: number;
    friendships: number;
    collabs: number;
}

export interface AdminUserStatus {
    name: string;
    value: number;
    color: string;
}

export interface AdminEventTypeStats {
    name: string;
    count: number;
    color: string;
}

export interface AdminSocialStats {
    name: string;
    total: number;
    accepted: number;
}

export interface AdminBlockTypeStats {
    name: string;
    count: number;
    color: string;
}

export interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PartnerFormData {
    name: string;
    logo_url: string;
    website_url: string;
    sort_order: number;
    is_active: boolean;
}

const COLORS = {
    users: '#8b5cf6',
    pages: '#10b981',
    views: '#06b6d4',
    clicks: '#f97316',
    shares: '#ec4899',
    premium: '#eab308',
    trial: '#3b82f6',
    free: '#6b7280'
};

export const AdminService = {
    async getDailyGrowth(days = 14): Promise<AdminDailyStats[]> {
        const startDate = subDays(new Date(), days);

        const [
            { data: usersData },
            { data: pagesData },
            { data: analyticsData },
            { data: blocksData },
            { data: friendshipsData },
            { data: collabsData }
        ] = await Promise.all([
            supabase.from('user_profiles').select('created_at').gte('created_at', startDate.toISOString()),
            supabase.from('pages').select('created_at').gte('created_at', startDate.toISOString()),
            supabase.from('analytics').select('event_type, created_at').gte('created_at', startDate.toISOString()),
            supabase.from('blocks').select('created_at').gte('created_at', startDate.toISOString()),
            supabase.from('friendships').select('created_at').gte('created_at', startDate.toISOString()),
            supabase.from('collaborations').select('created_at').gte('created_at', startDate.toISOString())
        ]);

        const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

        return dateRange.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const dateStr = format(day, 'dd.MM');

            const filterByDay = (items: Record<string, unknown>[] | null) =>
                (items || []).filter(item => {
                    if (!item.created_at) return false;
                    const d = new Date(item.created_at as string);
                    return d >= dayStart && d < dayEnd;
                }).length || 0;

            const dayEvents = analyticsData?.filter(e => {
                if (!e.created_at) return false;
                const d = new Date(e.created_at);
                return d >= dayStart && d < dayEnd;
            }) || [];

            return {
                date: dateStr,
                users: filterByDay(usersData),
                pages: filterByDay(pagesData),
                views: dayEvents.filter(e => e.event_type === 'view').length,
                clicks: dayEvents.filter(e => e.event_type === 'click').length,
                shares: dayEvents.filter(e => e.event_type === 'share').length,
                blocks: filterByDay(blocksData),
                friendships: filterByDay(friendshipsData),
                collabs: filterByDay(collabsData)
            };
        });
    },

    async getUserStatusDistribution(): Promise<AdminUserStatus[]> {
        const now = new Date().toISOString();

        const [
            { count: premiumCount },
            { count: trialCount },
            { count: totalCount }
        ] = await Promise.all([
            supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
            supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_premium', false).gt('trial_ends_at', now),
            supabase.from('user_profiles').select('*', { count: 'exact', head: true })
        ]);

        const freeCount = (totalCount || 0) - (premiumCount || 0) - (trialCount || 0);

        return [
            { name: 'Premium', value: premiumCount || 0, color: COLORS.premium },
            { name: 'Trial', value: trialCount || 0, color: COLORS.trial },
            { name: 'Free', value: Math.max(0, freeCount), color: COLORS.free }
        ];
    },

    async getEventDistribution(): Promise<AdminEventTypeStats[]> {
        const { data } = await supabase.from('analytics').select('event_type');

        const counts = { view: 0, click: 0, share: 0 };
        data?.forEach(e => {
            if (e.event_type in counts) {
                counts[e.event_type as keyof typeof counts]++;
            }
        });

        return [
            { name: 'Views', count: counts.view, color: COLORS.views },
            { name: 'Clicks', count: counts.click, color: COLORS.clicks },
            { name: 'Shares', count: counts.share, color: COLORS.shares }
        ];
    },

    async getCumulativeUsers(days = 30): Promise<{ date: string; total: number }[]> {
        const { data } = await supabase
            .from('user_profiles')
            .select('created_at')
            .order('created_at', { ascending: true });

        if (!data || data.length === 0) return [];

        const dateMap = new Map<string, number>();
        let cumulative = 0;

        data.forEach(u => {
            if (!u.created_at) return;
            const dateStr = format(new Date(u.created_at), 'dd.MM');
            cumulative++;
            dateMap.set(dateStr, cumulative);
        });

        const entries = Array.from(dateMap.entries());
        return entries.slice(-days).map(([date, total]) => ({ date, total }));
    },

    async getSocialStats(): Promise<AdminSocialStats[]> {
        const [
            { count: totalFriends },
            { count: acceptedFriends },
            { count: totalCollabs },
            { count: acceptedCollabs },
            { count: totalTeams }
        ] = await Promise.all([
            supabase.from('friendships').select('*', { count: 'exact', head: true }),
            supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
            supabase.from('collaborations').select('*', { count: 'exact', head: true }),
            supabase.from('collaborations').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
            supabase.from('teams').select('*', { count: 'exact', head: true })
        ]);

        return [
            { name: 'Friends', total: totalFriends || 0, accepted: acceptedFriends || 0 },
            { name: 'Collabs', total: totalCollabs || 0, accepted: acceptedCollabs || 0 },
            { name: 'Teams', total: totalTeams || 0, accepted: totalTeams || 0 }
        ];
    },

    async getBlockTypeStats(limit = 10): Promise<AdminBlockTypeStats[]> {
        const { data } = await supabase.from('blocks').select('type');

        const typeCounts: Record<string, number> = {};
        data?.forEach(block => {
            typeCounts[block.type] = (typeCounts[block.type] || 0) + 1;
        });

        const colorPalette = [
            '#8b5cf6', '#10b981', '#06b6d4', '#f97316', '#ec4899',
            '#eab308', '#3b82f6', '#ef4444', '#14b8a6', '#a855f7'
        ];

        return Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count], index) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                count,
                color: colorPalette[index % colorPalette.length]
            }));
    },

    // Partners CRUD
    async getPartners(): Promise<Partner[]> {
        const { data, error } = await supabase
            .from('partners')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return (data || []) as Partner[];
    },

    async createPartner(data: PartnerFormData): Promise<void> {
        const { error } = await supabase.from('partners').insert([data]);
        if (error) throw error;
    },

    async updatePartner(id: string, data: PartnerFormData): Promise<void> {
        const { error } = await supabase.from('partners').update(data).eq('id', id);
        if (error) throw error;
    },

    async deletePartner(id: string): Promise<void> {
        const { error } = await supabase.from('partners').delete().eq('id', id);
        if (error) throw error;
    }
};
