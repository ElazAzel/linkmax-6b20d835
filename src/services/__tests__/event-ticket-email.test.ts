import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEventTicketEmail } from '../event-ticket-email';
import { deliverTicketEmail } from '../../../supabase/functions/_shared/event-ticket-delivery';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/platform/supabase/client', () => ({ supabase: { functions: { invoke } } }));

const receipt = { registrationId: 'registration', eventId: 'event', attendeeEmail: 'test@example.com', notifyToken: 'private', language: 'ru' };
beforeEach(() => vi.clearAllMocks());

describe('event ticket email', () => {
  it.each([{ data: { success: false }, error: null }, { data: null, error: new Error('offline') }])('does not report a failed email as sent', async result => {
    invoke.mockResolvedValue(result);
    await expect(sendEventTicketEmail(receipt)).rejects.toThrow('event_ticket_email_failed');
  });
  it('passes the registration proof and accepts a provider acknowledgement', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });
    await sendEventTicketEmail(receipt);
    expect(invoke).toHaveBeenCalledWith('send-attendee-email', { body: receipt });
  });
  it('keeps failed provider requests retryable without marking them delivered', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValue(new Response('{"id":"mail-1"}'));
    const markAccepted = vi.fn();
    const options = { apiKey: 'test', key: 'event-ticket/registration/confirmed', message: { from: 'events@example.com', to: ['test@example.com'], subject: 'Ticket', html: '<p>Ticket</p>' }, markAccepted, fetcher };
    await expect(deliverTicketEmail(options)).rejects.toThrow('email_provider_rejected');
    expect(markAccepted).not.toHaveBeenCalled();
    await expect(deliverTicketEmail(options)).resolves.toBe('mail-1');
    expect(markAccepted).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls.map(([, args]) => args.headers['Idempotency-Key'])).toEqual([options.key, options.key]);
  });
});
