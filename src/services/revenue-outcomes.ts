import { supabase } from '@/platform/supabase/client';

export interface RevenueOutcomeTotals {
  paidCompletedCount: number;
  freeCompletedCount: number;
  noShowCount: number;
  pendingPaymentCount: number;
  bookingCount: number;
  collectedAmount: string;
  refundedAmount: string;
  netCollectedAmount: string;
  pendingPaymentAmount: string;
}

export interface RevenueOperationItem {
  bookingId: string;
  version: number;
  status: 'pending_payment' | 'confirmed';
  localStart: string;
  timezone: string;
  serviceName: string;
  totalAmount: string;
  depositRequiredAmount: string;
  paidAmount: string;
  refundedAmount: string;
  currency: string;
  attributionSource: string;
}

export interface RevenueOutcomeSummary {
  ok: true;
  pageId: string;
  period: { from: string; to: string; timezone: string };
  currency: string;
  outcome: RevenueOutcomeTotals;
  operations: {
    pendingPayments: RevenueOperationItem[];
    pastAppointments: RevenueOperationItem[];
    upcomingUnacknowledged: RevenueOperationItem[];
  };
  readiness: {
    hasKit: boolean;
    isPublished: boolean;
    activeServiceCount: number;
    hasFutureAvailability: boolean;
    depositSelected: boolean;
    hasValidPaymentInstructions: boolean;
    hasMixedCurrencies: boolean;
    attributedExternalVisitCount: number;
  };
  funnel: {
    serviceViewed: number;
    bookingStarted: number;
    bookingCreated: number;
    bookingPaid: number;
    bookingCompleted: number;
  };
  bySource: Array<{
    source: string;
    serviceViewed: number;
    bookingStarted: number;
    bookingCreated: number;
    bookingPaid: number;
    bookingCompleted: number;
    netCollectedAmount: string;
    currency: string;
  }>;
  metadata: {
    generatedAt: string;
    provisionalCompletionDays: 7;
    provisionalFrom: string;
    moneySource: 'booking_payment_ledger_projection';
  };
}

export type RevenueOutcomeServiceResult =
  | { ok: true; value: RevenueOutcomeSummary }
  | { ok: false; error: string };

type UnknownRecord = Record<string, unknown>;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const decimalPattern = /^\d+(?:\.\d{2})$/;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isDecimal(value: unknown): value is string {
  return typeof value === 'string' && decimalPattern.test(value);
}

