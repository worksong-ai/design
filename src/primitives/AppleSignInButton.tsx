/**
 * Sign in with Apple, drawn to Apple's specification.
 *
 * Not `Button variant="secondary"` with a different label. Apple's Human
 * Interface Guidelines fix this control's appearance — colour, corner radius,
 * minimum height, the mark, and the exact wording — and button appearance is
 * one of the things actually checked at review. Anything that merely
 * approximates it is a rejection waiting for a reviewer who knows the spec.
 *
 * Not `expo-apple-authentication`'s `AppleAuthenticationButton` either, which
 * would be the official pixels. That component is a native view attached to
 * the `com.apple.developer.applesignin` entitlement, and this app performs
 * Apple sign-in through Clerk's hosted OAuth in an `ASWebAuthenticationSession`
 * — a flow that needs no entitlement at all. Adding a native module, a pod and
 * an entitlement to obtain a button would be a real cost for a drawing.
 *
 * ## The choices the HIG actually constrains
 *
 * - **Style.** Black, white, or white with an outline; pick the one that
 *   contrasts with the background. This product is dark-only on true black, so
 *   white is the only one of the three that is visible.
 * - **Wording.** "Sign in with Apple" when the flow signs in;
 *   "Continue with Apple" when it may also create the account. Clerk's SSO does
 *   both — a first-time Apple user is registered — so `Continue` is the honest
 *   one and is an approved variant.
 * - **Height.** 44pt minimum, which is also iOS's minimum tap target.
 * - **The mark.** Apple's own glyph, never a redrawn one. `U+F8FF` is the Apple
 *   logo in Apple's system fonts — the mark as Apple draws it, with no icon
 *   font to add and nothing traced by hand. It is private-use, so it renders as
 *   tofu off Apple platforms; the button is iOS-only, which is also the only
 *   platform where 4.8 applies.
 * - **Prominence.** Must sit at least as prominently as any other third-party
 *   login. The caller is responsible for that; this component only guarantees it
 *   is full-width when asked.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { APPLE_BUTTON_MIN_HEIGHT, APPLE_BUTTON_RADIUS, brandColors } from '../tokens/brand.js';
import { space } from '../tokens/space.js';

export interface AppleSignInButtonProps {
  onPress: () => void;
  /** True while the browser round trip is open. */
  busy?: boolean;
  disabled?: boolean;
  /**
   * `continue` when the flow may also create the account, which is what
   * Clerk's SSO does. `signIn` only when it is certain the account exists.
   */
  label?: 'continue' | 'signIn';
  testID?: string;
}

export function AppleSignInButton({
  onPress,
  busy = false,
  disabled = false,
  label = 'continue',
  testID,
}: AppleSignInButtonProps) {
  const inactive = disabled || busy;
  const text = label === 'continue' ? 'Continue with Apple' : 'Sign in with Apple';

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [styles.button, pressed && !inactive ? styles.pressed : null]}
      testID={testID}
    >
      {busy ? (
        <ActivityIndicator color={brandColors.apple.foreground} />
      ) : (
        <View style={styles.row}>
          {/*
            Nudged up by a hair: the glyph's optical centre sits below its box,
            so a mark aligned by geometry reads as sitting low next to the text.
            `accessibilityElementsHidden` because the label below already says
            "Apple" -- VoiceOver announcing a private-use codepoint next to it
            reads as garbage.
          */}
          <Text style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">
            {APPLE_LOGO}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {text}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * U+F8FF — the Apple logo, in Apple's system fonts.
 *
 * Written as an escape rather than pasted, so it survives every editor, diff
 * viewer and terminal between here and the build. Pasted, it is one
 * normalisation pass away from being a question mark on the button Apple
 * checks most carefully.
 */
const APPLE_LOGO = '\uF8FF';

/**
 * The HIG puts the mark at roughly the cap height of the label. 19 against a
 * 17pt label lands there once the glyph's own bearing is accounted for.
 */
const APPLE_GLYPH_SIZE = 19;

const styles = StyleSheet.create({
  button: {
    minHeight: APPLE_BUTTON_MIN_HEIGHT,
    borderRadius: APPLE_BUTTON_RADIUS,
    backgroundColor: brandColors.apple.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  glyph: {
    color: brandColors.apple.foreground,
    fontSize: APPLE_GLYPH_SIZE,
    marginRight: space[2],
    marginTop: -2,
  },
  label: {
    color: brandColors.apple.foreground,
    fontSize: 17,
    // Apple's own button uses the system font at semibold. `600` resolves to
    // SF Pro Text Semibold on iOS.
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
