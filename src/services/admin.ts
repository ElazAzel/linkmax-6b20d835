import { supabase } from '@/platform/supabase/client';

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

export interface AdminDashboardAggregates {
    dailyGrowth: AdminDailyStats[];
    userDistribution: AdminUserStatus[];
    eventDistribution: AdminEventTypeStats[];
    cumulativeUsers: { date: string; total: number }[];
    socialStats: AdminSocialStats[];
    blockTypeStats: AdminBlockTypeStats[];
}

const BLOCK_PALETTE = [
    '#8b5cf6', '#10b981', '#06b6d4', '#f97316', '#ec4899',
    '#eab308', '#3b82f6', '#ef4444', '#14b8a6', '#a855f7'
];

/**
 * Perf 2026-05-19: every chart on the admin dashboard used to fetch
 * full tables (analytics, blocks, user_profiles) and aggregate them
 * in the browser. They now share a single admin-gated RPC that does
 * all GROUP BY / window aggregation on the server.
 */
async function fetchDashboardAggregates(days = 14): Promise<AdminDashboardAggregates> {
    const { data, error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>)('get_admin_dashboard_aggregates', {
        p_days: days,
        p_cumulative_days: 30,
        p_block_limit: 10,
    });
    if (error) throw error;
    const raw = (data ?? {}) as Partial<AdminDashboardAggregates> & {
        blockTypeStats?: { name: string; count: number }[];
    };
    return {
        dailyGrowth: raw.dailyGrowth ?? [],
        userDistribution: raw.userDistribution ?? [],
        eventDistribution: raw.eventDistribution ?? [],
        cumulativeUsers: raw.cumulativeUsers ?? [],
        socialStats: raw.socialStats ?? [],
        blockTypeStats: (raw.blockTypeStats ?? []).map((b, i) => ({
            name: b.name,
            count: b.count,
            color: BLOCK_PALETTE[i % BLOCK_PALETTE.length],
        })),
    };
}

export const AdminService = {
    getDashboardAggregates: fetchDashboardAggregates,

    // Backwards-compatible wrappers — all sourced from the single RPC.
    async getDailyGrowth(days = 14): Promise<AdminDailyStats[]> {
        return (await fetchDashboardAggregates(days)).dailyGrowth;
    },
    async getUserStatusDistribution(): Promise<AdminUserStatus[]> {
        return (await fetchDashboardAggregates()).userDistribution;
    },
    async getEventDistribution(): Promise<AdminEventTypeStats[]> {
        return (await fetchDashboardAggregates()).eventDistribution;
    },
    async getCumulativeUsers(): Promise<{ date: string; total: number }[]> {
        return (await fetchDashboardAggregates()).cumulativeUsers;
    },
    async getSocialStats(): Promise<AdminSocialStats[]> {
        return (await fetchDashboardAggregates()).socialStats;
    },
    async getBlockTypeStats(): Promise<AdminBlockTypeStats[]> {
        return (await fetchDashboardAggregates()).blockTypeStats;
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