function hasExactKeys(value: UnknownRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function isOperationItem(value: unknown): value is RevenueOperationItem {
  if (!isRecord(value) || !hasExactKeys(value, [
    'bookingId', 'version', 'status', 'localStart', 'timezone', 'serviceName',
    'totalAmount', 'depositRequiredAmount', 'paidAmount', 'refundedAmount',
    'currency', 'attributionSource',
  ])) return false;

  return isString(value.bookingId)
    && isCount(value.version) && value.version > 0
    && (value.status === 'pending_payment' || value.status === 'confirmed')
    && isString(value.localStart)
    && isString(value.timezone)
    && isString(value.serviceName)
    && isDecimal(value.totalAmount)
    && isDecimal(value.depositRequiredAmount)
    && isDecimal(value.paidAmount)
    && isDecimal(value.refundedAmount)
    && isString(value.currency)
    && isString(value.attributionSource);
}

function isOutcome(value: unknown): value is RevenueOutcomeTotals {
  if (!isRecord(value) || !hasExactKeys(value, [
    'paidCompletedCount', 'freeCompletedCount', 'noShowCount', 'pendingPaymentCount',
    'bookingCount', 'collectedAmount', 'refundedAmount', 'netCollectedAmount',
    'pendingPaymentAmount',
  ])) return false;

  return [
    value.paidCompletedCount,
    value.freeCompletedCount,
    value.noShowCount,
    value.pendingPaymentCount,
    value.bookingCount,
  ].every(isCount)
    && [
      value.collectedAmount,
      value.refundedAmount,
      value.netCollectedAmount,
      value.pendingPaymentAmount,
    ].every(isDecimal);
}

function isOperations(value: unknown): value is RevenueOutcomeSummary['operations'] {
  if (!isRecord(value) || !hasExactKeys(value, [
    'pendingPayments', 'pastAppointments', 'upcomingUnacknowledged',
  ])) return false;
  return [value.pendingPayments, value.pastAppointments, value.upcomingUnacknowledged]
    .every((items) => Array.isArray(items) && items.every(isOperationItem));
}

function isReadiness(value: unknown): value is RevenueOutcomeSummary['readiness'] {
  if (!isRecord(value) || !hasExactKeys(value, [
    'hasKit', 'isPublished', 'activeServiceCount', 'hasFutureAvailability',
    'depositSelected', 'hasValidPaymentInstructions', 'hasMixedCurrencies',
    'attributedExternalVisitCount',
  ])) return false;
  return typeof value.hasKit === 'boolean'
    && typeof value.isPublished === 'boolean'
    && isCount(value.activeServiceCount)
    && typeof value.hasFutureAvailability === 'boolean'
    && typeof value.depositSelected === 'boolean'
    && typeof value.hasValidPaymentInstructions === 'boolean'
    && typeof value.hasMixedCurrencies === 'boolean'
    && isCount(value.attributedExternalVisitCount);
}

function isFunnel(value: unknown): value is RevenueOutcomeSummary['funnel'] {
  if (!isRecord(value) || !hasExactKeys(value, [
    'serviceViewed', 'bookingStarted', 'bookingCreated', 'bookingPaid', 'bookingCompleted',
  ])) return false;
  return Object.values(value).every(isCount);
}

function isSource(value: unknown): value is RevenueOutcomeSummary['bySource'][number] {
  if (!isRecord(value) || !hasExactKeys(value, [
    'source', 'serviceViewed', 'bookingStarted', 'bookingCreated', 'bookingPaid',
    'bookingCompleted', 'netCollectedAmount', 'currency',
  ])) return false;
  return isString(value.source)
    && isCount(value.serviceViewed)
    && isCount(value.bookingStarted)
    && isCount(value.bookingCreated)
    && isCount(value.bookingPaid)
    && isCount(value.bookingCompleted)
    && isDecimal(value.netCollectedAmount)
    && isString(value.currency);
}

function isRevenueOutcomeSummary(value: unknown): value is RevenueOutcomeSummary {
  if (!isRecord(value) || !hasExactKeys(value, [
    'ok', 'pageId', 'period', 'currency', 'outcome', 'operations', 'readiness',
    'funnel', 'bySource', 'metadata',
  ])) return false;
  if (value.ok !== true || !isString(value.pageId) || !isString(value.currency)) return false;

  const period = value.period;
  const metadata = value.metadata;
  return isRecord(period)
    && hasExactKeys(period, ['from', 'to', 'timezone'])
    && typeof period.from === 'string' && datePattern.test(period.from)
    && typeof period.to === 'string' && datePattern.test(period.to)
    && isString(period.timezone)
    && isOutcome(value.outcome)
    && isOperations(value.operations)
    && isReadiness(value.readiness)
    && isFunnel(value.funnel)
    && Array.isArray(value.bySource) && value.bySource.every(isSource)
    && isRecord(metadata)
    && hasExactKeys(metadata, [
      'generatedAt', 'provisionalCompletionDays', 'provisionalFrom', 'moneySource',
    ])
    && isString(metadata.generatedAt)
    && metadata.provisionalCompletionDays === 7
    && typeof metadata.provisionalFrom === 'string'
    && datePattern.test(metadata.provisionalFrom)
    && metadata.moneySource === 'booking_payment_ledger_projection';
}

function rpcError(error: { message?: string; code?: string } | null): string {
  return error?.code || error?.message || 'request_failed';
}

export async function fetchRevenueOutcomeSummary(
  pageId: string,
  from: string,
  to: string,
): Promise<RevenueOutcomeServiceResult> {
  const { data, error } = await supabase.rpc('get_revenue_outcome_summary', {
    p_page_id: pageId,
    p_from: from,
    p_to: to,
  });

  if (error) return { ok: false, error: rpcError(error) };
  if (isRecord(data) && data.ok === false && isString(data.code)) {
    return { ok: false, error: data.code };
  }
  if (!isRevenueOutcomeSummary(data)) {
    return { ok: false, error: 'invalid_outcome_summary' };
  }
  return { ok: true, value: data };
}
