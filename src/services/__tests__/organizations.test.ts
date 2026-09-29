import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationsService } from '../organizations';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn(),
        auth: { getUser: vi.fn() },
    },
}));

describe('organizationsService.inviteMember', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resolves the email server-side via the invite RPC', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { ok: true }, error: null } as never);
        const result = await organizationsService.inviteMember('org-1', ' Friend@Example.com ', 'editor');
        expect(supabase.rpc).toHaveBeenCalledWith('invite_org_member_by_email', {
            p_org_id: 'org-1',
            p_email: 'Friend@Example.com',
            p_role: 'editor',
        });
        expect(supabase.from).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, error: null });
    });

    it('passes through a typed error from the RPC', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { ok: false, error: 'user_not_found' }, error: null } as never);
        const result = await organizationsService.inviteMember('org-1', 'nobody@example.com');
        expect(result).toEqual({ success: false, error: 'user_not_found' });
    });

    it('reports "unavailable" while the RPC is not deployed', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { code: 'PGRST202' } } as never);
        const result = await organizationsService.inviteMember('org-1', 'a@b.kz');
        expect(result).toEqual({ success: false, error: 'unavailable' });
    });
});
