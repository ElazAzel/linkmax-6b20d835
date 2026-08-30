export type NotificationChannel = 'telegram' | 'email';

function localPartsAt(instantMs: number, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instantMs));
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

function zonedLocalTimeToUtc(date: string, time: string, timeZone: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidate = targetAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = localPartsAt(candidate, timeZone);
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const correction = targetAsUtc - representedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }

  return candidate;
}

export function reminderScheduledAt(slotDate: string, slotTime: string, timeZone: string): string {
  const bookingInstant = zonedLocalTimeToUtc(slotDate, slotTime, timeZone);
  return new Date(bookingInstant - 24 * 60 * 60 * 1000).toISOString();
}

export function bookingReminderIdempotencyKey(
  bookingId: string,
  channel: NotificationChannel,
  scheduledAt: string,
): string {
  return `booking:${bookingId}:reminder_24h:${channel}:${scheduledAt}`;
}
