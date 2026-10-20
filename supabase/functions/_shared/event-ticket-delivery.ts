interface TicketMessage {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

/** Persist delivery only after the provider acknowledges it. Retries reuse the same key. */
export async function deliverTicketEmail(options: {
  apiKey: string;
  key: string;
  message: TicketMessage;
  markAccepted: () => Promise<void>;
  fetcher?: typeof fetch;
}): Promise<string> {
  const response = await (options.fetcher ?? fetch)('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': options.key },
    body: JSON.stringify(options.message),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as { id?: string };
  if (!response.ok || !result.id) throw new Error('email_provider_rejected');
  await options.markAccepted();
  return result.id;
}
