export function decimalToCents(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);

  if (!match) {
    throw new Error(`Invalid monetary value: ${value}`);
  }

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(2, '0'));

  return whole * 100n + fraction;
}

export function centsToDecimal(value: bigint): string {
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, '0');

  return `${whole}.${fraction}`;
}
