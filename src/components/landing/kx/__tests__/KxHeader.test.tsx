import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KxHeader } from '../KxHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback, i18n: { language: 'ru', changeLanguage: vi.fn() } }),
}));

describe('KxHeader menu', () => {
  it('closes with Escape and restores focus and page scrolling', () => {
    render(<KxHeader onLogin={vi.fn()} onSignup={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Открыть меню' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});