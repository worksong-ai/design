/**
 * A circular control whose whole label is a glyph.
 *
 * The compact composer needs six of these and the app had none: until now every
 * control in this product is a text button, and `ListRow` draws its own chevron
 * as the character `›` "because this package has no icon dependency".
 *
 * ## Why it takes a node rather than an icon name
 *
 * `@worksong/design` has no runtime dependencies, and that is a property worth
 * keeping — it is consumed by two apps with different Expo versions. So the
 * glyph arrives as a `ReactNode` and the icon set lives in the app. What this
 * primitive owns is everything that is *not* the drawing: the hit target, the
 * tone, the pressed and disabled states, the busy spinner, and the
 * accessibility label, which is load-bearing here in a way it never is on a
 * text button — a glyph has no text for VoiceOver to read.
 *
 * ## Why `accessibilityLabel` is required
 *
 * Not optional with a fallback. A circular button with no label is invisible to
 * anyone using VoiceOver, and the failure is silent: the control works for
 * everybody who can see it. Making it a required prop is the only version of
 * this that cannot be forgotten.
 *
 * ## Dynamic Type
 *
 * `size.touchTarget` is a floor, not a target. A fixed 44pt circle next to a
 * text field that grows to 200% is an accessibility regression, so the diameter
 * scales with the OS font scale exactly as every other primitive's minimum
 * height does — capped, so it cannot grow past the row that holds it.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { darkColors, type ColorScheme } from '../tokens/colors.js';
import { radius, size } from '../tokens/space.js';
import { useResolvedFontScale } from './useFontScale.js';
import { useResolvedScheme } from './useScheme.js';

export type IconButtonTone =
  /** Sits on the bar itself. The default, and what `+` and the camera are. */
  | 'plain'
  /** A filled circle in the accent colour — Send, and the microphone. */
  | 'accent'
  /** Filled red. A live recording is the only thing that earns it. */
  | 'danger';

export interface IconButtonProps {
  /** The glyph. Sized and coloured by the caller; this only positions it. */
  icon: ReactNode;
  /** What VoiceOver reads. Required: a glyph has no text of its own. */
  accessibilityLabel: string;
  onPress: () => void;
  tone?: IconButtonTone;
  disabled?: boolean;
  busy?: boolean;
  accessibilityHint?: string;
  scheme?: ColorScheme;
  /** OS font scale, for the diameter. Tests pin it; the device supplies it. */
  fontScale?: number;
  testID?: string;
}

/** Beyond this the circle stops growing, or it pushes the field out of the bar. */
const MAX_SCALE = 1.4;

function toneColors(tone: IconButtonTone, scheme: ColorScheme) {
  switch (tone) {
    case 'accent':
      return { background: scheme.accent, border: 'transparent', spinner: scheme.onAccent };
    case 'danger':
      return { background: scheme.red, border: 'transparent', spinner: scheme.onAccent };
    case 'plain':
      return { background: scheme.surface, border: scheme.separator, spinner: scheme.textSecondary };
  }
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = 'plain',
  disabled = false,
  busy = false,
  accessibilityHint,
  scheme: schemeOverride,
  fontScale,
  testID,
}: IconButtonProps) {
  const scheme = useResolvedScheme(schemeOverride);
  const resolvedFontScale = useResolvedFontScale(fontScale);
  // Busy blocks as well as spins: a control that spins and still fires is how a
  // double-submit ships.
  const inert = disabled || busy;
  const colors = toneColors(tone, scheme);
  const diameter = Math.round(size.touchTarget * Math.min(resolvedFontScale, MAX_SCALE));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inert, busy }}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      disabled={inert}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          width: diameter,
          height: diameter,
          borderRadius: radius.full,
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: tone === 'plain' ? StyleSheet.hairlineWidth : 0,
          opacity: inert && !busy ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.spinner} />
      ) : (
        // A view around the glyph so the caller's node cannot affect layout by
        // bringing its own margins.
        <View style={styles.glyph}>{icon}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glyph: { alignItems: 'center', justifyContent: 'center' },
});

/** Exported for the tests, which assert the tone mapping without a renderer. */
export const __iconButtonTone = (tone: IconButtonTone, scheme: ColorScheme = darkColors) =>
  toneColors(tone, scheme);
