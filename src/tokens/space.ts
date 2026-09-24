/**
 * Spacing, radius and elevation scales.
 *
 * Worksong has three layout tokens in total — `screenPadding` 16,
 * `cardRadius` 14, `rowHeight` 56 — so every other gap, inset and corner in
 * that app is an inline number. The result is a set of pressed states at 0.6,
 * 0.7, 0.8 and 0.85 depending on which file you open, and pill buttons whose
 * padding is re-typed at each call site.
 *
 * These scales exist so the bot app does not inherit that. The three Worksong
 * values are kept at their exact numbers, so anything ported across lines up
 * pixel for pixel; the rest fills in the gaps they left.
 */

/** 4pt grid. `space[4]` is 16 — the value Worksong calls `screenPadding`. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpaceToken = keyof typeof space;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  /** Worksong's `cardRadius`. Cards and sheets. */
  lg: 14,
  xl: 20,
  /** Pills and avatars. */
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;

/**
 * Minimum hit and row sizes, in points.
 *
 * `touchTarget` is 44 because that is the smallest reliably tappable size on
 * both platforms; anything interactive should meet it even when its visual box
 * is smaller.
 */
export const size = {
  /** Worksong's `rowHeight`. */
  row: 56,
  rowCompact: 44,
  touchTarget: 44,
  icon: 20,
  iconLarge: 24,
  avatar: 40,
  avatarSmall: 28,
  /** A details page's identity header (#212) — the one place an entity is the subject. */
  avatarLarge: 64,
} as const;

export type SizeToken = keyof typeof size;

/** Screen edge inset. Worksong's `screenPadding`. */
export const screenPadding = space[4];

/**
 * Opacity for a pressed control.
 *
 * One value, not four. Worksong varies this per file, which reads as
 * inconsistency rather than intent.
 */
export const pressedOpacity = 0.7;

/** Opacity for a disabled control. */
export const disabledOpacity = 0.35;

/**
 * Elevation, expressed as the shadow props React Native actually takes.
 *
 * iOS reads `shadow*`, Android reads `elevation`; both are returned together so
 * a caller spreads one object and gets the right result on each platform.
 */
import { darkColors } from './colors.js';

export interface Elevation {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

function makeElevation(level: 0 | 1 | 2 | 3): Elevation {
  const table = {
    0: { opacity: 0, radius: 0, y: 0, android: 0 },
    1: { opacity: 0.18, radius: 4, y: 1, android: 2 },
    2: { opacity: 0.24, radius: 10, y: 4, android: 6 },
    3: { opacity: 0.32, radius: 20, y: 8, android: 12 },
  } as const;
  const { opacity, radius: r, y, android } = table[level];
  return {
    shadowColor: darkColors.shadow,
    shadowOpacity: opacity,
    shadowRadius: r,
    shadowOffset: { width: 0, height: y },
    elevation: android,
  };
}

export const elevation = {
  none: makeElevation(0),
  low: makeElevation(1),
  medium: makeElevation(2),
  high: makeElevation(3),
} as const;

export type ElevationToken = keyof typeof elevation;
