import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SocialsBlock } from '../SocialsBlock';
import { BRAND_ICONS } from '@/lib/social/brand-icon-data';
import type { SocialsBlock as SocialsBlockType } from '@/types/page';

const block = (platforms: SocialsBlockType['platforms'], extra: Partial<SocialsBlockType> = {}) =>
  ({ id: 's', type: 'socials', platforms, ...extra }) as SocialsBlockType;

const pathOf = (button: HTMLElement) => button.querySelector('svg path')?.getAttribute('d');

describe('SocialsBlock icons', () => {
  it('picks the brand icon from the link even when only `platform` was saved', () => {
    render(<SocialsBlock block={block([
      { id: '1', platform: 'instagram', url: 'https://instagram.com/a' },
      { id: '2', platform: 'instagram', url: 'https://t.me/a' },
      { id: '3', platform: 'whatsapp', url: 'https://wa.me/7701' },
    ])} />);

    expect(pathOf(screen.getByRole('button', { name: 'Instagram' }))).toBe(BRAND_ICONS.instagram.path);
    expect(pathOf(screen.getByRole('button', { name: 'Telegram' }))).toBe(BRAND_ICONS.telegram.path);
    expect(pathOf(screen.getByRole('button', { name: 'WhatsApp' }))).toBe(BRAND_ICONS.whatsapp.path);
  });

  it('uses the owner icon image when set', () => {
    const { container } = render(<SocialsBlock block={block([
      { id: '1', url: 'https://t.me/a', customIconUrl: 'https://cdn.example/icon.png' },
    ])} />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example/icon.png');
  });

  it('falls back to the site favicon for unknown domains', () => {
    const { container } = render(<SocialsBlock block={block([{ id: '1', url: 'https://aigerim-nails.kz' }])} />);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('aigerim-nails.kz');
  });

  it('brand style colours the icon; list layout shows names', () => {
    render(<SocialsBlock block={block([{ id: '1', url: 'https://t.me/a' }], { iconStyle: 'brand', layout: 'list' })} />);
    const button = screen.getByRole('button', { name: 'Telegram' });
    expect((button.querySelector('span') as HTMLElement).style.color).toBe('rgb(38, 165, 228)');
    expect(button).toHaveTextContent('Telegram');
  });
});
