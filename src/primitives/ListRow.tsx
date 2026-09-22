/**
 * ListRow.
 *
 * The workhorse of every list screen — bots, conversations, connectors,
 * settings. Worksong re-types this shape in each of those screens against its
 * one layout token, `rowHeight: 56`, applied as a fixed `height`. At the larger
 * Dynamic Type sizes that row clips its own text, and a long bot name pushes
 * the trailing value off the edge because nothing in the hand-rolled version
 * shrinks.
 *
 * Both of those are fixed here rather than at the call sites:
 *
 *   - the 56pt is a **floor** (`scaledMinHeight`), so the row grows with the
 *     font scale instead of cropping the string it exists to show;
 *   - the text column is the only flexible child, so a long title ellipsises
 *     and `trailing` keeps its size.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import type { ColorScheme } from '../tokens/colors.js';
import { pressedOpacity, screenPadding, size, space } from '../tokens/space.js';
import { scaledMinHeight } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedFontScale } from './useFontScale.js';
import { useResolvedScheme } from './useScheme.js';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Before the text column — an avatar, status dot or icon. */
  leading?: ReactNode;
  /** After the text column — a value, badge or switch. */
  trailing?: ReactNode;
  /** Omit for an inert row; presence of this is what makes the row tappable. */
  onPress?: () => void;
  selected?: boolean;
  /** Paints the title in the red token. Does not block the press. */
  destructive?: boolean;
  /** Disclosure affordance for a row that pushes a screen. */
  showChevron?: boolean;
  scheme?: ColorScheme;
  testID?: string;
  accessibilityHint?: string;
  /** OS font scale, for the minimum-height calculation. */
  fontScale?: number;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  selected = false,
  destructive = false,
  showChevron = false,
  scheme: schemeOverride,
  testID,
  accessibilityHint,
  fontScale,
}: ListRowProps) {
  const scheme = useResolvedScheme(schemeOverride);
  // The prop wins when given (tests pin a scale); otherwise the device decides.
  const resolvedFontScale = useResolvedFontScale(fontScale);
  const frame: ViewStyle = {
    // A floor, never a fixed height: this is the exact Worksong failure — 56pt
    // rows crop their text at large Dynamic Type sizes.
    minHeight: scaledMinHeight(size.row, 'body', resolvedFontScale),
    backgroundColor: selected ? scheme.surfaceElevated : 'transparent',
    borderBottomColor: scheme.separator,
  };

  const content = (
    <>
      {leading}
      <View style={styles.column}>
        <Text
          variant="body"
          color={destructive ? 'red' : 'textPrimary'}
          scheme={scheme}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text
            variant="caption"
            color="textSecondary"
            scheme={scheme}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron ? (
        // Drawn as type rather than an icon font: this package has no icon
        // dependency, and a glyph scales with the row instead of staying 20pt
        // next to 32pt text. Hidden from assistive tech — the role already says
        // "button", and the label would otherwise end in "greater-than sign".
        <Text
          variant="body"
          color="textTertiary"
          scheme={scheme}
          direction="ltr"
          accessible={false}
          testID="list-row-chevron"
        >
          {'›'}
        </Text>
      ) : null}
    </>
  );

  if (onPress === undefined) {
    // No role and no handler: an inert row must not be announced as tappable.
    return (
      <View testID={testID} style={[styles.row, frame]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      // Explicit, so the subtitle is read as part of the row rather than as a
      // second stop, and so the chevron cannot leak into the announcement.
      accessibilityLabel={subtitle === undefined ? title : `${title}, ${subtitle}`}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.row, frame, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space[3],
    paddingHorizontal: screenPadding,
    // Vertical padding as well as a minimum height, so text that has grown past
    // the floor still clears the separator.
    paddingVertical: space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  /** The only flexible child, so the title gives way and `trailing` does not. */
  column: { flex: 1 },
  pressed: { opacity: pressedOpacity },
});
