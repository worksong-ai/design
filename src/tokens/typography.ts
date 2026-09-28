/**
 * Type scale.
 *
 * The sizes and weights are Worksong's `NDFont` verbatim, so ported screens
 * match. What is added is `lineHeight` and `letterSpacing`, which `NDFont` omits
 * entirely — RN then falls back to a platform default line height that differs
 * between iOS and Android, so multi-line text sets to different heights on the
 * two platforms from identical styles.
 *
 * `fontFamily` is deliberately absent. It is platform-dependent (`ui-rounded`
 * on iOS, a CSS variable on web, nothing on Android), and resolving it here
 * would force this module to import from react-native and stop being testable
 * outside a native runtime. The primitives layer applies it.
 */

export interface TypeToken {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing: number;
}

/**
 * Line height from font size.
 *
 * Tighter as text grows: 1.45 at caption sizes down to 1.15 for display
 * numbers, which is roughly how optical line spacing works — large text needs
 * proportionally less leading to read as one block.
 */
function lineHeightFor(fontSize: number): number {
  const ratio = fontSize >= 34 ? 1.15 : fontSize >= 22 ? 1.25 : fontSize >= 17 ? 1.35 : 1.45;
  return Math.round(fontSize * ratio);
}

function token(
  fontSize: number,
  fontWeight: TypeToken['fontWeight'],
  letterSpacing = 0,
): TypeToken {
  return { fontSize, fontWeight, lineHeight: lineHeightFor(fontSize), letterSpacing };
}

export const typography = {
  /** 40 / bold. Display numbers — spend, counts. */
  largeNumber: token(40, '700', -0.5),
  /** 28 / bold. Tab-screen title. */
  screenTitle: token(28, '700', -0.3),
  /** 22 / bold. */
  title: token(22, '700', -0.2),
  /** 18 / semibold. */
  sectionTitle: token(18, '600'),
  /** 17 / semibold. */
  headline: token(17, '600'),
  /** 16 / regular. Body copy and chat messages. */
  body: token(16, '400'),
  /** 15 / medium. */
  callout: token(15, '500'),
  /** 13 / regular. */
  caption: token(13, '400'),
  /** 11 / semibold. Badges and overlines. */
  tiny: token(11, '600', 0.3),
  /** 14 / semibold. Token counts and other tabular data. */
  mono: token(14, '600'),
} as const;

export type TypeTokenName = keyof typeof typography;

/**
 * Cap on how far the OS font-scale setting may stretch a given token.
 *
 * RN's `allowFontScaling` defaults to true, so text grows with iOS Dynamic Type
 * while fixed-height containers do not — at the largest accessibility sizes
 * Worksong's 56pt rows clip and its 34x34 play button crops its glyph. Rather
 * than turn scaling off (which fails the users who need it), each token
 * declares how far it may stretch, and the layout primitives grow their minimum
 * heights by the same factor.
 *
 * Display text is capped hardest because it is already large; body text is
 * allowed the most, because that is the text people actually need to read.
 */
export const maxFontScale: Record<TypeTokenName, number> = {
  largeNumber: 1.3,
  screenTitle: 1.4,
  title: 1.4,
  sectionTitle: 1.5,
  headline: 1.6,
  body: 2.0,
  callout: 1.8,
  caption: 1.8,
  tiny: 1.6,
  mono: 1.5,
};

/**
 * Effective scale factor for a token at a given OS font scale.
 *
 * Never below 1: a user who has *shrunk* their system text still gets legible
 * UI chrome, which is the same reason the caps exist in the other direction.
 */
export function clampFontScale(token: TypeTokenName, osFontScale: number): number {
  if (!Number.isFinite(osFontScale)) return 1;
  return Math.min(Math.max(osFontScale, 1), maxFontScale[token]);
}

/**
 * Minimum height a container must have to fit `token` at the current font
 * scale without clipping.
 *
 * `base` is the design-time height (e.g. a 56pt row). The result never shrinks
 * below it.
 */
export function scaledMinHeight(
  base: number,
  token: TypeTokenName,
  osFontScale: number,
): number {
  const scale = clampFontScale(token, osFontScale);
  const textHeight = typography[token].lineHeight * scale;
  const padding = base - typography[token].lineHeight;
  return Math.round(Math.max(base, textHeight + Math.max(padding, 0)));
}
