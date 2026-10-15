import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/platform/supabase/client';
import { startProTrial, updateTelegramNotifications } from '../user';

const backend = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock('@/platform/supabase/client', () => ({
  supabase: { rpc: backend.rpc, from: backend.from },
}));

beforeEach(() => {
  vi.resetAllMocks();
  backend.from.mockReturnValue({ update: backend.update });
  backend.update.mockReturnValue({ eq: backend.eq });
  backend.eq.mockResolvedValue({ error: null });
});

describe('Pro trial eligibility', () => {
  it('returns the server expiry and preserves the RPC client context', async () => {
    backend.rpc.mockImplementation(function (this: unknown) {
      expect(this).toBe(supabase);
      return Promise.resolve({ data: { ok: true, trial_ends_at: '2030-01-08T00:00:00Z' }, error: null });
    });

    expect(await startProTrial()).toEqual({ ok: true, trialEndsAt: '2030-01-08T00:00:00Z' });
    expect(backend.rpc).toHaveBeenCalledWith('start_pro_trial');
  });

  it.each(['trial_already_used', 'already_premium', 'unauthenticated', 'no_profile'])(
    'preserves the server denial: %s',
    async (error) => {
      backend.rpc.mockResolvedValue({ data: { ok: false, error }, error: null });
      expect(await startProTrial()).toEqual({ ok: false, error });
    },
  );

  it.each([null, { ok: true }])('fails closed for incomplete eligibility data: %j', async (data) => {
    backend.rpc.mockResolvedValue({ data, error: null });
    expect(await startProTrial()).toEqual({ ok: false, error: 'unknown' });
  });

  it('does not activate a trial when the RPC returns an error', async () => {
    backend.rpc.mockResolvedValue({ data: null, error: { message: 'offline' } });
    expect(await startProTrial()).toEqual({ ok: false, error: 'unknown' });
  });

  it('does not activate a trial when the transport throws', async () => {
    backend.rpc.mockRejectedValue(new Error('offline'));
    expect(await startProTrial()).toEqual({ ok: false, error: 'unknown' });
  });
});

describe('Telegram notification settings', () => {
  it('keeps the linked chat when notifications are disabled', async () => {
    expect(await updateTelegramNotifications('user-1', false)).toEqual({ data: false, error: null });
    expect(backend.update).toHaveBeenCalledWith({ telegram_notifications_enabled: false });
    expect(backend.from).toHaveBeenCalledWith('user_profiles');
    expect(backend.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('stores the chat when linking notifications', async () => {
    expect(await updateTelegramNotifications('user-1', true, 'chat-1')).toEqual({ data: true, error: null });
    expect(backend.update).toHaveBeenCalledWith({ telegram_notifications_enabled: true, telegram_chat_id: 'chat-1' });
  });

  it('unlinks the chat only when explicitly requested', async () => {
    await updateTelegramNotifications('user-1', false, null);
    expect(backend.update).toHaveBeenCalledWith({ telegram_notifications_enabled: false, telegram_chat_id: null });
  });

  it('reports a rejected preference update instead of success', async () => {
    backend.eq.mockResolvedValue({ error: { message: 'access denied' } });
    const result = await updateTelegramNotifications('user-1', true);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('access denied');
  });

  it('reports a transport failure instead of success', async () => {
    backend.eq.mockRejectedValue(new Error('offline'));
    const result = await updateTelegramNotifications('user-1', true);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('offline');
  });
});
