import type { PublicBookingCreated } from '@/services/booking-lifecycle';

export type PublicBookingStep =
  | 'service'
  | 'slot'
  | 'contact'
  | 'submitting'
  | 'deposit'
  | 'confirmed'
  | 'error';

export interface PublicBookingService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceAmount: string;
  currency: string;
  depositMode: 'none' | 'fixed' | 'percent';
  depositRequiredAmount: string;
}

export interface PublicBookingSlot {
  date: string;
  time: string;
  endTime: string | null;
  available: boolean;
}

export interface PublicBookingContact {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface PublicBookingState {
  step: PublicBookingStep;
  service: PublicBookingService | null;
  slots: PublicBookingSlot[];
  selectedSlot: PublicBookingSlot | null;
  contact: PublicBookingContact;
  booking: PublicBookingCreated | null;
  bookingStatus: PublicBookingCreated['status'] | null;
  error: string | null;
}

export type PublicBookingAction =
  | { type: 'SERVICES_LOADED'; services: PublicBookingService[] }
  | { type: 'SERVICE_SELECTED'; service: PublicBookingService }
  | { type: 'SLOTS_LOADED'; slots: PublicBookingSlot[] }
  | { type: 'SLOT_SELECTED'; slot: Omit<PublicBookingSlot, 'available'> | PublicBookingSlot }
  | { type: 'CONTACT_CHANGED'; contact: PublicBookingContact }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_CONFLICT'; slots: PublicBookingSlot[] }
  | { type: 'CREATED'; booking: PublicBookingCreated }
  | { type: 'FAILED'; error: string }
  | { type: 'BACK' }
  | { type: 'RESET' };

const EMPTY_CONTACT: PublicBookingContact = { name: '', phone: '', email: '', notes: '' };

export function createInitialPublicBookingState(
  service: PublicBookingService | null = null,
): PublicBookingState {
  return {
    step: service ? 'slot' : 'service',
    service,
    slots: [],
    selectedSlot: null,
    contact: { ...EMPTY_CONTACT },
    booking: null,
    bookingStatus: null,
    error: null,
  };
}

export function publicBookingReducer(
  state: PublicBookingState,
  action: PublicBookingAction,
): PublicBookingState {
  switch (action.type) {
    case 'SERVICES_LOADED':
      return state.service || action.services.length !== 1
        ? state
        : { ...state, service: action.services[0], step: 'slot' };
    case 'SERVICE_SELECTED':
      return {
        ...state,
        service: action.service,
        selectedSlot: null,
        booking: null,
        bookingStatus: null,
        error: null,
        step: 'slot',
      };
    case 'SLOTS_LOADED':
      return { ...state, slots: action.slots, error: null };
    case 'SLOT_SELECTED':
      return {
        ...state,
        selectedSlot: { ...action.slot, available: true },
        error: null,
        step: 'contact',
      };
    case 'CONTACT_CHANGED':
      return { ...state, contact: action.contact, error: null };
    case 'SUBMIT':
      return state.service && state.selectedSlot
        ? { ...state, step: 'submitting', error: null }
        : { ...state, step: 'error', error: 'booking_incomplete' };
    case 'SUBMIT_CONFLICT':
      return {
        ...state,
        step: 'slot',
        slots: action.slots,
        selectedSlot: null,
        error: 'slot_unavailable',
      };
    case 'CREATED':
      return {
        ...state,
        booking: action.booking,
        bookingStatus: action.booking.status,
        error: null,
        step: action.booking.status === 'pending_payment' ? 'deposit' : 'confirmed',
      };
    case 'FAILED':
      return { ...state, step: 'error', error: action.error };
    case 'BACK':
      if (state.step === 'contact') return { ...state, step: 'slot', error: null };
      if (state.step === 'slot') return { ...state, step: 'service', error: null };
      return state;
    case 'RESET':
      return createInitialPublicBookingState();
    default:
      return state;
  }
}
