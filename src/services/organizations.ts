import { supabase } from '@/integrations/supabase/client';
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

export const organizationsService = {
    async getMyOrganizations(): Promise<Organization[]> {
        const { data, error } = await (supabase as any)
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching organizations', error);
            return [];
        }
        return data || [];
    },

    async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
        const { data, error } = await (supabase as any)
            .from('organization_members')
            .select(`
        *,
        profile:user_profiles (
          username,
          display_name,
          avatar_url
        )
      `)
            .eq('org_id', orgId);

        if (error) {
            logger.error('Error fetching organization members', error);
            return [];
        }
        return data as any as OrganizationMember[];
    },

    async createOrganization(name: string): Promise<{ data: Organization | null, error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'Not authenticated' };

        const { data, error } = await (supabase as any)
            .from('organizations')
            .insert({ name, owner_id: user.id })
            .select()
            .single();

        if (error) return { data: null, error };

        // Add owner to members
        await (supabase as any).from('organization_members').insert({
            org_id: data.id,
            user_id: user.id,
            role: 'owner'
        });

        return { data, error: null };
    },

    async inviteMember(orgId: string, email: string, role: OrganizationRole = 'viewer'): Promise<{ success: boolean, error: any }> {
        // Note: In a real app, this would use organization_invitations table
        // For now, we'll try to find user by email and add directly if they exist
        const { data: userData, error: userError } = await (supabase as any)
            .from('user_profiles')
            .select('id')
            .eq('email', email) // This assumes email is public in profiles or we use a more complex auth search
            .maybeSingle();

        if (userError || !userData) {
            return { success: false, error: 'User not found or email is not linked to an account' };
        }

        const { error } = await (supabase as any).from('organization_members').insert({
            org_id: orgId,
            user_id: userData.id,
            role
        });

        if (error) return { success: false, error };

        return { success: true, error: null };
    }
};
