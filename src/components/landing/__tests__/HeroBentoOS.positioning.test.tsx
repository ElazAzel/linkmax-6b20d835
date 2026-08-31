import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HeroBentoOS } from '@/components/landing/v3/HeroBentoOS';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('HeroBentoOS positioning', () => {
  it('sells a client journey for service businesses without narrowing LinkMAX to beauty', () => {
    render(<HeroBentoOS onStart={vi.fn()} onExamples={vi.fn()} />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Клиент выбирает, записывается и оплачивает — по одной ссылке',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Для специалистов и сервисного бизнеса')).toBeInTheDocument();
    expect(screen.getByText('Бьюти и wellness')).toBeInTheDocument();
    expect(screen.getByText('Консультации')).toBeInTheDocument();
    expect(screen.getByText('Обучение')).toBeInTheDocument();
  });

  it('keeps the short-address signup flow intact', () => {
    const onStart = vi.fn();
    render(<HeroBentoOS onStart={onStart} onExamples={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Короткий адрес страницы' }), {
      target: { value: 'My Service!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать бесплатно' }));

    expect(onStart).toHaveBeenCalledWith('my-service');
  });
});
