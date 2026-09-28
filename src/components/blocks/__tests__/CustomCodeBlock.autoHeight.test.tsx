import { describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { CustomCodeBlock } from '../CustomCodeBlock';
import type { CustomCodeBlock as CustomCodeBlockType } from '@/types/page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'ru' },
  }),
}));

const makeBlock = (overrides: Partial<CustomCodeBlockType> = {}) =>
  ({
    id: 'custom-1',
    type: 'custom_code',
    html: '<div style="height:640px">content</div>',
    height: 'auto',
    ...overrides,
  }) as CustomCodeBlockType;

function postHeight(source: Window | null, height: unknown, type = 'lnkmx:custom-code-height') {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { type, height }, source }));
  });
}

describe('CustomCodeBlock auto height', () => {
  it('keeps the iframe opaque-origin sandboxed', () => {
    const { container } = render(<CustomCodeBlock block={makeBlock()} />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.getAttribute('srcdoc')).toContain('lnkmx:custom-code-height');
  });

  it('resizes to the height reported by its own iframe, clamped to 100..800', () => {
    const { container } = render(<CustomCodeBlock block={makeBlock()} />);
    const iframe = container.querySelector('iframe')!;

    postHeight(iframe.contentWindow, 640);
    expect(iframe.style.height).toBe('640px');

    postHeight(iframe.contentWindow, 5000);
    expect(iframe.style.height).toBe('800px');

    postHeight(iframe.contentWindow, 10);
    expect(iframe.style.height).toBe('100px');
  });

  it('ignores messages from other windows and malformed payloads', () => {
    const { container } = render(<CustomCodeBlock block={makeBlock()} />);
    const iframe = container.querySelector('iframe')!;
    postHeight(iframe.contentWindow, 300);

    postHeight(window, 700);
    postHeight(iframe.contentWindow, '700');
    postHeight(iframe.contentWindow, 700, 'other');
    expect(iframe.style.height).toBe('300px');
  });

  it('does not inject the reporter for fixed heights', () => {
    const { container } = render(<CustomCodeBlock block={makeBlock({ height: 'large' })} />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe.getAttribute('srcdoc')).not.toContain('lnkmx:custom-code-height');
    expect(iframe.style.height).toBe('600px');
  });
});
