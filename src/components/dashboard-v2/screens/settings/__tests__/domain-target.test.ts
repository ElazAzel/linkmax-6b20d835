import { expect, it } from 'vitest';
import { isPlatformDomain } from '../../../../../../supabase/functions/_shared/domain-target';

it('matches the platform hostname on a DNS label boundary', () => {
  expect(isPlatformDomain('lnkmx.my.')).toBe(true);
  expect(isPlatformDomain('edge.lnkmx.my')).toBe(true);
  expect(isPlatformDomain('notlnkmx.my')).toBe(false);
  expect(isPlatformDomain('lnkmx.my.example.com')).toBe(false);
});
