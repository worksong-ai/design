/**
 * Button.
 *
 * Five variants by three sizes, matching the bot web's primitive set so the two
 * clients offer the same vocabulary. Worksong has no button component at all —
 * the pill recipe (`paddingHorizontal: 18, paddingVertical: 11, borderRadius:
 * 999`) is re-typed in confirm-sheet, rename-modal and approval-card, with
 * pressed opacity varying by file.
 *
 * Two things it guarantees that a hand-rolled Pressable does not:
 *
 *   - **44pt minimum hit area**, growing with the font scale. A `small` button
 *     is visually smaller but never below the reliable tap threshold.
 *   - **`busy` disables as well as spins.** A button that shows a spinner but
 *     still fires is how double-submits happen, and this product's buttons send
 *     money-spending turns.
 */
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { darkColors, type ColorScheme } from '../tokens/colors.js';
import { disabledOpacity, pressedOpacity, radius, size, space } from '../tokens/space.js';
import { scaledMinHeight, type TypeTokenName } from '../tokens/typography.js';
import { Text } from './Text.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner AND blocks presses. */
  busy?: boolean;
  /** Stretch to the width of the parent. */
  block?: boolean;
  scheme?: ColorScheme;
  testID?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** OS font scale, for the minimum-height calculation. */
  fontScale?: number;
}

const SIZES: Record<ButtonSize, { paddingH: number; paddingV: number; minHeight: number; type: TypeTokenName }> = {
  small: { paddingH: space[3], paddingV: space[2], minHeight: size.touchTarget, type: 'caption' },
  medium: { paddingH: space[5], paddingV: space[3], minHeight: size.touchTarget, type: 'callout' },
  large: { paddingH: space[6], paddingV: space[4], minHeight: size.row, type: 'headline' },
};

function palette(variant: ButtonVariant, scheme: ColorScheme) {
  switch (variant) {
    case 'primary':
      return { background: scheme.accent, label: scheme.onAccent, border: 'transparent' };
    case 'secondary':
      return { background: scheme.surfaceElevated, label: scheme.textPrimary, border: scheme.separator };
    case 'ghost':
      return { background: 'transparent', label: scheme.textPrimary, border: scheme.separator };
    case 'danger':
      return { background: scheme.red, label: scheme.onAccent, border: 'transparent' };
    case 'link':
      return { background: 'transparent', label: scheme.accent, border: 'transparent' };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size: sizeName = 'medium',
  disabled = false,
  busy = false,
  block = false,
  scheme = darkColors,
  testID,
  accessibilityHint,
  style,
  fontScale = 1,
}: ButtonProps) {
  // A spinner that does not also block presses is how a double-submit ships.
  const inert = disabled || busy;
  const metrics = SIZES[sizeName];
  const colors = palette(variant, scheme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy }}
      accessibilityLabel={label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      testID={testID}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: variant === 'secondary' || variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          paddingHorizontal: metrics.paddingH,
          paddingVertical: metrics.paddingV,
          minHeight: scaledMinHeight(metrics.minHeight, metrics.type, fontScale),
          borderRadius: variant === 'link' ? radius.none : radius.full,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: inert ? disabledOpacity : pressed ? pressedOpacity : 1,
        },
        style,
      ]}
    >
      {/* The label stays mounted while busy so the button does not resize. */}
      <Text
        variant={metrics.type}
        color={colors.label}
        scheme={scheme}
        direction="auto"
        numberOfLines={1}
        style={busy ? styles.hidden : undefined}
      >
        {label}
      </Text>
      {busy ? (
        <View style={StyleSheet.absoluteFill as StyleProp<ViewStyle>} pointerEvents="none">
          <View style={styles.center}>
            <ActivityIndicator testID="button-spinner" color={colors.label} size="small" />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
});
