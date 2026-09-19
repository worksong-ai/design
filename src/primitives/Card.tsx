/**
 * Card.
 *
 * The surface everything in this product sits on — a conversation row, an
 * approval block, a run result. The recipe is small enough to retype (`surface`
 * fill, `radius.lg` corner, which is Worksong's `cardRadius` so ported screens
 * line up pixel for pixel), and that is precisely why it drifts when it is not
 * a component.
 *
 * Two things it guarantees that an inline `View` does not:
 *
 *   - **A card that does nothing is not announced as a button.** `onPress` is
 *     what promotes it to a `Pressable`; without one there is no button role,
 *     so a list of read-only cards does not read to a screen reader as a
 *     screenful of controls that swallow taps.
 *   - **Elevation reaches both platforms.** iOS reads `shadow*` and Android
 *     reads `elevation`, so a hand-written shadow is flat on whichever platform
 *     the author was not looking at. The token carries both.
 */
import { Children, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { darkColors, type ColorScheme } from '../tokens/colors.js';
import {
  elevation,
  pressedOpacity,
  radius,
  size,
  space,
  type ElevationToken,
  type SpaceToken,
} from '../tokens/space.js';
import { scaledMinHeight } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedFontScale } from './useFontScale.js';

export interface CardProps {
  children?: ReactNode;
  /** Promotes the whole card to a button. Omit for an inert surface. */
  onPress?: () => void;
  elevation?: ElevationToken;
  /** Inner inset, from the 4pt scale. */
  padding?: SpaceToken;
  scheme?: ColorScheme;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** OS font scale, for the minimum-height calculation. */
  fontScale?: number;
}

/**
 * Bare text children go through the `Text` primitive.
 *
 * A raw string inside a `View` throws on native, and `Text` is also what caps
 * the font scale and detects direction, so `<Card>שלום</Card>` still aligns
 * right. Mixed children are passed through untouched: they are already
 * composed, and only the caller knows which fragments belong on one line.
 */
function withTextChildren(children: ReactNode, scheme: ColorScheme): ReactNode {
  const parts = Children.toArray(children);
  const bareText =
    parts.length > 0 &&
    parts.every((part) => typeof part === 'string' || typeof part === 'number');
  return bareText ? <Text scheme={scheme}>{children}</Text> : children;
}

export function Card({
  children,
  onPress,
  elevation: elevationName = 'none',
  padding = 4,
  scheme = darkColors,
  testID,
  accessibilityLabel,
  style,
  fontScale,
}: CardProps) {
  // The prop wins when given (tests pin a scale); otherwise the device decides.
  const resolvedFontScale = useResolvedFontScale(fontScale);
  const surface: ViewStyle = {
    backgroundColor: scheme.surface,
    borderRadius: radius.lg,
    padding: space[padding],
    // Spread, not picked apart: half of these props are iOS-only and half are
    // Android-only, and taking one without the other is the bug.
    ...elevation[elevationName],
  };
  const content = withTextChildren(children, scheme);

  if (onPress === undefined) {
    return (
      <View
        // No role and no state: a card nobody can tap must not be announced as
        // a button. A label, when given, also has to make this one focusable
        // node — a label on a view the cursor never lands on is never read.
        {...(accessibilityLabel === undefined ? {} : { accessible: true, accessibilityLabel })}
        testID={testID}
        style={[surface, style]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        surface,
        {
          // Most cards clear 44pt on content alone; a one-line one does not,
          // and it grows with the font scale for the same reason Button's
          // does. `body` because that is what card content is set in, and it
          // is the token allowed to stretch furthest.
          minHeight: scaledMinHeight(size.touchTarget, 'body', resolvedFontScale),
          opacity: pressed ? pressedOpacity : 1,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}
