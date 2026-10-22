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

  it('finishes a local styled page with the supplied service and its theme', async () => {
    const onComplete = vi.fn();
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    try {
      render(<AIBuilderWizard open isOnboarding initialNiche="education" onClose={vi.fn()} onComplete={onComplete} />);
      fireEvent.change(screen.getByRole('textbox', { name: 'Что вы предлагаете клиентам?' }), { target: { value: 'English lesson — 7500 KZT' } });
      fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
      fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Luna School' } });
      fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'English practice in Almaty' } });
      fireEvent.click(screen.getByRole('button', { name: 'Тёмный и дерзкий' }));
      fireEvent.click(screen.getByRole('button', { name: 'Собрать страницу' }));
      await screen.findByText('Страница готова');
      fireEvent.click(screen.getByRole('button', { name: 'Сначала отредактировать' }));
      const [profile, blocks, niche, theme] = onComplete.mock.calls[0];
      expect(profile.name).toBe('Luna School');
      expect(niche).toBe('education');
      expect(theme).toMatchObject({ darkMode: true, colors: { canvas: '#0c101b' } });
      expect(JSON.stringify(blocks)).toContain('English lesson');
      expect(JSON.stringify(blocks)).toContain('7 500 KZT');
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });
});
