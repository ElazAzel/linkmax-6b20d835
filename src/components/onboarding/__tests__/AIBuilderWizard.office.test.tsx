import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AIBuilderWizard } from '../AIBuilderWizard';

describe('office onboarding', () => {
  it('starts with a real service and preserves it for generation', () => {
    render(<AIBuilderWizard open isOnboarding initialNiche="education" onClose={vi.fn()} onComplete={vi.fn()} />);
    const next = screen.getByRole('button', { name: 'Продолжить' });
    expect(next).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Что вы предлагаете клиентам?' }), { target: { value: 'English lesson — 7500 KZT' } });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(screen.getByDisplayValue('English lesson — 7500 KZT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Собрать страницу' })).toBeDisabled();
  });

  it('retains the alternative page-goal flow', () => {
    render(<AIBuilderWizard open isOnboarding onClose={vi.fn()} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Другая задача страницы' }));
    expect(screen.getByText('Что должна делать страница?')).toBeInTheDocument();
  });
});
