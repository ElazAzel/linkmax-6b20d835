import { describe, it, expect } from 'vitest';
import { parseStartParam } from '../TelegramContext';

describe('parseStartParam (deep-link router)', () => {
    it('should return home for empty/undefined param', () => {
        expect(parseStartParam(undefined)).toEqual({ screen: 'home' });
        expect(parseStartParam('')).toEqual({ screen: 'home' });
    });

    it('should route "home" to home screen', () => {
        expect(parseStartParam('home')).toEqual({ screen: 'home' });
    });

    it('should route "page" to page screen', () => {
        expect(parseStartParam('page')).toEqual({ screen: 'page' });
    });

    it('should route "crm" and "leads" to crm screen', () => {
        expect(parseStartParam('crm')).toEqual({ screen: 'crm' });
        expect(parseStartParam('leads')).toEqual({ screen: 'crm' });
    });

    it('should route "bookings" and "calendar" to bookings screen', () => {
        expect(parseStartParam('bookings')).toEqual({ screen: 'bookings' });
        expect(parseStartParam('calendar')).toEqual({ screen: 'bookings' });
    });

    it('should route "pay", "billing", "payments" to payments screen', () => {
        expect(parseStartParam('pay')).toEqual({ screen: 'payments' });
        expect(parseStartParam('billing')).toEqual({ screen: 'payments' });
        expect(parseStartParam('payments')).toEqual({ screen: 'payments' });
    });

    it('should route "settings" to settings screen', () => {
        expect(parseStartParam('settings')).toEqual({ screen: 'settings' });
    });

    it('should route "onboarding" to onboarding screen', () => {
        expect(parseStartParam('onboarding')).toEqual({ screen: 'onboarding' });
    });

    // Entity deep links
    it('should route "lead_abc123" to lead_detail with entityId', () => {
        expect(parseStartParam('lead_abc123')).toEqual({
            screen: 'lead_detail',
            entityId: 'abc123',
        });
    });

    it('should route "deal_xyz789" to deal_detail with entityId', () => {
        expect(parseStartParam('deal_xyz789')).toEqual({
            screen: 'deal_detail',
            entityId: 'xyz789',
        });
    });

    it('should route "ref_code" to home with ref param', () => {
        expect(parseStartParam('ref_code123')).toEqual({
            screen: 'home',
            params: { ref: 'code123' },
        });
    });

    // Case insensitivity
    it('should handle case-insensitive screen names', () => {
        expect(parseStartParam('CRM')).toEqual({ screen: 'crm' });
        expect(parseStartParam('Page')).toEqual({ screen: 'page' });
        expect(parseStartParam('BOOKINGS')).toEqual({ screen: 'bookings' });
    });

    // Unknown param fallback
    it('should fallback unknown params to home screen', () => {
        expect(parseStartParam('unknown_param')).toEqual({ screen: 'home' });
        expect(parseStartParam('xyz')).toEqual({ screen: 'home' });
    });
});
