
import { describe, it, expect } from 'vitest';
import { generateGEOSchemas } from '../geo-schemas';
import type { Block, PricingBlock } from '@/types/page';
import type { AnswerBlockData } from '../answer-block';

describe('generateGEOSchemas', () => {
    const mockContext = {
        slug: 'test-user',
        name: 'Test User',
        bio: 'Test Bio',
        avatar: 'https://example.com/avatar.jpg',
        sameAs: [],
        language: 'en' as const,
        answerBlock: {
            entityType: 'Person',
            niche: 'Developer',
            summary: 'Test summary',
            services: [],
            location: 'World',
        } as AnswerBlockData,
    };

    it('should handle PricingBlock with null items gracefully', () => {
        const pricingBlock: PricingBlock = {
            id: 'pricing-1',
            type: 'pricing',
            items: [
                {
                    id: 'item-1',
                    name: 'Service 1',
                    price: 100,
                    currency: 'USD',
                    targetLocation: null as any,
                    baseLocation: undefined as any,
                },
                null as any,
                undefined as any,
            ],
        };

        const blocks: Block[] = [pricingBlock as unknown as Block];

        expect(() => {
            generateGEOSchemas(blocks, mockContext);
        }).not.toThrow();
    });

    it('should handle invalid blocks gracefully', () => {
        const blocks = [
            null,
            undefined,
            { type: 'unknown' },
        ] as unknown as Block[];

        expect(() => {
            generateGEOSchemas(blocks, mockContext);
        }).not.toThrow();
    });
});
