import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { BookingBlock } from '@/types/page';
import {
  BookingLifecycleError,
  createPublicBooking,
  loadPublicAvailability,
  loadPublicBookingContext,
  type CreatePublicBookingInput,
  type PublicAvailabilitySlot,
  type PublicBookingContext,
  type PublicBookingCreated,
} from '@/services/booking-lifecycle';
import { BookingConfirmationStep } from './BookingConfirmationStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { DepositStateStep } from './DepositStateStep';
import {
  createInitialPublicBookingState,
  publicBookingReducer,
  type PublicBookingService,
} from './public-booking-machine';
import { ServiceSelectionStep } from './ServiceSelectionStep';
import { SlotSelectionStep } from './SlotSelectionStep';

export interface PublicBookingAdapter {
  loadContext: (pageId: string) => Promise<PublicBookingContext>;
  loadAvailability: (input: {
    pageId: string;
    blockId: string;
    fromDate: string;
    toDate: string;
    staffId: string | null;
  }) => Promise<PublicAvailabilitySlot[]>;
  createBooking: (input: CreatePublicBookingInput) => Promise<PublicBookingCreated>;
}

interface PublicBookingFlowProps {
  pageId: string;
  block: BookingBlock;
  linkedServiceId?: string | null;
  adapter?: PublicBookingAdapter;
  initialDate?: string;
}

const DEFAULT_ADAPTER: PublicBookingAdapter = {
  loadContext: loadPublicBookingContext,
  loadAvailability: loadPublicAvailability,
  createBooking: createPublicBooking,
};

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createMutationId(): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `public-booking:${random}`;
}

function safeAttribution(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
    landingPath: window.location.pathname,
  };
}

function localizedInstructions(
  value: PublicBookingContext['services'][number]['paymentInstructions'],
  language: string,
): string | null {
  if (typeof value === 'string') return value;
  if (!value) return null;
  const shortLanguage = language.split('-')[0];
  return value[shortLanguage] || value.ru || value.kk || value.en || Object.values(value).find(Boolean) || null;
}

function toMachineService(
  service: PublicBookingContext['services'][number],
  language: string,
): PublicBookingService {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceAmount: service.priceAmount,
    currency: service.currency,
    depositMode: service.depositMode,
    depositRequiredAmount: service.depositRequiredAmount,
    paymentInstructions: localizedInstructions(service.paymentInstructions, language),
  };
}

