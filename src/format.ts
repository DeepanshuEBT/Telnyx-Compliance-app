/**
 * Telnyx sends money as a 5dp string ("2.00000"). Render it the way a price is
 * normally written, and never silently drop a cost that is genuinely zero.
 */
export function formatCost(value?: string | null, currency?: string | null): string {
  if (value === undefined || value === null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${amount.toFixed(2)}${currency ? ` ${currency}` : ''}`;
}

export function costAmount(value?: string | null): number {
  const amount = Number(value ?? NaN);
  return Number.isNaN(amount) ? 0 : amount;
}

/**
 * Telnyx returns region info as an unordered list of typed entries, so indexing
 * into it picks a different field per country. Compose it the way the Telnyx
 * console does: location, state, country.
 *
 * The values come back masked ("---", "--") on restricted accounts.
 */
export function formatRegion(
  regions?: { region_name?: string; region_type?: string }[],
): string {
  if (!regions?.length) return '—';

  const byType = new Map(
    regions.map((region) => [region.region_type, region.region_name]),
  );
  const parts = ['location', 'state', 'country_code']
    .map((type) => byType.get(type))
    .filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(', ') : '—';
}

export function formatRateCenter(
  regions?: { region_name?: string; region_type?: string }[],
): string {
  const rateCenter = regions?.find(
    (region) => region.region_type === 'rate_center',
  )?.region_name;
  return rateCenter || '—';
}
