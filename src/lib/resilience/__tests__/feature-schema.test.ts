import { beforeEach, describe, expect, it } from 'vitest';

import { isFeatureSchemaMissing, noteFeatureSchemaError, resetFeatureSchemaState } from '../missing-schema';

describe('feature schema breaker', () => {
  beforeEach(() => resetFeatureSchemaState());

  it('remembers a feature after a missing-table error', () => {
    noteFeatureSchemaError('expert_queries', { code: 'PGRST205', message: 'missing' });
    expect(isFeatureSchemaMissing('expert_queries')).toBe(true);
    expect(isFeatureSchemaMissing('other')).toBe(false);
  });

  it('ignores transient errors', () => {
    noteFeatureSchemaError('expert_queries', { code: '08006', message: 'connection' });
    expect(isFeatureSchemaMissing('expert_queries')).toBe(false);
  });
});
