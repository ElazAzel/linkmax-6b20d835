import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLanguageUpload } from '../useLanguageUpload';
import { upsertToDB, applyTranslationsToI18n } from '@/lib/i18n-db-backend';
import { toast } from 'sonner';

vi.mock('@/i18n/config', () => ({ default: {}, SUPPORTED_LANGUAGES: ['ru', 'en', 'kk', 'uz'] }));
vi.mock('@/platform/supabase/client', () => ({ supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } } }) } } }));
vi.mock('@/lib/i18n-db-backend', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/i18n-db-backend')>(),
  upsertToDB: vi.fn(), applyTranslationsToI18n: vi.fn(),
}));
vi.mock('@/hooks/useAppError', () => ({ useAppError: () => ({ handleError: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

describe('manual translation file application', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('writes normalized translations to the canonical table before reporting success', async () => {
    vi.mocked(upsertToDB).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLanguageUpload());
    let applied = false;
    await act(async () => { applied = await result.current.applyLanguage('uz', { translation: { common: { save: 'Existing manual text' } } }); });
    expect(applied).toBe(true);
    expect(upsertToDB).toHaveBeenCalledWith('uz', { common: { save: 'Existing manual text' } });
    expect(applyTranslationsToI18n).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('does not apply a locale or show success when the canonical write fails', async () => {
    vi.mocked(upsertToDB).mockRejectedValue(new Error('write denied'));
    const { result } = renderHook(() => useLanguageUpload());
    let applied = true;
    await act(async () => { applied = await result.current.applyLanguage('uz', { common: { save: 'Manual text' } }); });
    expect(applied).toBe(false);
    expect(applyTranslationsToI18n).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('rejects invalid value types before attempting a write', async () => {
    const { result } = renderHook(() => useLanguageUpload());
    await act(async () => { expect(await result.current.applyLanguage('en', { common: { save: 42 } })).toBe(false); });
    expect(upsertToDB).not.toHaveBeenCalled();
  });

  it('rejects unsupported locales before attempting a write', async () => {
    const { result } = renderHook(() => useLanguageUpload());
    await act(async () => { expect(await result.current.applyLanguage('xx', { save: 'Manual text' })).toBe(false); });
    expect(upsertToDB).not.toHaveBeenCalled();
  });
});
