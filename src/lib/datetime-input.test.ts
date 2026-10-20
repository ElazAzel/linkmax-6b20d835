import { describe, expect, it } from 'vitest';
import { fromDateTimeInput, toDateTimeInput } from './datetime-input';

describe('datetime inputs', () => {
  it('round-trips event wall time without accumulating UTC shifts', () => {
    let instant = '2026-10-20T10:30:00.000Z';
    for (let i = 0; i < 5; i++) {
      const local = toDateTimeInput(instant, 'Asia/Almaty');
      expect(local).toBe('2026-10-20T15:30');
      instant = fromDateTimeInput(local, 'Asia/Almaty')!;
      expect(instant).toBe('2026-10-20T10:30:00.000Z');
    }
  });
  it('uses the browser timezone when no event timezone exists', () => {
    const instant = new Date(2026, 9, 20, 15, 30).toISOString();
    expect(toDateTimeInput(instant)).toBe('2026-10-20T15:30');
    expect(fromDateTimeInput('2026-10-20T15:30')).toBe(instant);
  });
  it('handles day rollover and daylight saving offsets', () => {
    expect(toDateTimeInput('2026-01-01T01:30:00Z', 'America/New_York')).toBe('2025-12-31T20:30');
    expect(fromDateTimeInput('2026-07-01T12:00', 'America/New_York')).toBe('2026-07-01T16:00:00.000Z');
    expect(fromDateTimeInput('2026-03-08T02:30', 'America/New_York')).toBeUndefined();
  });
  it('rejects incomplete and invalid edits without throwing', () => {
    for (const value of ['', '2026-10', 'invalid', '2026-02-30T15:30']) {
      expect(fromDateTimeInput(value, 'Asia/Almaty')).toBeUndefined();
    }
    expect(toDateTimeInput('invalid')).toBe('');
    expect(toDateTimeInput('invalid', 'Asia/Almaty')).toBe('');
  });
});
