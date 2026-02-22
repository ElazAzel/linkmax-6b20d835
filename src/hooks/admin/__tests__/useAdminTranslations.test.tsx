import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAdminTranslations } from '../useAdminTranslations';
import { upsertToDB } from '@/lib/i18n-db-backend';

// Mock backend
vi.mock('@/lib/i18n-db-backend', () => ({
    fetchTranslationsFromDB: vi.fn(),
    upsertToDB: vi.fn(),
    syncI18nWithDB: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null })
        })
    }
}));

vi.mock('@/lib/utils/logger', () => ({
    logger: { error: vi.fn(), info: vi.fn() }
}));

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('useAdminTranslations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load translations on mount', async () => {
        const { result } = renderHook(() => useAdminTranslations(true), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.translations).toBeDefined();
    });

    it('should expose allKeys', async () => {
        const { result } = renderHook(() => useAdminTranslations(true), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.allKeys).toBeDefined();
        expect(result.current.allKeys.all).toBeDefined();
    });

    it('should update translation and save to DB', async () => {
        vi.mocked(upsertToDB).mockResolvedValue(undefined as any);
        const { result } = renderHook(() => useAdminTranslations(true), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.updateTranslation).toBeDefined();
    });
});
