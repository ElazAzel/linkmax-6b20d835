import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLeads } from '../useLeads';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';

// Mock useAuth
vi.mock('@/hooks/user/useAuth', () => ({
    useAuth: vi.fn()
}));

// Mock logger & toast
vi.mock('@/lib/utils/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('useLeads', () => {
    const mockUser = { id: 'user-123' };
    const mockLeads = [
        { id: 'lead-1', name: 'Ivan', status: 'new' },
        { id: 'lead-2', name: 'Maria', status: 'contacted' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
    });

    it('should fetch leads on mount', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockLeads, error: null })
        } as any);

        const { result } = renderHook(() => useLeads());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.leads).toEqual(mockLeads);
        expect(result.current.getLeadStats()).toEqual({
            total: 2,
            new: 1,
            contacted: 1,
            qualified: 0,
            converted: 0,
            lost: 0
        });
    });

    it('should create a lead', async () => {
        const newLead = { id: 'lead-3', name: 'Petr' };
        const mockFrom = vi.mocked(supabase.from);

        // Initial fetch mock
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
        } as any);

        // Insert mock
        mockFrom.mockReturnValueOnce({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newLead, error: null })
        } as any);

        const { result } = renderHook(() => useLeads());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            const created = await result.current.createLead({ name: 'Petr' });
            expect(created).toEqual(newLead);
        });

        expect(result.current.leads).toContainEqual(newLead);
    });
});
