import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OfficeScreen } from '../OfficeScreen';
import type { OfficeBooking } from '@/domain/office/workspace';

const query = vi.hoisted(() => ({ data: [] as OfficeBooking[] | undefined, isPending: false,
  isError: false, isFetching: false, error: null as Error | null, refetch: vi.fn() }));
vi.mock('@/hooks/revenue/useDigitalOffice', () => ({ useDigitalOffice: () => query }));
vi.mock('@/hooks/revenue/useBookingOperations', () => ({
  useBookingRevenueDetail: () => ({ data: null, isPending: false, isError: false, refetch: vi.fn() }),
  useBookingOperations: () => ({ isPending: false }),
}));

const booking = (id: string, pageId: string): OfficeBooking => ({
  id, page_id: pageId, owner_id: 'owner', block_id: 'block', client_name: 'Алия', client_email: 'aliya@example.com',
  client_phone: '+77001234567', client_notes: null, user_id: null, client_identity_hash: null,
  slot_date: '2026-09-30', slot_time: '10:00:00', slot_end_time: '11:00:00', booking_timezone: 'Asia/Almaty',
  status: 'completed', version: 1, payment_status: 'paid', paid_amount: 7500, refunded_amount: 0,
  total_price_amount: 7500, service_snapshot: { name: 'English lesson', currency: 'KZT' }, created_at: '2026-09-29T10:00:00Z',
});

describe('OfficeScreen', () => {
  it('opens one client history across pages and supports contact search', () => {
    Object.assign(query, { data: [booking('first', 'page-a'), booking('second', 'page-b')], isError: false, isPending: false });
    render(<OfficeScreen view="clients" onNavigate={vi.fn()} />);
    expect(screen.getAllByText('Алия')).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nobody' } });
    expect(screen.getByText('Клиенты не найдены')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'aliya@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Алия/ }));
    expect(screen.getByText('История встреч')).toBeInTheDocument();
    expect(screen.getAllByText('English lesson')).toHaveLength(2);
  });

  it('makes an unavailable schema explicit rather than showing a successful empty account', () => {
    Object.assign(query, { data: undefined, isError: true, isPending: false, error: new Error('feature_unavailable') });
    render(<OfficeScreen view="clients" onNavigate={vi.fn()} />);
    expect(screen.getByText('Работа с записями пока недоступна')).toBeInTheDocument();
    expect(screen.queryByText('Клиенты появятся после первой записи')).not.toBeInTheDocument();
  });

  it('opens offers from the first-booking empty state', () => {
    Object.assign(query, { data: [], isError: false, isPending: false, error: null });
    const navigate = vi.fn();
    render(<OfficeScreen view="clients" onNavigate={navigate} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Добавить предложение' })[1]);
    expect(navigate).toHaveBeenCalledWith('offers');
  });
});
