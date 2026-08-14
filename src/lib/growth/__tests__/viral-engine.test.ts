import { describe, expect, it } from 'vitest';
import { calculateViralKFactor, calculateViralReadiness, getViralReadinessLabel } from '@/lib/growth/viral-engine';
import { addGrowthUtm } from '@/services/viral-growth';

describe('viral engine', () => {
  it('scores a deterministic page from its persisted blocks', () => {
    const result = calculateViralReadiness({
      blocks: [
        { id: 'profile', type: 'profile', name: 'Name', bio: 'Bio' },
        { id: 'product', type: 'product', name: 'Offer', description: 'Description', price: 10, currency: 'USD' },
        { id: 'button', type: 'button', title: 'Buy', url: '#' },
        { id: 'testimonial', type: 'testimonial', quote: 'Great', author: 'A' } as any,
      ],
      integrations: {},
      isPublished: true,
    });

    expect(result.score).toBe(75);
    expect(result.dimensions.find((dimension) => dimension.key === 'identity')?.present).toBe(true);
    expect(result.nextActions).toContain('communication');
    expect(getViralReadinessLabel(result.score)).toBe('ready');
  });

  it('calculates K as invites per active user times invite conversion', () => {
    const result = calculateViralKFactor({ invitesSent: 8, attributedSignups: 2, activeUsers: 4 });
    expect(result.invitesPerActiveUser).toBe(2);
    expect(result.inviteToSignupRate).toBe(0.25);
    expect(result.kFactor).toBe(0.5);
  });

  it('guards against invalid and zero denominators', () => {
    expect(calculateViralKFactor({ invitesSent: -1, attributedSignups: 4, activeUsers: 0 })).toEqual({
      invitesPerActiveUser: 0,
      inviteToSignupRate: 0,
      kFactor: 0,
    });
  });

  it('builds stable campaign variants without dropping the referral path', () => {
    const variant = addGrowthUtm('https://lnkmx.my/r/abc12345', 'instagram');
    expect(variant).toContain('/r/abc12345');
    expect(variant).toContain('utm_source=instagram');
    expect(variant).toContain('utm_medium=social');
  });
});
