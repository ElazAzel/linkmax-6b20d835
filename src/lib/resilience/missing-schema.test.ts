import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isFeatureSchemaMissing,
  isMissingSchemaError,
  noteFeatureSchemaError,
  resetFeatureSchemaState,
} from './missing-schema';

describe('isMissingSchemaError', () => {
  it.each(['42P01', '42883', '42703', 'PGRST202', 'PGRST204', 'PGRST205'])('recognises %s', (code) => {
    expect(isMissingSchemaError({ code, message: 'x' })).toBe(true);
  });

  it('ignores permission, data and network errors', () => {
    expect(isMissingSchemaError({ code: '42501' })).toBe(false);
    expect(isMissingSchemaError({ code: '23505' })).toBe(false);
    expect(isMissingSchemaError(new Error('Failed to fetch'))).toBe(false);
    expect(isMissingSchemaError(null)).toBe(false);
  });
});

describe('missing feature registry', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetFeatureSchemaState();
  });

  it('remembers a missing table across a reload and forgets it after a day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T10:00:00Z'));
    noteFeatureSchemaError('demo', { code: 'PGRST205' });
    expect(isFeatureSchemaMissing('demo')).toBe(true);

    // Same tab, just before and after the 24h boundary.
    vi.setSystemTime(new Date('2026-10-18T09:59:00Z'));
    expect(isFeatureSchemaMissing('demo')).toBe(true);
    vi.setSystemTime(new Date('2026-10-18T10:01:00Z'));
    expect(isFeatureSchemaMissing('demo')).toBe(false);
  });

  it('ignores errors that are not about missing schema', () => {
    noteFeatureSchemaError('demo', { code: '42501' });
    expect(isFeatureSchemaMissing('demo')).toBe(false);
  });
});
