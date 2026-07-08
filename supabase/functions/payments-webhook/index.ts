import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';
import {
  BILLING_RECOVERY_MAX_ATTEMPTS,
  buildBillingRecoveryNotificationCopy,
  calculateBillingRecoveryState,
  normalizeBillingPromoCode,
} from '../../../src/domain/billing/recovery.ts';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  return _supabase;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }

  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status: status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'paddle_subscription_id',
  });

  const promoCode = normalizeBillingPromoCode(customData?.promoCode);
  if (promoCode) {
    await recordProductEvent(userId, 'promo_code_applied', {
      promo_code: promoCode,
      paddle_subscription_id: id,
      environment: env,
    });
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;

  await getSupabase().from('subscriptions')
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase().from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

function getEventType(event: any): string {
  return String(event?.eventType ?? event?.event_type ?? '');
}

function getEventId(event: any, data: any): string {
  const explicitId = event?.eventId ?? event?.event_id ?? event?.notificationId ?? event?.notification_id;
  if (explicitId) return String(explicitId);

  const eventType = getEventType(event) || 'paddle.event';
  const entityId = data?.id ?? data?.subscriptionId ?? data?.subscription_id ?? 'unknown';
  const occurredAt = event?.occurredAt ?? event?.occurred_at ?? new Date().toISOString();
  return `${eventType}:${entityId}:${occurredAt}`;
}

function getOccurredAt(event: any): string {
  const occurredAt = event?.occurredAt ?? event?.occurred_at;
  return occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString();
}

function getSubscriptionLookupId(data: any, eventType: string): string | null {
  if (eventType.startsWith('subscription.')) return data?.id ? String(data.id) : null;
  return data?.subscriptionId ?? data?.subscription_id ?? data?.subscription?.id ?? null;
}

function getCustomerLookupId(data: any): string | null {
  return data?.customerId ?? data?.customer_id ?? data?.customer?.id ?? null;
}

function getCustomUserId(data: any): string | null {
  return data?.customData?.userId ?? data?.custom_data?.userId ?? data?.subscription?.customData?.userId ?? null;
}

function getFailureCode(data: any): string | null {
  return data?.payments?.[0]?.errorCode
    ?? data?.payments?.[0]?.error_code
    ?? data?.billingDetails?.paymentFailure?.code
    ?? data?.billing_details?.payment_failure?.code
    ?? null;
}

function getFailureMessage(data: any): string | null {
  return data?.payments?.[0]?.methodDetails?.card?.type
    ?? data?.payments?.[0]?.method_details?.card?.type
    ?? data?.billingDetails?.paymentFailure?.reason
    ?? data?.billing_details?.payment_failure?.reason
    ?? null;
}

function parseAmount(data: any): number {
  const rawAmount = data?.details?.totals?.total
    ?? data?.details?.totals?.grandTotal
    ?? data?.details?.totals?.grand_total
    ?? data?.totals?.total
    ?? data?.items?.[0]?.price?.unitPrice?.amount
    ?? data?.items?.[0]?.price?.unit_price?.amount
    ?? 0;
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount)) return 0;
  return amount > 1000 ? Number((amount / 100).toFixed(2)) : amount;
}

function getCurrency(data: any): string {
  return data?.currencyCode ?? data?.currency_code ?? data?.details?.totals?.currencyCode ?? 'USD';
}

async function hasRecordedProviderEvent(providerEventId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('billing_history')
    .select('id')
    .eq('provider', 'paddle')
    .eq('provider_event_id', providerEventId)
    .maybeSingle();

  return Boolean(data?.id);
}

async function findSubscriptionForEvent(data: any, eventType: string, env: PaddleEnv) {
  const supabase = getSupabase();
  const subscriptionId = getSubscriptionLookupId(data, eventType);
  const customerId = getCustomerLookupId(data);
  const userId = getCustomUserId(data);

  if (subscriptionId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paddle_subscription_id', subscriptionId)
      .eq('environment', env)
      .maybeSingle();
    if (subscription) return subscription;
  }

  if (userId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', env)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscription) return subscription;
  }

  if (customerId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paddle_customer_id', customerId)
      .eq('environment', env)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscription) return subscription;
  }

  return null;
}

