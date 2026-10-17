import { describe, expect, it } from 'vitest';
import type { Block } from '@/types/page';
import { extractPageContacts } from '../page-contacts';

describe('extractPageContacts', () => {
  it('keeps one contact per platform, messenger blocks first', () => {
    const blocks = [
      { id: 'l', type: 'link', url: 'https://t.me/channel_name', title: 'Канал' },
      { id: 'm', type: 'messenger', messengers: [{ platform: 'telegram', username: '@owner' }, { platform: 'whatsapp', username: '8 701 123 45 67' }] },
    ] as unknown as Block[];
    const contacts = extractPageContacts(blocks, 'ru');
    expect(contacts.map((c) => c.platform)).toEqual(['whatsapp', 'telegram']);
    expect(contacts[0].handle).toBe('77011234567');
    expect(contacts[1].href).toBe('https://t.me/owner');
  });

  it('skips contacts scheduled out of view', () => {
    const blocks = [
      { id: 'm', type: 'messenger', schedule: { endDate: '2020-01-01' }, messengers: [{ platform: 'whatsapp', username: '77011234567' }] },
    ] as unknown as Block[];
    expect(extractPageContacts(blocks, 'ru')).toEqual([]);
  });
});
