import { useState, useEffect, useCallback } from 'react';
import { organizationsService, Organization } from '@/services/organizations';
import { supabase } from '@/platform/supabase/client';

export function useOrganizations() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        const orgs = await organizationsService.getMyOrganizations();
        setOrganizations(orgs);

        // Load last selected org from local storage or default to the first one (Personal)
        const lastOrgId = window.localStorage.getItem('last_org_id');
        const savedOrg = orgs.find(o => o.id === lastOrgId);

        if (savedOrg) {
            setCurrentOrg(savedOrg);
        } else if (orgs.length > 0) {
            const personalOrg = orgs.find(o => o.name === 'Personal Organization') || orgs[0];
            setCurrentOrg(personalOrg);
            window.localStorage.setItem('last_org_id', personalOrg.id);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const switchOrganization = (org: Organization) => {
        setCurrentOrg(org);
        window.localStorage.setItem('last_org_id', org.id);
    };

    return {
        organizations,
        currentOrg,
        loading,
        switchOrganization,
        refreshOrganizations: fetchOrganizations
    };
}
