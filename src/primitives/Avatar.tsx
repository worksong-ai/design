/**
 * Avatar.
 *
 * The bot identity mark — `avatarColor` and `avatarShape` off a bot profile,
 * drawn as a filled badge carrying the bot's initials. Worksong has no avatar
 * component at all; the bot web has one, and this is its mobile counterpart.
 *
 * Two places it deliberately differs from the web's:
 *
 *   - **The label colour is derived, not fixed.** `avatarColor` is whatever
 *     `#rrggbb` the person who created the bot typed, so it lands anywhere from
 *     near-black to pure yellow. The web pins white and softens the unreadable
 *     half with a text-shadow, which RN has no equivalent of, so here the
 *     better-contrasting of the scheme's two label colours simply wins.
 *   - **The mark names itself.** The web hides it from assistive technology
 *     because the bot's name always sits beside it — true of that layout, not
 *     something a shared primitive can assume of every caller.
 */
import { StyleSheet, View } from 'react-native';

import { contrastRatio, type ColorScheme } from '../tokens/colors.js';
import { radius, size } from '../tokens/space.js';
import type { TypeTokenName } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedScheme } from './useScheme.js';

/** Mirrors `AVATAR_SHAPES` in the bot contract, which this package cannot import. */
export type AvatarShape = 'circle' | 'squircle' | 'hexagon' | 'shield' | 'diamond';
export type AvatarSize = 'small' | 'medium' | 'large';

export interface AvatarProps {
  /** Full name. The badge shows its initials and is labelled with the whole thing. */
  name: string;
  /** `#rrggbb`, straight off `bot.avatarColor`. Defaults to the scheme's accent. */
  color?: string;
  shape?: AvatarShape;
  size?: AvatarSize;
  scheme?: ColorScheme;
  testID?: string;
}

const SIZES: Record<AvatarSize, { diameter: number; type: TypeTokenName }> = {
  // The web sizes its glyph at 0.38 of the diameter; on these two diameters
  // that rule lands on 11 and 15, which are exactly `tiny` and `callout`.
  small: { diameter: size.avatarSmall, type: 'tiny' },
  medium: { diameter: size.avatar, type: 'callout' },
  // 0.38 × 64 ≈ 24; `title` (22) is the nearest token and keeps two initials
  // inside the badge at the largest font scale `title` allows.
  large: { diameter: size.avatarLarge, type: 'title' },
};

const SHAPE_RADIUS: Record<AvatarShape, number> = {
  circle: radius.full,
  squircle: radius.md,
  // The web draws these three as `clip-path` polygons. React Native has no
  // clip-path, so an honest hexagon needs an SVG mask and this package takes no
  // SVG dependency — a small corner radius stands in, and is a stand-in rather
  // than the shape.
  hexagon: radius.sm,
  shield: radius.sm,
  diamond: radius.sm,
};

/** Shown when a name yields no letters at all — a blank badge reads as a bug. */
const NO_INITIALS = '?';

/**
 * Initials for a name: the first letter of each of the first two words.
 *
 * Punctuation is skipped per word, so `@ada`, `(Ada)` and `Ada` initial alike —
 * bot names are free text and routinely arrive decorated.
 *
 * `@bot/shared` exports an `initialsOf`, but this package deliberately does not
 * depend on the bot contract (it ships to the Worksong app too), and the two
 * rules differ: this takes the first two words where the web's takes the first
 * and the last.
 */
export function initialsFrom(name: string): string {
  const letters: string[] = [];
  for (const word of name.split(/\s+/)) {
    const first = /[\p{L}\p{N}]/u.exec(word)?.[0];
    if (first === undefined) continue;
    letters.push(first.toUpperCase());
    if (letters.length === 2) break;
  }
  return letters.length === 0 ? NO_INITIALS : letters.join('');
}

/**
 * Whichever of the scheme's two label colours contrasts better against `fill`.
 *
 * Falls back to `onAccent` when either ratio is unknown: a colour
 * `contrastRatio` cannot parse is one we have no basis to choose against.
 */
function labelColor(fill: string, scheme: ColorScheme): string {
  const againstOnAccent = contrastRatio(fill, scheme.onAccent) ?? 0;
  const againstPrimary = contrastRatio(fill, scheme.textPrimary) ?? 0;
  return againstPrimary > againstOnAccent ? scheme.textPrimary : scheme.onAccent;
}

export function Avatar({
  name,
  color,
  shape = 'circle',
  size: sizeName = 'medium',
  scheme: schemeOverride,
  testID,
}: AvatarProps) {
  const scheme = useResolvedScheme(schemeOverride);
  const metrics = SIZES[sizeName];
  const fill = color ?? scheme.accent;

  return (
    <View
      // One element to assistive technology, named for the bot: "AL" read aloud
      // is noise, the name is the information.
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      testID={testID}
      style={[
        styles.base,
        {
          width: metrics.diameter,
          height: metrics.diameter,
          borderRadius: SHAPE_RADIUS[shape],
          backgroundColor: fill,
        },
      ]}
    >
      <Text
        variant={metrics.type}
        color={labelColor(fill, scheme)}
        scheme={scheme}
        // Two Hebrew initials have to order right-to-left, and only the text
        // node knows which script it was handed.
        direction="auto"
        numberOfLines={1}
        // The house rule is to cap font scaling rather than disable it, and that
        // rule protects information. These letters are a redundant restatement
        // of the label above them inside a box whose diameter is fixed by the
        // row: growing them clips the badge without telling anyone anything new.
        maxFontSizeMultiplier={1}
      >
        {initialsFrom(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Clipped, not spilling: an initial that paints past the fill reads as a
  // rendering bug on the one element meant to identify the bot.
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