export function PublicBookingFlow({
  pageId,
  block,
  linkedServiceId,
  adapter = DEFAULT_ADAPTER,
  initialDate,
}: PublicBookingFlowProps) {
  const { t, i18n } = useTranslation();
  const [state, dispatch] = useReducer(publicBookingReducer, undefined, () => createInitialPublicBookingState());
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [loadingContext, setLoadingContext] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const mutationIdRef = useRef(createMutationId());

  const linkedIds = useMemo(() => new Set(block.serviceOfferingIds ?? []), [block.serviceOfferingIds]);

  useEffect(() => {
    let active = true;
    setLoadingContext(true);
    adapter.loadContext(pageId)
      .then((context) => {
        if (!active) return;
        const linkedServices = context.services
          .filter((service) => linkedIds.size === 0 || linkedIds.has(service.id))
          .map((service) => toMachineService(service, i18n.language));
        dispatch({ type: 'SERVICES_LOADED', services: linkedServices });
        const preselected = linkedServices.find((service) => service.id === linkedServiceId);
        if (preselected) dispatch({ type: 'SERVICE_SELECTED', service: preselected });
        if (linkedServices.length === 0) dispatch({ type: 'FAILED', error: 'service_unavailable' });
      })
      .catch((error) => {
        if (active) dispatch({
          type: 'FAILED',
          error: error instanceof BookingLifecycleError ? error.code : 'request_failed',
        });
      })
      .finally(() => {
        if (active) setLoadingContext(false);
      });
    return () => { active = false; };
  }, [adapter, i18n.language, linkedIds, linkedServiceId, pageId]);

  useEffect(() => {
    if (state.step !== 'slot' || !state.service || !date) return;
    let active = true;
    setLoadingSlots(true);
    adapter.loadAvailability({ pageId, blockId: block.id, fromDate: date, toDate: date, staffId: null })
      .then((slots) => {
        if (active) dispatch({
          type: 'SLOTS_LOADED',
          slots: slots.map((slot) => ({ ...slot })),
        });
      })
      .catch((error) => {
        if (active) dispatch({
          type: 'FAILED',
          error: error instanceof BookingLifecycleError ? error.code : 'request_failed',
        });
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => { active = false; };
  }, [adapter, block.id, date, pageId, state.service, state.step]);

  useEffect(() => {
    if (state.error === 'slot_unavailable') errorRef.current?.focus();
  }, [state.error]);

  const submit = async () => {
    if (!state.service || !state.selectedSlot) return;
    if (!state.contact.name.trim() || (!state.contact.phone.trim() && !state.contact.email.trim())) {
      setContactError(t('publicBooking.errors.contactRequired', 'Укажите имя и телефон или email.'));
      return;
    }
    setContactError(null);
    dispatch({ type: 'SUBMIT' });

    try {
      const booking = await adapter.createBooking({
        pageId,
        blockId: block.id,
        serviceOfferingId: state.service.id,
        slotDate: state.selectedSlot.date,
        slotTime: state.selectedSlot.time,
        staffId: null,
        client: {
          name: state.contact.name.trim(),
          phone: state.contact.phone.trim() || null,
          email: state.contact.email.trim() || null,
          notes: state.contact.notes.trim() || null,
        },
        bookingTimezone: block.timezone || 'Asia/Almaty',
        locale: i18n.language,
        attribution: safeAttribution(),
        idempotencyKey: mutationIdRef.current,
      });
      dispatch({ type: 'CREATED', booking });
    } catch (error) {
      if (error instanceof BookingLifecycleError && error.code === 'slot_unavailable') {
        mutationIdRef.current = createMutationId();
        dispatch({ type: 'SUBMIT_CONFLICT', slots: state.slots });
        return;
      }
      dispatch({
        type: 'FAILED',
        error: error instanceof BookingLifecycleError ? error.code : 'request_failed',
      });
    }
  };

  if (loadingContext) {
    return <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">{t('common.loading', 'Загрузка…')}</div>;
  }

  return (
    <div className="w-full rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      {state.step === 'service' && (
        <ServiceSelectionStep services={state.services} onSelect={(service) => dispatch({ type: 'SERVICE_SELECTED', service })} />
      )}
      {state.step === 'slot' && (
        <SlotSelectionStep
          date={date}
          slots={state.slots}
          selectedSlot={state.selectedSlot}
          loading={loadingSlots}
          error={state.error}
          errorRef={errorRef}
          onDateChange={(nextDate) => {
            setDate(nextDate);
            dispatch({ type: 'SLOTS_LOADED', slots: [] });
            dispatch({ type: 'CLEAR_ERROR' });
          }}
          onSelect={(slot) => dispatch({ type: 'SLOT_SELECTED', slot })}
          onContinue={() => dispatch({ type: 'CONTINUE_TO_CONTACT' })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )}
      {(state.step === 'contact' || state.step === 'submitting') && (
        <ContactDetailsStep
          contact={state.contact}
          error={contactError}
          submitting={state.step === 'submitting'}
          onChange={(contact) => dispatch({ type: 'CONTACT_CHANGED', contact })}
          onBack={() => dispatch({ type: 'BACK' })}
          onSubmit={() => void submit()}
        />
      )}
      {state.step === 'deposit' && state.booking && (
        <DepositStateStep booking={state.booking} instructions={state.service?.paymentInstructions} />
      )}
      {state.step === 'confirmed' && state.booking && <BookingConfirmationStep booking={state.booking} />}
      {state.step === 'error' && (
        <section className="space-y-4 text-center">
          <p role="alert" className="text-sm text-destructive">
            {t(`publicBooking.errors.${state.error}`, 'Не удалось создать запись. Попробуйте ещё раз.')}
          </p>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {t('common.tryAgain', 'Попробовать снова')}
          </Button>
        </section>
      )}
    </div>
  );
}
