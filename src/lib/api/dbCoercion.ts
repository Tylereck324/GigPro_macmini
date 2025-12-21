// Numeric coercion helpers for PostgREST/Supabase responses.
// Postgres numeric/decimal types are commonly returned as strings.

export function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (value === null || value === undefined) return fallback;

  const parsed = Number(value as any);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function coerceNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const parsed = coerceNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceInteger(value: unknown, fallback = 0): number {
  const parsed = coerceNumber(value, fallback);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function coerceNullableInteger(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = coerceInteger(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}
