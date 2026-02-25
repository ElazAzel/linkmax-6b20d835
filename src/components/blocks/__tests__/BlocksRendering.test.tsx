import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BlockRenderer } from '../../editor/BlockRenderer';
import type { Block } from '@/types/page';

// Mock global URL object
if (typeof URL.createObjectURL === 'undefined') {
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock-url') });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn() });
}

// Mock dependencies
vi.mock('@/hooks/analytics/useAnalyticsTracking', () => ({
    useAnalytics: () => ({
        onBlockClick: vi.fn(),
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
        i18n: { language: 'ru' },
    }),
}));

vi.mock('@/components/legal/TurnstileWidget', () => ({
    default: () => <div data-testid="turnstile-mock"></div>,
    TurnstileWidget: () => <div data-testid="turnstile-mock"></div>
}));

vi.mock('@/hooks/user/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' },
    }),
}));

vi.mock('@/hooks/user/useTokens', () => ({
    useTokens: () => ({
        balance: { balance: 100 },
        purchaseMarketplaceItem: vi.fn(),
        refresh: vi.fn(),
    }),
}));

// Supabase Mock (defined inside vi.mock factory to avoid hoisting issues)
vi.mock('@/platform/supabase/client', () => {
    const mock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
        single: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
    };
    return { supabase: mock };
});

// Mock QueryClient
vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: null, isLoading: false }),
    useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
    useQueryClient: () => ({
        getQueryData: vi.fn(),
        setQueryData: vi.fn(),
    }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockBlocks: Block[] = [
    { id: '1', type: 'profile', name: { ru: 'Имя', en: 'Name' } } as any,
    { id: '2', type: 'link', title: 'Link Title', url: 'https://example.com' } as any,
    { id: '3', type: 'button', title: 'Button Title' } as any,
    { id: '4', type: 'text', content: 'Text Content' } as any,
    { id: '5', type: 'image', url: 'https://example.com/image.png' } as any,
    { id: '6', type: 'video', url: 'https://youtube.com/v123' } as any,
    { id: '7', type: 'carousel', items: [] } as any,
    { id: '8', type: 'socials', platforms: [] } as any,
    { id: '9', type: 'messenger', platforms: [] } as any,
    { id: '10', type: 'form', title: 'Form Title', fields: [] } as any,
    { id: '11', type: 'catalog', title: 'Catalog', items: [] } as any,
    { id: '12', type: 'faq', title: 'FAQ', items: [] } as any,
    { id: '13', type: 'pricing', title: 'Pricing', plans: [] } as any,
    { id: '14', type: 'booking', title: 'Booking' } as any,
    { id: '15', type: 'avatar', url: 'https://example.com/avatar.png' } as any,
    { id: '16', type: 'before_after', beforeUrl: 'url1', afterUrl: 'url2' } as any,
    { id: '17', type: 'community', title: 'Community' } as any,
    { id: '18', type: 'countdown', title: 'Countdown', targetDate: '2026-12-31' } as any,
    { id: '19', type: 'download', title: 'Download', fileUrl: 'url' } as any,
    { id: '20', type: 'event', title: 'Event' } as any,
    { id: '21', type: 'newsletter', title: 'Newsletter' } as any,
    { id: '22', type: 'scratch', title: 'Scratch' } as any,
    { id: '23', type: 'separator' } as any,
    { id: '24', type: 'shoutout', userId: 'user-123', title: 'Shoutout' } as any,
    { id: '25', type: 'testimonial', title: 'Testimonial', content: 'Good' } as any,
    { id: '26', type: 'map', address: 'Almaty' } as any,
    { id: '27', type: 'custom_code', code: '<div></div>' } as any,
];

describe('BlockRenderer Smoke Tests', () => {
    it.each(mockBlocks)('renders $type block without crashing', async (block) => {
        const { container: renderContainer } = render(
            <BlockRenderer
                block={block}
                isPreview={true}
                pageOwnerId="test-user-id"
            />
        );

        // findByTestId waits for the element to appear
        const container = await screen.findByTestId('block-renderer-wrapper');
        expect(container).toBeDefined();

        // Wait for the skeleton (animate-pulse) to disappear
        await waitFor(() => {
            const html = renderContainer.innerHTML;
            if (html.includes('animate-pulse')) {
                throw new Error('Still showing skeleton');
            }
        }, { timeout: 10000 });
    }, 15000);
});