async function recordBillingHistory(params: {
  userId: string;
  subscriptionId: string | null;
  providerEventId: string;
  eventType: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, unknown>;
}) {
  await getSupabase()
    .from('billing_history')
    .upsert({
      user_id: params.userId,
      subscription_id: params.subscriptionId,
      type: 'subscription',
      amount: params.amount,
      currency: params.currency,
      description: `Paddle ${params.eventType}`,
      status: params.status,
      provider: 'paddle',
      provider_event_id: params.providerEventId,
      metadata: params.metadata,
    }, {
      onConflict: 'provider,provider_event_id',
      ignoreDuplicates: true,
    });
}

async function recordProductEvent(
  userId: string,
  eventName: string,
  metadata: Record<string, unknown>
) {
  await getSupabase()
    .from('product_events')
    .insert({
      user_id: userId,
      event_name: eventName,
      source: 'edge',
      metadata,
      occurred_at: new Date().toISOString(),
    });
}

async function enqueueBillingWebhookEvent(
  eventType: string,
  subscription: any,
  providerEventId: string,
  payload: Record<string, unknown>
) {
  try {
    await getSupabase().rpc('enqueue_webhook_event', {
      p_event_type: eventType,
      p_user_id: subscription.user_id,
      p_zone_id: null,
      p_source_table: 'subscriptions',
      p_source_id: subscription.id,
      p_payload: payload,
      p_idempotency_key: `${eventType}:${providerEventId}`,
    });
  } catch {
    return;
  }
}

async function enqueueRecoveryNotifications(
  userId: string,
  providerEventId: string,
  attemptCount: number,
  nextActionAt: string | null
) {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('telegram_chat_id, telegram_notifications_enabled, email_notifications_enabled')
    .eq('id', userId)
    .maybeSingle();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email ?? null;
  const copy = buildBillingRecoveryNotificationCopy({
    attemptCount,
    maxAttempts: BILLING_RECOVERY_MAX_ATTEMPTS,
    nextActionAt,
    manageBillingUrl: 'https://lnkmx.my/pricing?billing=recover',
  });

  const rows: Array<Record<string, unknown>> = [];
  if (profile?.telegram_notifications_enabled && profile?.telegram_chat_id) {
    rows.push({
      user_id: userId,
      event_type: 'billing_recovery',
      payload: {
        channel: 'telegram',
        telegram: {
          chat_id: profile.telegram_chat_id,
          text: copy.telegramText,
          parse_mode: 'HTML',
        },
      },
      status: 'pending',
      idempotency_key: `billing_recovery:${providerEventId}:telegram`,
    });
  }

  if (email && profile?.email_notifications_enabled !== false) {
    rows.push({
      user_id: userId,
      event_type: 'billing_recovery',
      payload: {
        channel: 'email',
        email: {
          to: email,
          subject: copy.subject,
          html: copy.html,
        },
      },
      status: 'pending',
      idempotency_key: `billing_recovery:${providerEventId}:email`,
    });
  }

  if (rows.length === 0) return;

  await supabase
    .from('notification_queue')
    .upsert(rows, {
      onConflict: 'idempotency_key',
      ignoreDuplicates: true,
    });
}

