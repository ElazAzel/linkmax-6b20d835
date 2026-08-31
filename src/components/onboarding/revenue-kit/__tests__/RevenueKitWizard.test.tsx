import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBeautyPreset, type RevenueKitDraft, type RevenueKitStep } from '@/domain/revenue-kits/beauty-v1';
import { useRevenueKit } from '@/hooks/revenue/useRevenueKit';
import { RevenueKitWizard } from '../RevenueKitWizard';

vi.mock('@/hooks/revenue/useRevenueKit', () => ({ useRevenueKit: vi.fn() }));

const saveStep = vi.fn();
const apply = vi.fn();

function mockKit(step: RevenueKitStep, draft: RevenueKitDraft) {
  vi.mocked(useRevenueKit).mockReturnValue({
    draft,
    step,
    isLoading: false,
    isSaving: false,
    isApplying: false,
    error: null,
    saveStep,
    apply,
  });
}

describe('RevenueKitWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveStep.mockResolvedValue({ step: 'services' });
  });

  it('saves identity and an edited literal service price through the real flow', async () => {
    mockKit('identity', createBeautyPreset('nails'));
    render(<RevenueKitWizard pageId="page-1" initialNiche="nails" />);

    fireEvent.change(screen.getByLabelText('Название бизнеса'), { target: { value: 'Aru Nails' } });
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Алматы' } });
    fireEvent.change(screen.getByLabelText('WhatsApp или Telegram'), { target: { value: '+77000000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('heading', { name: 'Услуги' })).toBeInTheDocument();
    const priceInputs = screen.getAllByLabelText('Цена, ₸');
    fireEvent.change(priceInputs[0], { target: { value: '8500.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => expect(saveStep).toHaveBeenLastCalledWith(
      'availability',
      expect.objectContaining({
        version: 1,
        services: expect.arrayContaining([
          expect.objectContaining({ presetId: 'nails-gel-manicure', priceAmount: '8500.00' }),
        ]),
      }),
    ));
  });

  it('blocks progression when there is no active service', () => {
    const draft = createBeautyPreset('nails');
    draft.services.forEach((service) => { service.active = false; });
    mockKit('services', draft);
    render(<RevenueKitWizard pageId="page-1" initialNiche="nails" />);

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Оставьте хотя бы одну активную услугу');
    expect(saveStep).not.toHaveBeenCalled();
  });

  it('blocks an invalid working-hour range', () => {
    const draft = createBeautyPreset('nails');
    draft.availability.startTime = '18:00';
    draft.availability.endTime = '09:00';
    mockKit('availability', draft);
    render(<RevenueKitWizard pageId="page-1" initialNiche="nails" />);

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Время окончания должно быть позже начала');
  });

  it('blocks a fixed deposit above the lowest active service price', () => {
    const draft = createBeautyPreset('nails');
    draft.depositPolicy.deposit = { mode: 'fixed', value: '10000.00' };
    draft.depositPolicy.paymentInstructions.ru = 'Kaspi по номеру';
    mockKit('deposit-policy', draft);
    render(<RevenueKitWizard pageId="page-1" initialNiche="nails" />);

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Предоплата не может быть выше цены услуги');
  });

  it('requires payment instructions for a manual deposit', () => {
    const draft = createBeautyPreset('nails');
    draft.depositPolicy.deposit = { mode: 'fixed', value: '1000.00' };
    mockKit('deposit-policy', draft);
    render(<RevenueKitWizard pageId="page-1" initialNiche="nails" />);

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Добавьте инструкцию по оплате');
  });

  it('resumes at preview and applies once before notifying the publisher', async () => {
    const draft = createBeautyPreset('brows');
    draft.identity.displayName = 'Aru Brows';
    draft.identity.city = 'Алматы';
    draft.identity.contactValue = '@arubrows';
    draft.trust.policyAccepted = true;
    mockKit('trust-preview', draft);
    const application = {
      pageId: 'page-1',
      offeringIds: ['offering-1'],
      blockIds: {
        profile: 'profile-1',
        pricing: 'pricing-1',
        booking: 'booking-1',
        messenger: 'messenger-1',
      },
      idempotentReplay: false,
    };
    apply.mockResolvedValue(application);
    const onPublished = vi.fn();

    render(
      <RevenueKitWizard
        pageId="page-1"
        initialNiche="brows"
        onPublished={onPublished}
      />,
    );

    expect(screen.getByText('Aru Brows')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Опубликовать страницу' }));

    await waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
    expect(onPublished).toHaveBeenCalledWith(application);
  });
});
