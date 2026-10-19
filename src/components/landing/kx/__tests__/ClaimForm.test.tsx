import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClaimForm } from '../primitives';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('@/platform/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ limit: () => new Promise(() => {}) }) }) }) },
}));

describe('ClaimForm', () => {
  it('cannot be submitted while the address is still being checked', () => {
    const onSubmit = vi.fn();
    render(<ClaimForm id="t" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'aruzhan' } });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.submit(button.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('treats an app route as taken', () => {
    const onSubmit = vi.fn();
    render(<ClaimForm id="t" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'multilink' } });
    expect(screen.getByText('Этот адрес уже занят. Попробуй другой.')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submits an empty field straight to signup', () => {
    const onSubmit = vi.fn();
    render(<ClaimForm id="t" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });
});
