import { describe, expect, it } from 'vitest';
import { NEW_USER_BUILDER_ROUTE } from '../routes';

describe('new account landing route', () => {
  it('lands in the dashboard home without selecting the editor', () => {
    expect(NEW_USER_BUILDER_ROUTE).toBe('/dashboard/home?welcome=1');
    expect(NEW_USER_BUILDER_ROUTE).not.toContain('tab=editor');
  });
});
