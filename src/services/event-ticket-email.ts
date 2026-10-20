import { supabase } from '@/platform/supabase/client';

export interface EventTicketEmailReceipt {
  registrationId: string;
  eventId: string;
  attendeeEmail: string;
  notifyToken: string;
  language: string;
}

export async function sendEventTicketEmail(receipt: EventTicketEmailReceipt): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-attendee-email', { body: receipt });
  // Functions.invoke resolves even for application failures returned with HTTP 200.
  if (error || data?.success !== true) throw new Error('event_ticket_email_failed');
}
