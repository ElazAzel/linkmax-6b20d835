import { RenderContextProvider } from '@/contexts/RenderContext';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardBlock } from '../CardBlock';
import { TilesBlock } from '../TilesBlock';
import { getSafeHref } from '@/lib/blocks/safe-href';
import { createBlock } from '@/lib/blocks/block-factory';
import { getBlockEditingConfig } from '@/lib/blocks/block-editing';
import type { CardBlock as CardBlockType, TilesBlock as TilesBlockType } from '@/types/page';

describe('getSafeHref', () => {
  it('keeps web, mail and phone links and adds https to bare domains', () => {
    expect(getSafeHref('https://example.com/a')).toBe('https://example.com/a');
    expect(getSafeHref('example.com')).toBe('https://example.com/');
    expect(getSafeHref('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(getSafeHref('tel:+77001234567')).toBe('tel:+77001234567');
  });

  it('drops scripts, data URLs and blanks', () => {
    expect(getSafeHref('javascript:alert(1)')).toBeUndefined();
    expect(getSafeHref('data:text/html,<b>x</b>')).toBeUndefined();
    expect(getSafeHref('   ')).toBeUndefined();
    expect(getSafeHref(undefined)).toBeUndefined();
  });
});

describe('CardBlock', () => {
  const card = (overrides: Partial<CardBlockType> = {}) => ({
    id: 'c1', type: 'card', title: 'Шоурум', text: 'Аль-Фараби 116', buttonText: 'Записаться', url: 'https://example.com/book', ...overrides,
  }) as CardBlockType;

  it('renders the copy and a tracked external button', () => {
    const onClick = vi.fn();
    render(<CardBlock block={card({ image: 'https://cdn.example.com/p.jpg' })} onClick={onClick} />);
    expect(screen.getByRole('heading', { name: 'Шоурум' })).toBeInTheDocument();
    const button = screen.getByRole('link', { name: /Записаться/ });
    expect(button).toHaveAttribute('href', 'https://example.com/book');
    expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('img', { name: 'Шоурум' })).toHaveAttribute('src', 'https://cdn.example.com/p.jpg');
  });

  it('makes the whole card the link when there is no button label', () => {
    render(<CardBlock block={card({ buttonText: '' })} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/book');
  });

  it('never links an unsafe URL', () => {
    const { container } = render(<CardBlock block={card({ url: 'javascript:alert(1)' })} />);
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('Записаться')).toBeInTheDocument();
  });
});

describe('TilesBlock', () => {
  it('renders each tile as a captioned link and keeps tiles without a URL as plain tiles', () => {
    const block = {
      id: 't1', type: 'tiles', title: 'Пресса', columns: 2,
      items: [
        { id: '1', title: 'ELLE', image: 'https://cdn.example.com/1.jpg', url: 'https://elle.kz/a' },
        { id: '2', title: 'Bazaar', image: '', url: '' },
        { id: '3', title: 'Bad', url: 'javascript:alert(1)' },
      ],
    } as TilesBlockType;
    const { container } = render(<RenderContextProvider value="editor"><TilesBlock block={block} /></RenderContextProvider>);
    expect(screen.getByRole('heading', { name: 'Пресса' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ELLE/ })).toHaveAttribute('href', 'https://elle.kz/a');
    expect(screen.getByText('Bazaar')).toBeInTheDocument();
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  it('shows visitors only the tiles that have a picture', () => {
    const block = {
      id: 't2', type: 'tiles', columns: 2,
      items: [
        { id: '1', title: 'ELLE', image: 'https://cdn.example.com/1.jpg', url: '' },
        { id: '2', title: 'Bazaar', image: '', url: '' },
      ],
    } as TilesBlockType;
    render(<TilesBlock block={block} />);
    expect(screen.getByText('ELLE')).toBeInTheDocument();
    expect(screen.queryByText('Bazaar')).not.toBeInTheDocument();
  });
});

describe('card and tiles block plumbing', () => {
  it('creates ready-to-edit defaults that pass validation', () => {
    const card = createBlock('card');
    const tiles = createBlock('tiles') as TilesBlockType;
    expect(card.type).toBe('card');
    expect(tiles.items.length).toBeGreaterThan(0);
    expect(getBlockEditingConfig('card').validate(card)).toBeNull();
    expect(getBlockEditingConfig('tiles').validate(tiles)).toBeNull();
  });

  it('rejects a card without a title and a tile with a broken URL', () => {
    expect(getBlockEditingConfig('card').validate({ type: 'card', title: { ru: '' } })).not.toBeNull();
    expect(getBlockEditingConfig('tiles').validate({ type: 'tiles', items: [{ id: '1', url: 'not a url' }] })).not.toBeNull();
    expect(getBlockEditingConfig('tiles').validate({ type: 'tiles', items: [] })).not.toBeNull();
  });
});
