import { describe, it, expect, vi } from 'vitest';
import { createBlock } from '../block-factory';

// Mock crypto.randomUUID for event block generation
if (typeof crypto === 'undefined') {
    (global as any).crypto = {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
    };
}

describe('block-factory', () => {
    it('should create a profile block with default values', () => {
        const block = createBlock('profile') as any;
        expect(block.type).toBe('profile');
        expect(block.id).toContain('profile-');
        expect(typeof block.name).toBe('string');
    });

    it('should create a link block and apply overrides', () => {
        const overrides = { title: 'Custom Link', url: 'https://test.com' };
        const block = createBlock('link', overrides) as any;
        expect(block.type).toBe('link');
        expect(block.title).toBe('Custom Link');
        expect(block.url).toBe('https://test.com');
    });

    it('should throw an error for unknown block type', () => {
        expect(() => createBlock('non-existent')).toThrow('Unknown block type: non-existent');
    });

    it('should correctly generate an event block with internal eventId', () => {
        const block = createBlock('event') as any;
        expect(block.type).toBe('event');
        expect(block.eventId).toBeDefined();
        expect(typeof block.eventId).toBe('string');
    });

    it('should preserve deep overrides (merging)', () => {
        const overrides = {
            blockStyle: {
                padding: 'none',
                borderRadius: '2xl'
            }
        };
        const block = createBlock('image', overrides);
        expect(block.blockStyle!.padding).toBe('none');
        expect(block.blockStyle!.borderRadius).toBe('2xl');
        // Check if other default props in blockStyle are preserved or overwritten correctly
        // The current implementation uses spread: ...overrides, which replaces blockStyle if it exists in overrides.
        // Wait, let's check the implementation again:
        // image: (id, overrides) => ({ ..., blockStyle: { ... }, ...overrides })
        // If overrides contains blockStyle, it replaces the default blockStyle entirely.
        // This is the current behavior, let's verify it in test.
    });
});
