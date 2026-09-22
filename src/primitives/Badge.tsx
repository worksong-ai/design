/**
 * Badge.
 *
 * The status pill that run rows, approval cards and bot headers all need.
 * Worksong ships `statusColor` but nothing that draws it, so every surface
 * picks its own pill geometry and decides for itself which statuses are good
 * news — which is how the same run reads green in a list and grey in a header.
 *
 * Two things it guarantees:
 *
 *   - **`status` outranks `tone`.** A caller holding a raw API status passes it
 *     straight through and gets the same colour the status dot next to it will
 *     get, because both resolve through `statusColor`. A caller with no status
 *     picks a tone by hand. Letting `tone` win would let the two drift apart on
 *     the one screen that passes both.
 *   - **Colour is never the only signal.** The accessibility label carries what
 *     the tone means, so a screen reader hears "Queued, warning" rather than a
 *     bare word whose significance lived entirely in a border colour.
 *
 * Deliberately not interactive, so the 44pt rule does not apply — a badge is
 * not a tap target and a 44pt pill would read as a button. It still grows with
 * the font scale: `tiny` text at the top Dynamic Type sizes overflows a fixed
 * 24pt pill the same way Worksong's fixed 56pt rows clip.
 */
import { StyleSheet, View } from 'react-native';

import { statusColor, type ColorScheme } from '../tokens/colors.js';
import { radius, space } from '../tokens/space.js';
import { scaledMinHeight } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedFontScale } from './useFontScale.js';
import { useResolvedScheme } from './useScheme.js';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** A raw API status. Wins over `tone`, resolved via `statusColor`. */
  status?: string;
  scheme?: ColorScheme;
  testID?: string;
  /** OS font scale, for the minimum-height calculation. */
  fontScale?: number;
}

/** Design-time pill height: `tiny`'s line height plus the vertical padding. */
const PILL_HEIGHT = space[6];

/**
 * What the colour is telling a sighted user, in words.
 *
 * `danger` reads as "error" rather than "danger" because that is the word the
 * product uses for the state and the one a listener maps to a failed run.
 */
const TONE_MEANING: Record<BadgeTone, string> = {
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'information',
};

function toneColor(tone: BadgeTone, scheme: ColorScheme): string {
  switch (tone) {
    case 'neutral':
      return scheme.textSecondary;
    case 'success':
      return scheme.green;
    case 'warning':
      return scheme.yellow;
    case 'danger':
      return scheme.red;
    case 'info':
      return scheme.blue;
  }
}

/**
 * The tone a status maps to.
 *
 * Derived from `statusColor` rather than from a second copy of its vocabulary,
 * so adding a status there cannot leave this component behind. An unmapped
 * status lands on `info`, matching that function's deliberate choice not to
 * invent a problem out of a word nobody has classified.
 */
function toneForStatus(status: string, scheme: ColorScheme): BadgeTone {
  const color = statusColor(status, scheme);
  if (color === scheme.green) return 'success';
  if (color === scheme.yellow) return 'warning';
  if (color === scheme.red) return 'danger';
  return 'info';
}

export function Badge({
  label,
  tone = 'neutral',
  status,
  scheme: schemeOverride,
  testID,
  fontScale,
}: BadgeProps) {
  const scheme = useResolvedScheme(schemeOverride);
  // The prop wins when given (tests pin a scale); otherwise the device decides.
  const resolvedFontScale = useResolvedFontScale(fontScale);
  // `status` wins: it is the value the row's dot is also drawn from.
  const resolvedTone = status === undefined ? tone : toneForStatus(status, scheme);
  const color = toneColor(resolvedTone, scheme);

  return (
    <View
      // One node, so the label and its meaning are announced together instead of
      // as a stray word in the middle of a row.
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}, ${TONE_MEANING[resolvedTone]}`}
      testID={testID}
      style={[
        styles.pill,
        {
          // A low-emphasis fill would need an alpha of the tone colour, which
          // only exists as a literal. The surface token gets the same effect
          // and stays in the palette.
          backgroundColor: scheme.surface,
          borderColor: color,
          minHeight: scaledMinHeight(PILL_HEIGHT, 'tiny', resolvedFontScale),
        },
      ]}
    >
      {/* Detected, not pinned: statuses arrive translated and Hebrew ones set
          right-to-left inside the pill. */}
      <Text variant="tiny" color={color} scheme={scheme} direction="auto" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.full,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
});
