import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LinkBlock } from '../LinkBlock';
import type { LinkBlock as LinkBlockType } from '@/types/page';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'ru' } }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const block = { id: 'bcc', type: 'link', title: { ru: 'BCC Hub' }, url: 'https://bcchub.kz', style: 'default' } as LinkBlockType;

describe('LinkBlock favicon fallback', () => {
  it('uses a local icon on load failure without requesting a protected direct favicon', () => {
    const imageProbe = vi.fn();
    vi.stubGlobal('Image', imageProbe);
    const { container } = render(<LinkBlock block={block} />);
    const slot = screen.getByTestId('link-icon-slot');
    expect(slot.className).toContain('h-6 w-6');
    const image = container.querySelector('img')!;
    expect(image.src).toContain('google.com/s2/favicons');
    fireEvent.error(image);
    expect(container.querySelector('img')).toBeNull();
    expect(slot.querySelector('svg')).not.toBeNull();
    expect(slot.className).toContain('h-6 w-6');
    expect(imageProbe).not.toHaveBeenCalled();
  });

  it('preserves a selected owner icon and retries when its source changes', () => {
    const { container, rerender } = render(<LinkBlock block={{ ...block, iconMode: 'manual', customIconUrl: 'https://cdn.example.com/owner.png' }} />);
    expect(container.querySelector('img')?.src).toBe('https://cdn.example.com/owner.png');
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    rerender(<LinkBlock block={{ ...block, iconMode: 'manual', customIconUrl: 'https://cdn.example.com/new.png' }} />);
    expect(container.querySelector('img')?.src).toBe('https://cdn.example.com/new.png');
  });
});
