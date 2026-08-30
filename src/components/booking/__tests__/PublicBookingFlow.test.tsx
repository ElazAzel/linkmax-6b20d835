import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BookingLifecycleError, type PublicBookingContext } from '@/services/booking-lifecycle';
import type { BookingBlock } from '@/types/page';
import { PublicBookingFlow, type PublicBookingAdapter } from '../PublicBookingFlow';

const noDepositContext: PublicBookingContext = {
  page: { id: 'page-1', slug: 'aru', title: 'Aru Nails' },
  services: [{
    id: 'offering-1',
    name: 'Маникюр',
    description: 'С покрытием',
    durationMinutes: 90,
    priceAmount: '8500.00',
    currency: 'KZT',
    depositMode: 'none',
    depositValue: '0.00',
    depositRequiredAmount: '0.00',
    paymentInstructions: null,
  }],
};

const block: BookingBlock = {
  id: 'booking-block-1',
  type: 'booking',
  timezone: 'Asia/Almaty',
  serviceOfferingIds: ['offering-1'],
};

function adapter(overrides: Partial<PublicBookingAdapter> = {}): PublicBookingAdapter {
  return {
    loadContext: vi.fn().mockResolvedValue(noDepositContext),
    loadAvailability: vi.fn().mockResolvedValue([
      { date: '2026-09-01', time: '10:00:00', endTime: '11:30:00', available: true },
    ]),
    createBooking: vi.fn().mockResolvedValue({
      bookingId: 'booking-1',
      status: 'confirmed',
      version: 1,
      paymentStatus: 'pending',
      depositRequiredAmount: '0.00',
      currency: 'KZT',
      accessToken: 'a'.repeat(64),
      idempotentReplay: false,
    }),
    ...overrides,
  };
}

async function reachContactStep() {
  const slot = await screen.findByRole('button', { name: /10:00/ });
  fireEvent.click(slot);
  expect(slot).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  await screen.findByLabelText('Имя');
}

function fillContact() {
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Алия' } });
  fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+77000000000' } });
}

describe('PublicBookingFlow', () => {
  it('completes a no-deposit journey and returns a management URL', async () => {
    const fake = adapter();
    render(<PublicBookingFlow
      pageId="page-1"
      block={block}
      linkedServiceId="offering-1"
      adapter={fake}
      initialDate="2026-09-01"
    />);

    await reachContactStep();
    fillContact();
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить запись' }));

    expect(await screen.findByRole('heading', { name: 'Запись подтверждена' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Управление записью' })).toHaveAttribute(
      'href',
      `/booking/manage/${'a'.repeat(64)}`,
    );
    expect(fake.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      serviceOfferingId: 'offering-1',
      client: expect.objectContaining({ name: 'Алия', phone: '+77000000000' }),
    }));
  });

  it('uses honest manual-deposit language', async () => {
    const depositContext: PublicBookingContext = {
      ...noDepositContext,
      services: [{
        ...noDepositContext.services[0],
        depositMode: 'fixed',
        depositValue: '2500.00',
        depositRequiredAmount: '2500.00',
        paymentInstructions: 'Kaspi: +7 700 000 00 00',
      }],
    };
    const fake = adapter({
      loadContext: vi.fn().mockResolvedValue(depositContext),
      createBooking: vi.fn().mockResolvedValue({
        bookingId: 'booking-2',
        status: 'pending_payment',
        version: 1,
        paymentStatus: 'pending',
        depositRequiredAmount: '2500.00',
        currency: 'KZT',
        accessToken: 'b'.repeat(64),
        idempotentReplay: false,
      }),
    });
    render(<PublicBookingFlow pageId="page-1" block={block} adapter={fake} initialDate="2026-09-01" />);

    await reachContactStep();
    fillContact();
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить запись' }));

    expect(await screen.findByRole('heading', { name: 'Ожидает подтверждения предоплаты' })).toBeInTheDocument();
    expect(screen.queryByText('Вы записаны')).not.toBeInTheDocument();
    expect(screen.getByText('Kaspi: +7 700 000 00 00')).toBeInTheDocument();
  });

  it('recovers from a slot conflict, focuses the summary, and preserves contact fields', async () => {
    const loadAvailability = vi.fn()
      .mockResolvedValueOnce([
        { date: '2026-09-01', time: '10:00:00', endTime: '11:30:00', available: true },
      ])
      .mockResolvedValueOnce([
        { date: '2026-09-01', time: '11:30:00', endTime: '13:00:00', available: true },
      ]);
    const fake = adapter({
      loadAvailability,
      createBooking: vi.fn().mockRejectedValue(new BookingLifecycleError('slot_unavailable', false)),
    });
    render(<PublicBookingFlow pageId="page-1" block={block} adapter={fake} initialDate="2026-09-01" />);

    await reachContactStep();
    fillContact();
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить запись' }));

    const alert = await screen.findByRole('alert');
    await waitFor(() => expect(alert).toHaveFocus());
    expect(alert).toHaveTextContent('Это время уже занято');
    expect(screen.getByRole('button', { name: /11:30/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /11:30/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByLabelText('Имя')).toHaveValue('Алия');
  });

  it('keyboard-selects a slot with visible selected semantics', async () => {
    render(<PublicBookingFlow pageId="page-1" block={block} adapter={adapter()} initialDate="2026-09-01" />);

    const slot = await screen.findByRole('button', { name: /10:00/ });
    fireEvent.keyDown(slot, { key: 'Enter' });
    expect(slot).toHaveAttribute('aria-selected', 'true');
  });
});