async function handleBillingFailureEvent(event: any, data: any, env: PaddleEnv) {
  const eventType = getEventType(event);
  const providerEventId = getEventId(event, data);
  if (await hasRecordedProviderEvent(providerEventId)) return;

  const subscription = await findSubscriptionForEvent(data, eventType, env);
  if (!subscription?.id || !subscription?.user_id) return;

  const occurredAt = getOccurredAt(event);
  const nextRecovery = calculateBillingRecoveryState({
    existingAttemptCount: subscription.recovery_attempt_count,
    occurredAt,
  });
  const failureCode = getFailureCode(data);
  const failureMessage = getFailureMessage(data);
  const metadata = {
    event_type: eventType,
    paddle_transaction_id: data?.id ?? null,
    paddle_subscription_id: subscription.paddle_subscription_id,
    recovery_status: nextRecovery.status,
    recovery_attempt_count: nextRecovery.attemptCount,
    failure_code: failureCode,
    failure_message: failureMessage,
    environment: env,
  };

  await recordBillingHistory({
    userId: subscription.user_id,
    subscriptionId: subscription.id,
    providerEventId,
    eventType,
    amount: parseAmount(data),
    currency: getCurrency(data),
    status: 'failed',
    metadata,
  });

  await getSupabase()
    .from('subscriptions')
    .update({
      status: 'past_due',
      recovery_status: nextRecovery.status,
      recovery_attempt_count: nextRecovery.attemptCount,
      recovery_started_at: subscription.recovery_started_at ?? occurredAt,
      recovery_next_action_at: nextRecovery.nextActionAt,
      recovery_last_notified_at: occurredAt,
      recovery_last_event_at: occurredAt,
      recovery_last_failure_code: failureCode,
      recovery_last_failure_message: failureMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  await enqueueRecoveryNotifications(
    subscription.user_id,
    providerEventId,
    nextRecovery.attemptCount,
    nextRecovery.nextActionAt
  );

  await recordProductEvent(subscription.user_id, 'billing_payment_failed', metadata);
  await recordProductEvent(
    subscription.user_id,
    nextRecovery.status === 'exhausted' ? 'billing_recovery_exhausted' : 'billing_recovery_scheduled',
    metadata
  );

  await enqueueBillingWebhookEvent('billing.payment_failed', subscription, providerEventId, metadata);
  await enqueueBillingWebhookEvent(
    nextRecovery.status === 'exhausted' ? 'billing.recovery_exhausted' : 'billing.recovery_scheduled',
    subscription,
    providerEventId,
    metadata
  );
}

async function handleBillingSuccessEvent(event: any, data: any, env: PaddleEnv) {
  const eventType = getEventType(event);
  const providerEventId = getEventId(event, data);
  if (await hasRecordedProviderEvent(providerEventId)) return;

  const subscription = await findSubscriptionForEvent(data, eventType, env);
  if (!subscription?.id || !subscription?.user_id) return;

  const wasInRecovery = Number(subscription.recovery_attempt_count ?? 0) > 0
    || ['scheduled', 'notified', 'exhausted'].includes(subscription.recovery_status);
  const occurredAt = getOccurredAt(event);
  const metadata = {
    event_type: eventType,
    paddle_transaction_id: data?.id ?? null,
    paddle_subscription_id: subscription.paddle_subscription_id,
    environment: env,
  };

  await recordBillingHistory({
    userId: subscription.user_id,
    subscriptionId: subscription.id,
    providerEventId,
    eventType,
    amount: parseAmount(data),
    currency: getCurrency(data),
    status: 'completed',
    metadata,
  });

  if (!wasInRecovery) return;

  const recovered = calculateBillingRecoveryState({
    occurredAt,
    successful: true,
  });

  await getSupabase()
    .from('subscriptions')
    .update({
      recovery_status: recovered.status,
      recovery_attempt_count: recovered.attemptCount,
      recovery_next_action_at: null,
      recovery_last_event_at: occurredAt,
      recovery_last_failure_code: null,
      recovery_last_failure_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  await recordProductEvent(subscription.user_id, 'billing_recovered', metadata);
  await enqueueBillingWebhookEvent('billing.recovered', subscription, providerEventId, metadata);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  const eventType = getEventType(event);

  switch (eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case 'subscription.activated':
      await handleSubscriptionUpdated(event.data, env);
      await handleBillingSuccessEvent(event, event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      if (['active', 'trialing'].includes(event.data?.status)) {
        await handleBillingSuccessEvent(event, event.data, env);
      }
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case 'subscription.past_due':
    case 'transaction.payment_failed':
    case 'transaction.past_due':
      await handleBillingFailureEvent(event, event.data, env);
      break;
    case 'transaction.completed':
    case 'transaction.paid':
      await handleBillingSuccessEvent(event, event.data, env);
      break;
    default:
      console.log('Unhandled event:', eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
