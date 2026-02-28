import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export type OrganizationRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Organization {
    id: string;
    name: string;
    slug: string | null;
    owner_id: string;
    created_at: string;
}

export interface OrganizationMember {
    id: string;
    org_id: string;
    user_id: string;
    role: OrganizationRole;
    created_at: string;
    profile?: {
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
    };
}

function slugFromName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'org';
}

export const organizationsService = {
    async getMyOrganizations(): Promise<Organization[]> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching organizations', error);
            return [];
        }
        return (data || []) as Organization[];
    },

    async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
        const { data, error } = await supabase
            .from('organization_members')
            .select('*')
            .eq('org_id', orgId);

        if (error) {
            logger.error('Error fetching organization members', error);
            return [];
        }

        const members = data || [];
        // Fetch profiles separately
        const userIds = members.map(m => m.user_id);
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(
            (profiles || []).map(p => [p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }])
        );

        return members.map(m => ({
            ...m,
            role: m.role as OrganizationRole,
            profile: profileMap.get(m.user_id) || { username: null, display_name: null, avatar_url: null },
        }));
    },

    async createOrganization(name: string): Promise<{ data: Organization | null; error: unknown }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'Not authenticated' };

        let slug = slugFromName(name);
        if (!slug) slug = `org-${Date.now().toString(36)}`;

        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existing) {
            slug = `${slug}-${Date.now().toString(36).slice(-6)}`;
        }

        const { data, error } = await supabase
            .from('organizations')
            .insert({ name, slug, owner_id: user.id })
            .select()
            .single();

        if (error) return { data: null, error };

        await supabase
            .from('organization_members')
            .insert({
                org_id: data.id,
                user_id: user.id,
                role: 'owner',
            });

        return { data: data as Organization, error: null };
    },

    async inviteMember(orgId: string, email: string, role: OrganizationRole = 'viewer'): Promise<{ success: boolean; error: unknown }> {
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', email)
            .maybeSingle();

        if (userError || !userData) {
            return { success: false, error: 'User not found or email is not linked to an account' };
        }

        const { error } = await supabase
            .from('organization_members')
            .insert({
                org_id: orgId,
                user_id: userData.id,
                role,
            });

        if (error) return { success: false, error };

        return { success: true, error: null };
    },
};
