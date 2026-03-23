import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as UserService from '../user';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        })),
    },
}));

describe('UserService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateUsername', () => {
        it('should validate correct username', () => {
            expect(UserService.validateUsername('valid_user')).toEqual({ valid: true });
        });

        it('should reject too short username', () => {
            const result = UserService.validateUsername('ab');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('3 characters');
        });

        it('should reject invalid characters', () => {
            const result = UserService.validateUsername('invalid user!');
            expect(result.valid).toBe(false);
        });
    });

    describe('API Functions', () => {
        it('should load user profile', async () => {
            const mockUser = { id: 'u1', username: 'test' };
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            } as any);

            const result = await UserService.loadUserProfile('u1');
            expect(result.data).toEqual(mockUser);
        });

        it('should check username availability', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            } as any);

            const available = await UserService.checkUsernameAvailability('newuser', 'u1');
            expect(available).toBe(true);
        });

        it('should update username', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // available
                upsert: vi.fn().mockResolvedValue({ error: null }), // profile update
                update: vi.fn().mockReturnThis(), // page sync
            } as any);

            const result = await UserService.updateUsername('u1', 'validuser');
            expect(result.success).toBe(true);
        });

        it('should check premium status', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ 
                    data: { trial_ends_at: futureDate.toISOString(), premium_tier: 'pro', is_premium: true }, 
                    error: null 
                }),
            } as any);

            const status = await UserService.checkPremiumStatus('u1');
            expect(status.isPremium).toBe(true);
            expect(status.tier).toBe('pro');
        });

        it('should handle expired premium correctly', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 7);
            
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ 
                    data: { is_premium: true, premium_expires_at: pastDate.toISOString(), premium_tier: 'pro' }, 
                    error: null 
                }),
            } as any);

            const status = await UserService.checkPremiumStatus('u1');
            expect(status.isPremium).toBe(false);
        });

        it('should return default status on database error', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
            } as any);

            const status = await UserService.checkPremiumStatus('u1');
            expect(status.isPremium).toBe(false);
            expect(status.tier).toBe('identity');
        });
    });

    describe('Username Validation Errors', () => {
        it('should return error for empty username', async () => {
             const result = await UserService.updateUsername('u1', '');
             expect(result.success).toBe(false);
             expect(result.error).toBe('Username is required');
        });

        it('should return error if username is taken', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'other-user' }, error: null }),
            } as any);

            const result = await UserService.updateUsername('u1', 'takenuser');
            expect(result.success).toBe(false);
            expect(result.error).toBe('This username is already taken');
        });

        it('should return error if profile update fails', async () => {
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // available
                upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert Error' } }),
            } as any);

            const result = await UserService.updateUsername('u1', 'validuser');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to update username');
        });
    });
});
