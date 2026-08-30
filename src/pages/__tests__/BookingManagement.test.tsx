import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { BookingLifecycleError, type BookingManagementContext } from '@/services/booking-lifecycle';
import { BookingManagement, type BookingManagementAdapter } from '../BookingManagement';

const currentBooking: BookingManagementContext = {
  id: 'booking-1',
  serviceName: 'Маникюр',
  slotDate: '2026-09-01',
  slotTime: '10:00:00',
  slotEndTime: '11:30:00',
  timezone: 'Asia/Almaty',
  status: 'confirmed',
  version: 3,
  paymentStatus: 'paid',
  depositRequiredAmount: '2500.00',
  paidAmount: '2500.00',
  currency: 'KZT',
  allowedActions: ['confirm', 'cancel', 'reschedule'],
  ownerPagePath: '/aru',
};

function adapter(overrides: Partial<BookingManagementAdapter> = {}): BookingManagementAdapter {
  return {
    loadContext: vi.fn().mockResolvedValue(currentBooking),
    loadAvailability: vi.fn().mockResolvedValue([
      { date: '2026-09-02', time: '12:00:00', endTime: '13:30:00', available: true },
    ]),
    manage: vi.fn().mockResolvedValue({
      bookingId: 'booking-1', status: 'confirmed', version: 4, idempotentReplay: false,
    }),
    ...overrides,
  };
}

function renderPage(fake: BookingManagementAdapter) {
  return render(
    <MemoryRouter>
      <BookingManagement tokenOverride={'a'.repeat(64)} adapter={fake} initialDate="2026-09-02" />
    </MemoryRouter>,
  );
}

describe('BookingManagement', () => {
  it('renders only the public-safe booking context', async () => {
    renderPage(adapter());

    expect(await screen.findByRole('heading', { name: 'Маникюр' })).toBeInTheDocument();
    expect(screen.getByText(/01\.09\.2026/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/Подтверждена/)).toBeInTheDocument();
    expect(screen.queryByText('internal-note-secret')).not.toBeInTheDocument();
    expect(screen.queryByText('owner-user-id')).not.toBeInTheDocument();
    expect(screen.queryByText('provider-payload-secret')).not.toBeInTheDocument();
  });

  it('shows an owner contact CTA for an expired token without leaking booking facts', async () => {
    const fake = adapter({
      loadContext: vi.fn().mockRejectedValue(new BookingLifecycleError(
        'token_expired',
        false,
        { ownerPagePath: '/aru' },
      )),
    });
    renderPage(fake);

    expect(await screen.findByRole('heading', { name: 'Ссылка устарела' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Связаться со специалистом' })).toHaveAttribute('href', '/aru');
    expect(screen.queryByText('Маникюр')).not.toBeInTheDocument();
    expect(screen.queryByText('2026-09-01')).not.toBeInTheDocument();
  });

  it('reschedules with the expected version and renders refreshed local time', async () => {
    const refreshed = { ...currentBooking, slotDate: '2026-09-02', slotTime: '12:00:00', slotEndTime: '13:30:00', version: 4 };
    const loadContext = vi.fn()
      .mockResolvedValueOnce(currentBooking)
      .mockResolvedValueOnce(refreshed);
    const fake = adapter({ loadContext });
    renderPage(fake);

    fireEvent.click(await screen.findByRole('button', { name: 'Перенести' }));
    const slot = await screen.findByRole('button', { name: /12:00/ });
    fireEvent.click(slot);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить новое время' }));

    await waitFor(() => expect(fake.manage).toHaveBeenCalledWith(expect.objectContaining({
      token: 'a'.repeat(64),
      action: 'reschedule',
      expectedVersion: 3,
      slotDate: '2026-09-02',
      slotTime: '12:00:00',
      slotEndTime: '13:30:00',
      idempotencyKey: expect.stringMatching(/^manage-booking:/),
    })));
    expect(await screen.findByText(/12:00/)).toBeInTheDocument();
    expect(screen.getByText(/02\.09\.2026/)).toBeInTheDocument();
  });
});
