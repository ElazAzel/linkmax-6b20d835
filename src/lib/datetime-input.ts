import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export function toDateTimeInput(value?: string, timeZone?: string): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (timeZone) return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm");
    const pad = (part: number) => String(part).padStart(2, '0');
    if (!Number.isFinite(date.getTime())) return '';
    return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return '';
  }
}

/** Incomplete/invalid native input values must never replace a saved instant. */
export function fromDateTimeInput(value: string, timeZone?: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined;
  try {
    const date = timeZone ? fromZonedTime(value, timeZone) : new Date(value);
    if (!Number.isFinite(date.getTime()) || toDateTimeInput(date.toISOString(), timeZone) !== value) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}
