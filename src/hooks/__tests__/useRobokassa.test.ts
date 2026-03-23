import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRobokassa } from '../useRobokassa';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        },
        functions: {
            invoke: vi.fn()
        }
    }
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

// Mock useAppError
vi.mock('@/hooks/useAppError', () => ({
    useAppError: () => ({
        handleError: vi.fn()
    })
}));

describe('useRobokassa', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location.href safely
        vi.stubGlobal('location', {
            ...window.location,
            href: '',
            assign: vi.fn(),
            replace: vi.fn(),
        });
    });

    it('should buy subscription and redirect on success', async () => {
        const mockUser = { id: 'user-123' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any);
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { url: 'https://robokassa.ru/go' },
            error: null
        } as any);

        const { result } = renderHook(() => useRobokassa());

        await act(async () => {
            await result.current.buySubscription('pro', 12);
        });

        expect(window.location.href).toBe('https://robokassa.ru/go');
        expect(supabase.functions.invoke).toHaveBeenCalledWith('robokassa', expect.objectContaining({
            body: { type: 'subscription', plan: 'pro', period: 12, userId: 'user-123' }
        }));
    });

    it('should show error if not authenticated', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any);

        const { result } = renderHook(() => useRobokassa());

        await act(async () => {
            await result.current.buySubscription('pro', 12);
        });

        expect(toast.error).toHaveBeenCalledWith("Пожалуйста, войдите в систему");
    });

    it('should initiate general payment', async () => {
        const mockUser = { id: 'user-123' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any);
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { url: 'https://robokassa.ru/pay' },
            error: null
        } as any);

        const { result } = renderHook(() => useRobokassa());

        await act(async () => {
            await result.current.initiatePayment(500, 'Test items', 'item-1');
        });

        expect(window.location.href).toBe('https://robokassa.ru/pay');
        expect(supabase.functions.invoke).toHaveBeenCalledWith('robokassa', expect.objectContaining({
            body: { type: 'payment', amount: 500, description: 'Test items', userId: 'user-123', relatedId: 'item-1' }
        }));
    });
});
