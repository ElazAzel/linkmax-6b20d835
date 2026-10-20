import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { EventBlock } from '../EventBlock';
import type { EventBlock as EventBlockType } from '@/types/page';

const { send, insert } = vi.hoisted(() => ({ send: vi.fn(), insert: vi.fn() }));
vi.mock('@/services/event-ticket-email', () => ({ sendEventTicketEmail: send }));
vi.mock('@/services/events', () => ({ getEventRegistrationCount: vi.fn().mockResolvedValue(0), isEmailRegistered: vi.fn().mockResolvedValue(false) }));
vi.mock('@/hooks/user/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/analytics/useAnalyticsTracking', () => ({ useAnalytics: () => ({ onBlockClick: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, fallback: string) => fallback || key, i18n: { language: 'ru' } }) }));
vi.mock('@/platform/supabase/client', () => ({ supabase: {
  auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  from: () => ({ insert, select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { ticket_code: 'TICKET' } }) }) }) }),
} }));

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockReturnValue({ select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'registration', notify_token: 'proof' }, error: null }) }) });
});

it('sends a guest ticket without Pro and retries a failed email without registering twice', async () => {
  send.mockRejectedValueOnce(new Error('provider unavailable')).mockResolvedValue(undefined);
  const block: EventBlockType = { id: 'block', type: 'event', eventId: 'event', title: { ru: 'Meeting' }, timezone: 'Asia/Almaty', status: 'published', formFields: [], settings: {} };
  render(<EventBlock block={block} pageId="page" pageOwnerId="owner" isOwnerPremium={false} />);
  fireEvent.click(screen.getByRole('button'));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(/Email/), { target: { value: 'guest@example.com' } });
  fireEvent.submit(dialog.querySelector('form')!);
  const retry = await within(dialog).findByRole('button', { name: 'Отправить письмо ещё раз' });
  expect(send).toHaveBeenCalledWith({ registrationId: 'registration', eventId: 'event', attendeeEmail: 'guest@example.com', notifyToken: 'proof', language: 'ru' });
  fireEvent.click(retry);
  await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Письмо отправлено'));
  expect(insert).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(2);
});
