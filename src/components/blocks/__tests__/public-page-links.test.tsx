import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ensureBlockIds } from '@/lib/blocks/block-ids';
import { messengerPhoneDigits, whatsappHref } from '@/lib/blocks/messenger-links';
import { canonicalSocialUrl, imageAltText } from '@/lib/blocks/safe-href';
import { extractAiCta } from '@/lib/seo/ai-cta-extractor';
import { pickOgImage } from '@/lib/seo/public-page-seo';
import { FAQBlock } from '@/components/blocks/FAQBlock';
import type { Block, FAQBlock as FAQBlockType } from '@/types/page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, f?: string) => f ?? _k, i18n: { language: 'ru' } }),
}));

describe('messenger links (lnkmx.my/entrepreneurshipalmau, /elazart)', () => {
  it('turns local 8-prefixed and +7 numbers into wa.me digits', () => {
    expect(messengerPhoneDigits('87067066521')).toBe('77067066521');
    expect(messengerPhoneDigits('+7 705 109-76-64')).toBe('77051097664');
    expect(messengerPhoneDigits('+852 1234 5678 9')).toBe('852123456789');
    expect(messengerPhoneDigits('+8 700 123 45 67')).toBe('87001234567');
  });

  it('never sends "[object Object]" as the WhatsApp message', () => {
    const href = whatsappHref('87067066521', { ru: 'Добрый день!', en: 'Hello!' }, 'en');
    expect(href).toBe('https://wa.me/77067066521?text=Hello!');
    expect(whatsappHref('+77051097664', undefined, 'ru')).toBe('https://wa.me/77051097664');
  });

  it('crawler contacts show one plus and a working link', () => {
    const blocks = [{
      id: 'm', type: 'messenger',
      messengers: [{ platform: 'whatsapp', username: '+77051097664', message: { ru: 'Здравствуйте!' } }],
    }] as unknown as Block[];
    const contact = extractAiCta(blocks, 'elazart', 'ru').contacts[0];
    expect(contact.display).toBe('+77051097664');
    expect(contact.href).toBe(`https://wa.me/77051097664?text=${encodeURIComponent('Здравствуйте!')}`);
  });
});

describe('social and image links', () => {
  it('rewrites Telegram Web deep links to t.me', () => {
    expect(canonicalSocialUrl('https://web.telegram.org/#@Elazart')).toBe('https://t.me/Elazart');
    expect(canonicalSocialUrl('https://web.telegram.org/k/#@name_1')).toBe('https://t.me/name_1');
    expect(canonicalSocialUrl('https://instagram.com/elazart')).toBe('https://instagram.com/elazart');
  });

  it('replaces template alt text with the link domain, or leaves the image decorative', () => {
    expect(imageAltText('Beautiful workspace', 'https://www.lnkmx.my/')).toBe('lnkmx.my');
    expect(imageAltText('Beautiful workspace')).toBe('');
    expect(imageAltText('Наука ВСЕМ!', 'https://kstnews.kz/')).toBe('Наука ВСЕМ!');
  });

  it('prefers a still cover over a GIF avatar for link previews', () => {
    expect(pickOgImage([undefined, 'https://x/cover.jpg', 'https://x/avatar.gif'])).toBe('https://x/cover.jpg');
    expect(pickOgImage([undefined, undefined, 'https://x/avatar.gif'])).toBe('https://x/avatar.gif');
  });
});

describe('blocks saved without ids (lnkmx.my/psychologist_laura)', () => {
  it('gets stable, unique ids', () => {
    const blocks = ensureBlockIds([
      { type: 'text' }, { id: 'faq-1', type: 'text' }, { type: 'faq' },
    ] as unknown as Block[]);
    expect(blocks.map((b) => b.id)).toEqual(['text-0', 'faq-1', 'faq-2']);
    expect(ensureBlockIds(blocks)).toEqual(blocks);
  });

  it('opens FAQ answers whose items have no id', () => {
    const block = {
      id: 'faq', type: 'faq',
      items: [
        { question: 'Как проходит первая консультация?', answer: 'Знакомство и запрос.' },
        { question: 'Сколько сессий мне потребуется?', answer: 'Индивидуально.' },
      ],
    } as unknown as FAQBlockType;
    render(<FAQBlock block={block} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сколько сессий мне потребуется?' }));
    expect(screen.getByText('Индивидуально.')).toBeInTheDocument();
    expect(screen.queryByText('Знакомство и запрос.')).toBeNull();
  });
});
