/**
 * Calendar utilities for generating .ics files
 * Supports event export to calendar apps
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: string; // ISO date string
  endAt?: string; // ISO date string
  timezone?: string;
}

/**
 * Generate ICS file content for a calendar event
 */
export function generateICS(event: CalendarEvent): string {
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@lnkmx.my`;
  const now = formatDate(new Date().toISOString());
  const start = formatDate(event.startAt);
  const end = event.endAt 
    ? formatDate(event.endAt) 
    : formatDate(new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000).toISOString()); // +1 hour default

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LinkMAX//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download ICS file
 */
export function downloadICS(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (isoDate: string): string => {
    return new Date(isoDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatGoogleDate(event.startAt);
  const end = event.endAt 
    ? formatGoogleDate(event.endAt)
    : formatGoogleDate(new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000).toISOString());

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (web)
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startAt,
    enddt: event.endAt || new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000).toISOString(),
    ...(event.description && { body: event.description }),
    ...(event.location && { location: event.location }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
