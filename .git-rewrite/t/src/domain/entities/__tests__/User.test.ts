/**
 * Unit tests for User domain entity
 */
import { describe, it, expect } from 'vitest';
import {
  validateUsername,
  normalizeUsername,
  calculatePremiumStatus,
  canAccessPremiumFeatures,
  isTrialExpiringSoon,
  getUserLimits,
  type UserProfile,
  FREE_TIER_LIMITS,
  PRO_TIER_LIMITS,
  BUSINESS_TIER_LIMITS,
} from '@/domain/entities/User';

describe('User Entity', () => {
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('john_doe').valid).toBe(true);
      expect(validateUsername('user123').valid).toBe(true);
      expect(validateUsername('my-page').valid).toBe(true);
    });

    it('should reject empty usernames', () => {
      expect(validateUsername('').valid).toBe(false);
      expect(validateUsername('   ').valid).toBe(false);
    });

    it('should reject too short usernames', () => {
      expect(validateUsername('ab').valid).toBe(false);
      expect(validateUsername('ab').error).toContain('at least 3');
    });

    it('should reject too long usernames', () => {
      const longUsername = 'a'.repeat(31);
      expect(validateUsername(longUsername).valid).toBe(false);
      expect(validateUsername(longUsername).error).toContain('less than 30');
    });

    it('should reject usernames with uppercase letters', () => {
      expect(validateUsername('JohnDoe').valid).toBe(false);
    });

    it('should reject usernames with special characters', () => {
      expect(validateUsername('john@doe').valid).toBe(false);
      expect(validateUsername('john doe').valid).toBe(false);
      expect(validateUsername('john.doe').valid).toBe(false);
    });
  });

  describe('normalizeUsername', () => {
    it('should convert to lowercase', () => {
      expect(normalizeUsername('JohnDoe')).toBe('johndoe');
    });

    it('should trim whitespace', () => {
      expect(normalizeUsername('  john  ')).toBe('john');
    });
  });

  describe('calculatePremiumStatus', () => {
    it('should return non-premium for null profile', () => {
      const status = calculatePremiumStatus(null);
      expect(status.isPremium).toBe(false);
      expect(status.inTrial).toBe(false);
    });

    it('should return premium for is_premium users', () => {
      const profile: UserProfile = {
        id: '1',
        username: 'test',
        displayName: null,
        bio: null,
        avatarUrl: null,
        isPremium: true,
        trialEndsAt: null,
      };
      const status = calculatePremiumStatus(profile);
      expect(status.isPremium).toBe(true);
      expect(status.inTrial).toBe(false);
    });

    it('should return in trial when trial is active', () => {
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString(); // 5 days from now
      const profile: UserProfile = {
        id: '1',
        username: 'test',
        displayName: null,
        bio: null,
        avatarUrl: null,
        isPremium: false,
        trialEndsAt: futureDate,
      };
      const status = calculatePremiumStatus(profile);
      expect(status.isPremium).toBe(true);
      expect(status.inTrial).toBe(true);
      expect(status.daysRemaining).toBe(5);
    });

    it('should return expired when trial has ended', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const profile: UserProfile = {
        id: '1',
        username: 'test',
        displayName: null,
        bio: null,
        avatarUrl: null,
        isPremium: false,
        trialEndsAt: pastDate,
      };
      const status = calculatePremiumStatus(profile);
      expect(status.isPremium).toBe(false);
      expect(status.inTrial).toBe(false);
    });
  });

  describe('canAccessPremiumFeatures', () => {
    it('should return true for premium users', () => {
      expect(canAccessPremiumFeatures({ isPremium: true, inTrial: false, trialEndsAt: null })).toBe(true);
    });

    it('should return false for non-premium users', () => {
      expect(canAccessPremiumFeatures({ isPremium: false, inTrial: false, trialEndsAt: null })).toBe(false);
    });
  });

  describe('isTrialExpiringSoon', () => {
    it('should return true when trial ends within 24 hours', () => {
      expect(isTrialExpiringSoon({ isPremium: true, inTrial: true, trialEndsAt: 'date', daysRemaining: 1 })).toBe(true);
    });

    it('should return false when trial has more days', () => {
      expect(isTrialExpiringSoon({ isPremium: true, inTrial: true, trialEndsAt: 'date', daysRemaining: 5 })).toBe(false);
    });

    it('should return false when not in trial', () => {
      expect(isTrialExpiringSoon({ isPremium: true, inTrial: false, trialEndsAt: null })).toBe(false);
    });
  });

  describe('getUserLimits', () => {
    it('should return business limits for business users', () => {
      const limits = getUserLimits({ isPremium: true, inTrial: false, trialEndsAt: null, tier: 'business' });
      expect(limits).toEqual(BUSINESS_TIER_LIMITS);
    });

    it('should return pro limits for pro users', () => {
      const limits = getUserLimits({ isPremium: true, inTrial: false, trialEndsAt: null, tier: 'pro' });
      expect(limits).toEqual(PRO_TIER_LIMITS);
    });

    it('should return free limits for non-premium users', () => {
      const limits = getUserLimits({ isPremium: false, inTrial: false, trialEndsAt: null, tier: 'free' });
      expect(limits).toEqual(FREE_TIER_LIMITS);
    });
  });
});
