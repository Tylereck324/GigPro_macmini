export function parseSixDigitPin(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('PIN must be a string');
  }

  if (!/^\d{6}$/.test(input)) {
    throw new Error('PIN must be exactly 6 digits');
  }

  return input;
}

