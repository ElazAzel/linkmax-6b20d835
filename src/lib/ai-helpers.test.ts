import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/platform/supabase/client';
import { generateMagicTitle } from './ai-helpers';

vi.mock('@/platform/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

describe('AI output handling', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockReset();
  });

  it('preserves model wording and emoji instead of applying semantic rewrites automatically', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { result: '✨ Стрижка является услугой для вашего образа' },
      error: null,
    } as never);

    await expect(generateMagicTitle('https://example.com')).resolves.toBe(
      '✨ Стрижка является услугой для вашего образа',
    );
  });
});

