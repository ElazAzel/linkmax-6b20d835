import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RevenueBySource } from '../RevenueBySource';
import { RevenueFunnel } from '../RevenueFunnel';

describe('RevenueInsights', () => {
  it('renders the revenue funnel in factual order without dividing by zero', () => {
    render(<RevenueFunnel funnel={{
      serviceViewed: 0,
      bookingStarted: 0,
      bookingCreated: 3,
      bookingPaid: 2,
      bookingCompleted: 1,
    }} />);

    const funnel = screen.getByTestId('revenue-funnel');
    const labels = within(funnel).getAllByTestId('revenue-funnel-label')
      .map((node) => node.textContent);
    expect(labels).toEqual([
      'Просмотр услуги',
      'Начало записи',
      'Запись создана',
      'Оплачено',
      'Завершено',
    ]);
    expect(funnel).not.toHaveTextContent(/Infinity|NaN/);
    expect(funnel).toHaveTextContent('—');
    expect(screen.getByTestId('revenue-funnel-bar-serviceViewed')).toHaveStyle({ width: '0%' });
  });

  it('keeps unknown attribution visible and displays server decimal strings', () => {
    render(<RevenueBySource sources={[{
      source: 'unknown',
      serviceViewed: 0,
      bookingStarted: 0,
      bookingCreated: 2,
      bookingPaid: 1,
      bookingCompleted: 1,
      netCollectedAmount: '12000.50',
      currency: 'KZT',
    }]} />);

    const table = screen.getByTestId('revenue-by-source');
    expect(within(table).getByText('unknown')).toBeInTheDocument();
    expect(table).toHaveTextContent('12000.50');
    expect(table).toHaveTextContent('KZT');
    expect(within(table).getByText('Завершено')).toBeInTheDocument();
  });
});
