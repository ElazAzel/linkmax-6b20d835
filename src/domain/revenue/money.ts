const MONEY_PATTERN = /^(0|[1-9]\d{0,9})(?:\.(\d{1,2}))?$/;

export function parseMoney(value: string): bigint {
  const match = MONEY_PATTERN.exec(value);

  if (!match) {
    throw new Error('invalid_money');
  }

  const whole = BigInt(match[1]);
  const fractional = (match[2] ?? '').padEnd(2, '0');

  return whole * 100n + BigInt(fractional || '0');
}

export function formatMoney(minorUnits: bigint): string {
  const isNegative = minorUnits < 0n;
  const absolute = isNegative ? -minorUnits : minorUnits;
  const whole = absolute / 100n;
  const fractional = (absolute % 100n).toString().padStart(2, '0');

  return `${isNegative ? '-' : ''}${whole.toString()}.${fractional}`;
}
