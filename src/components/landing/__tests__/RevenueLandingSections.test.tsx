import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RevenueLandingSections } from '@/components/landing/RevenueLandingSections';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string, options?: Record<string, unknown>) => {
      if (!fallback) return _key;
      return Object.entries(options ?? {}).reduce(
        (value, [name, replacement]) => value.replace(`{{${name}}}`, String(replacement)),
        fallback,
      );
    },
  }),
}));

describe('RevenueLandingSections', () => {
  it('explains the whole client journey and several service-business audiences', () => {
    render(<RevenueLandingSections onStart={vi.fn()} onPricing={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Не просто ссылка. Рабочий путь клиента.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'От первого клика до следующего визита' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Один принцип — разные услуги' })).toBeInTheDocument();
    expect(screen.getByText('Бьюти и wellness')).toBeInTheDocument();
    expect(screen.getByText('Эксперты и консультанты')).toBeInTheDocument();
    expect(screen.getByText('Преподаватели и наставники')).toBeInTheDocument();
    expect(screen.getByText('Фотографы и креативные специалисты')).toBeInTheDocument();
  });

  it('shows the real annual Pro monthly price from the billing catalog', () => {
    render(<RevenueLandingSections onStart={vi.fn()} onPricing={vi.fn()} />);

    expect(screen.getByText('3 045 ₸')).toBeInTheDocument();
    expect(screen.getByText('36 540 ₸ за 12 месяцев')).toBeInTheDocument();
  });

  it('connects primary and pricing actions to the page callbacks', () => {
    const onStart = vi.fn();
    const onPricing = vi.fn();
    render(<RevenueLandingSections onStart={onStart} onPricing={onPricing} />);

    fireEvent.click(screen.getByRole('button', { name: 'Начать бесплатно' }));
    fireEvent.click(screen.getByRole('button', { name: 'Посмотреть все тарифы' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onPricing).toHaveBeenCalledTimes(1);
  });
});
