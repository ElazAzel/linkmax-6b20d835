import { describe, expect, it } from 'vitest';
import {
  FEATURE_FLAG_KEYS,
  evaluateFeatureFlag,
  isKnownFeatureFlagKey,
} from '../feature-flags';

const enabledFlag = {
  key: 'booking_v2_enabled',
  isEnabled: true,
  defaultEnabled: false,
  rolloutPercentage: 0,
  startsAt: null,
  endsAt: null,
  rules: [],
};

describe('feature flags', () => {
  it('keeps a flag disabled when the master switch is off', () => {
    expect(evaluateFeatureFlag({
      ...enabledFlag,
      isEnabled: false,
      defaultEnabled: true,
      rolloutPercentage: 100,
    }, { userId: 'user-1' })).toBe(false);
  });

  it('uses default enabled when no targeting rules are present', () => {
    expect(evaluateFeatureFlag({
      ...enabledFlag,
      defaultEnabled: true,
    })).toBe(true);
  });

  it('enables a flag for matching tier and role rules', () => {
    const flag = {
      ...enabledFlag,
      rules: [
        {
          ruleType: 'tier' as const,
          operator: 'in' as const,
          values: ['starter', 'pro'],
          rolloutPercentage: null,
          priority: 10,
          isEnabled: true,
        },
        {
          ruleType: 'role' as const,
          operator: 'in' as const,
          values: ['admin'],
          rolloutPercentage: null,
          priority: 20,
          isEnabled: true,
        },
      ],
    };

    expect(evaluateFeatureFlag(flag, { tier: 'pro' })).toBe(true);
    expect(evaluateFeatureFlag(flag, { roles: ['admin'] })).toBe(true);
    expect(evaluateFeatureFlag(flag, { tier: 'identity', roles: ['user'] })).toBe(false);
  });

  it('supports percentage rollouts without enabling anonymous users accidentally', () => {
    expect(evaluateFeatureFlag({
      ...enabledFlag,
      rolloutPercentage: 100,
    })).toBe(true);

    expect(evaluateFeatureFlag({
      ...enabledFlag,
      rolloutPercentage: 50,
    })).toBe(false);
  });

  it('honors rollout windows', () => {
    expect(evaluateFeatureFlag({
      ...enabledFlag,
      defaultEnabled: true,
      startsAt: '2026-07-02T00:00:00.000Z',
    }, { now: '2026-07-01T12:00:00.000Z' })).toBe(false);

    expect(evaluateFeatureFlag({
      ...enabledFlag,
      defaultEnabled: true,
      endsAt: '2026-07-01T12:00:00.000Z',
    }, { now: '2026-07-01T12:00:00.000Z' })).toBe(false);
  });

  it('recognizes the canonical LinkMAX rollout keys', () => {
    expect(FEATURE_FLAG_KEYS).toContain('developer_portal_v2_enabled');
    expect(isKnownFeatureFlagKey('booking_v2_enabled')).toBe(true);
    expect(isKnownFeatureFlagKey('unknown_external_tool')).toBe(false);
  });
});
