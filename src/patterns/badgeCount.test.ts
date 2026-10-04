import { describe, expect, it } from 'vitest';

import { formatBadgeCount } from './badgeCount.js';

describe('formatBadgeCount', () => {
  it('draws nothing for no count, zero, negatives and non-numbers', () => {
    for (const v of [null, undefined, 0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formatBadgeCount(v)).toBeNull();
    }
  });

  it('draws a count verbatim up to the cap and "99+" past it', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(3.9)).toBe('3');
    expect(formatBadgeCount(99)).toBe('99');
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(20, 9)).toBe('9+');
  });
});
