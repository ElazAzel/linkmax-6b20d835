import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KxHero } from '../KxHero';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('landing page examples', () => {
  it('lets visitors explore an actual photo page made of image blocks', async () => {
    render(<KxHero onStart={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Timur Shot' }));
    expect(screen.getByRole('tab', { name: 'Timur Shot' })).toHaveAttribute('aria-selected', 'true');
    const page = screen.getByRole('tabpanel', { name: 'Timur Shot' });
    expect(page).toHaveClass('lm-page', 'lm-typography', 'dark');
    await within(page).findByRole('heading', { name: 'Timur Shot', level: 1 }, { timeout: 15_000 });
    expect(page.querySelector('[data-lm-grid]')).toBeInTheDocument();
    await waitFor(() => expect(page.querySelectorAll('img').length).toBeGreaterThan(2), { timeout: 15_000 });
    const images = Array.from(page.querySelectorAll('img'));
    expect(images.every((image) => image.getAttribute('src')?.startsWith('/demo/'))).toBe(true);
    expect(within(page).queryByText('+12 000 ₸')).not.toBeInTheDocument();
  });

  it('keeps the selected page in place while a visitor explores it', () => {
    vi.useFakeTimers();
    render(<KxHero onStart={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Dana English' }));
    act(() => { vi.advanceTimersByTime(20000); });
    expect(screen.getByRole('tab', { name: 'Dana English' })).toHaveAttribute('aria-selected', 'true');
  });
});
