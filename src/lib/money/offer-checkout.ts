/**
 * Offer Checkout Adapter (P2 — Money OS)
 *
 * Единая точка входа для покупки `Offer` со страницы:
 *   1. Триггерит канонические события `checkout_started`.
 *   2. Дергает edge-функцию `create-offer-checkout`, которая создаёт
 *      запись в `orders` и возвращает Robokassa URL.
 *   3. Возвращает контракт `{ orderId, paymentUrl }`, который UI
 *      использует для редиректа.
 *
 * Провайдеры (Paddle/Stripe) подключаются рядом через отдельные
 * функции — фронт вызывает нужный адаптер, а событие/orders-контракт
 * остаётся одинаковым.
 */

import { supabase } from '@/platform/supabase/client';
import { trackCanonicalEvent } from '@/lib/analytics/event-taxonomy';
import { SupabaseAnalyticsRepository } from '@/repositories/implementations/SupabaseAnalyticsRepository';
import type { Offer } from './offers';

export interface StartOfferCheckoutInput {
  offer: Pick<Offer, 'id' | 'page_id' | 'offer_type' | 'price_cents' | 'currency'>;
  quantity?: number;
  zoneId?: string | null;
  buyerEmail?: string | null;
}

export interface OfferCheckoutSession {
  orderId: string;
  paymentUrl: string;
}

const analyticsRepo = new SupabaseAnalyticsRepository();

export async function startOfferCheckout(
  input: StartOfferCheckoutInput,
): Promise<OfferCheckoutSession> {
  const { offer, quantity = 1, zoneId = null, buyerEmail = null } = input;

  if (offer.page_id) {
    try {
      await trackCanonicalEvent(analyticsRepo, {
        event: 'checkout_started',
        pageId: offer.page_id,
        sourceObject: { type: 'order', id: offer.id },
        metadata: {
          offer_id: offer.id,
          offer_type: offer.offer_type,
          price_cents: offer.price_cents,
          currency: offer.currency,
          quantity,
        },
      });
    } catch (err) {
      // аналитика не должна ломать чекаут
      console.warn('[offer-checkout] analytics failed:', err);
    }
  }

  const { data, error } = await supabase.functions.invoke('create-offer-checkout', {
    body: {
      offerId: offer.id,
      zoneId,
      quantity,
      buyerEmail,
    },
  });

  if (error) throw new Error(error.message || 'Failed to start offer checkout');
  if (!data?.success || !data?.paymentUrl || !data?.orderId) {
    throw new Error(data?.error || 'Checkout provider returned invalid response');
  }

  return { orderId: data.orderId, paymentUrl: data.paymentUrl };
}

/**
 * Удобный shortcut — сразу редиректит браузер на страницу оплаты.
 */
export async function redirectToOfferCheckout(input: StartOfferCheckoutInput): Promise<void> {
  const session = await startOfferCheckout(input);
  window.location.href = session.paymentUrl;
}
