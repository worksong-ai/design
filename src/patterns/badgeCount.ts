/** Largest count drawn verbatim. Past it a badge reads "99+". */
export const BADGE_CAP = 99;

/**
 * The text of a numeric badge, or `null` when there is nothing to show.
 *
 * "99+" exists to protect a layout; a screen reader has none, so a consumer's
 * accessibility label should carry the real number.
 */
export function formatBadgeCount(count: number | null | undefined, cap: number = BADGE_CAP): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const whole = Math.floor(count);
  if (whole <= 0) return null;
  return whole > cap ? `${cap}+` : String(whole);
}
