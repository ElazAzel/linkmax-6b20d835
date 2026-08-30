export const BOOKING_OFFERING_SELECTED_EVENT = 'lnkmx:booking-offering-selected';

export interface BookingOfferingSelectedDetail {
  serviceOfferingId: string;
  pricingBlockId: string;
}

export function dispatchBookingOfferingSelection(detail: BookingOfferingSelectedDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BookingOfferingSelectedDetail>(
    BOOKING_OFFERING_SELECTED_EVENT,
    { detail },
  ));
}
