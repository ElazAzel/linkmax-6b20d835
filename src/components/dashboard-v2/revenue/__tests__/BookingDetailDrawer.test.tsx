import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BookingOwnerDetail } from '@/services/booking-lifecycle';
import { BookingDetailDrawer } from '../BookingDetailDrawer';

function detail(status: BookingOwnerDetail['status']): BookingOwnerDetail {
  return {
    bookingId: 'booking-1',
    pageId: 'page-1',
    version: 3,
    status,
    statusReason: null,
    localStart: '2026-08-20T10:00:00',
    timezone: 'Asia/Almaty',
    slotStarted: true,
    serviceName: 'Маникюр',
    serviceSnapshot: { name: { ru: 'Маникюр' }, currency: 'KZT' },
    client: { name: 'Алия', phone: '+77000000000', email: null, notes: null },
    payment: {
      status: 'pending',
      totalAmount: '7000.00',
      depositRequiredAmount: '2000.00',
      paidAmount: '0.00',
      refundedAmount: '0.00',
      currency: 'KZT',
      facts: [],
    },
    attribution: { source: 'instagram', medium: null, campaign: null, referrerHost: null },
    transitions: [{
      fromStatus: null,
      toStatus: status,
      actorType: 'visitor',
      reasonCode: 'booking_created',
      occurredAt: '2026-08-19T08:00:00Z',
    }],
    notifications: [{
      eventKind: 'delivered',
      recipientRole: 'customer',
      channel: 'email',
      templateKey: 'booking_created_customer',
      errorCode: null,
      occurredAt: '2026-08-19T08:01:00Z',
    }],
  };
}

const handlers = {
  onConfirmDeposit: vi.fn(),
  onWaivePayment: vi.fn(),
  onCancel: vi.fn(),
  onComplete: vi.fn(),
  onNoShow: vi.fn(),
};

describe('BookingDetailDrawer', () => {
  it('offers confirm, waive and cancel for a pending-payment booking', () => {
    render(<BookingDetailDrawer open detail={detail('pending_payment')} onOpenChange={vi.fn()} {...handlers} />);

    expect(screen.getByRole('button', { name: 'Подтвердить предоплату' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Без предоплаты' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отменить запись' })).toBeInTheDocument();
  });

  it('offers completion and no-show for a past confirmed appointment', () => {
    render(<BookingDetailDrawer open detail={detail('confirmed')} onOpenChange={vi.fn()} {...handlers} />);

    expect(screen.getByRole('button', { name: 'Завершить визит' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Клиент не пришёл' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Завершить визит' }));
    expect(handlers.onComplete).toHaveBeenCalledWith('7000.00', 'cash');
  });

  it('shows immutable history and no destructive primary action after completion', () => {
    render(<BookingDetailDrawer open detail={detail('completed')} onOpenChange={vi.fn()} {...handlers} />);

    expect(screen.queryByRole('button', { name: 'Завершить визит' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить запись' })).not.toBeInTheDocument();
    expect(screen.getByText('История статусов')).toBeInTheDocument();
    expect(screen.getByText('Доставлено')).toBeInTheDocument();
  });
});
