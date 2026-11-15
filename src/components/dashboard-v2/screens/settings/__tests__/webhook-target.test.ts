import { describe, expect, it } from 'vitest';
import { selectPublicIPv4 } from '../../../../../../supabase/functions/_shared/webhook-target';

describe('webhook target addresses', () => {
  it('rejects private, reserved and mixed DNS responses', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '172.16.1.1', '192.168.1.1', '100.64.0.1', '192.0.2.1', '198.18.0.1', '224.0.0.1']) {
      expect(selectPublicIPv4([address])).toBeNull();
    }
    expect(selectPublicIPv4(['8.8.8.8', '10.0.0.1'])).toBeNull();
  });

  it('selects a validated public address to use for the connection', () => {
    expect(selectPublicIPv4(['8.8.8.8'])).toBe('8.8.8.8');
    expect(selectPublicIPv4([])).toBeNull();
  });
});
