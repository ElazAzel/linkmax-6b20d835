import { formatMoney, parseMoney } from './money';

export type DepositConfiguration =
  | { mode: 'none'; value: string }
  | { mode: 'fixed'; value: string }
  | { mode: 'percent'; value: string };

interface ServiceOfferingInput {
  name: string;
  durationMinutes: number;
  priceAmount: string;
  currency: string;
}

type ServiceOfferingValidationError =
  | 'name_required'
  | 'duration_minutes_invalid'
  | 'price_amount_invalid'
  | 'currency_invalid';

type ServiceOfferingValidationResult =
  | { ok: true }
  | { ok: false; errors: ServiceOfferingValidationError[] };

export function calculateDepositAmount(configuration: DepositConfiguration, priceAmount: string): string {
  const priceMinor = parseMoney(priceAmount);
  const valueMinor = parseMoney(configuration.value);

  if (configuration.mode === 'none') {
    if (valueMinor !== 0n) {
      throw new Error('deposit_configuration_invalid');
    }

    return '0.00';
  }

  if (configuration.mode === 'fixed') {
    if (valueMinor > priceMinor) {
      throw new Error('deposit_exceeds_price');
    }

    return formatMoney(valueMinor);
  }

  if (valueMinor < 100n || valueMinor > 10_000n) {
    throw new Error('deposit_percentage_invalid');
  }

  const depositMinor = (priceMinor * valueMinor + 5_000n) / 10_000n;
  return formatMoney(depositMinor);
}

export function validateServiceOffering(input: ServiceOfferingInput): ServiceOfferingValidationResult {
  const errors: ServiceOfferingValidationError[] = [];

  if (input.name.trim().length === 0) {
    errors.push('name_required');
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 720) {
    errors.push('duration_minutes_invalid');
  }

  try {
    parseMoney(input.priceAmount);
  } catch {
    errors.push('price_amount_invalid');
  }

  if (!/^[A-Z]{3}$/.test(input.currency)) {
    errors.push('currency_invalid');
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
