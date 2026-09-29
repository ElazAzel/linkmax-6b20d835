import { describe, expect, it } from 'vitest';
import { isMissingSchemaError } from './missing-schema';

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
