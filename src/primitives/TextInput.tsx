/**
 * TextInput.
 *
 * Single-line and multiline, labelled, with an error line. Worksong has no text
 * field primitive at all — its composer re-types RN's component inline with its
 * own border, padding and placeholder colour, and nothing else in that app has
 * a labelled field to copy from. Three things that recipe gets wrong, and this
 * one does not:
 *
 *   - **Direction belongs to the string, not the file.** The product ships
 *     Hebrew, so the field has to flip as the first Hebrew letter lands. An
 *     empty field borrows the placeholder's direction, because a composer that
 *     opens left-aligned under a Hebrew prompt reads as broken before a single
 *     key is pressed.
 *   - **A red border is invisible to a screen reader.** RN has no
 *     `aria-invalid` and no `invalid` in `AccessibilityState`, so the error is
 *     rendered as an `alert` rather than trusted to the colour.
 *   - **It clips at large Dynamic Type.** The box grows with `fontScale` from
 *     the same 44pt floor Button holds, and the field caps its own text at the
 *     body token's multiplier so glyphs and box grow by the same factor.
 */
import { useState, type Ref } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type AccessibilityState,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import type { ColorScheme } from '../tokens/colors.js';
import { radius, size, space } from '../tokens/space.js';
import { directionStyle, textDirection } from '../tokens/text.js';
import { maxFontScale, scaledMinHeight, typography, type TypeTokenName } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedFontScale } from './useFontScale.js';
import { useResolvedScheme } from './useScheme.js';

export interface TextInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Caption above the field. Also the default accessibility label. */
  label?: string;
  /** Message below the field. Its presence is what puts the field in error. */
  error?: string;
  multiline?: boolean;
  /**
   * A pill rather than a rounded rectangle, and one row tall to begin with.
   *
   * The composer's shape, and only the composer's: a message field sits in a
   * bar next to circular controls, where a 10pt-radius box next to a 44pt
   * circle reads as two design languages in one row. It stays `multiline` —
   * the field still grows as a message does — but starts at one row instead of
   * two, because the bar it lives in must not eat the transcript.
   *
   * The corner radius is fixed at half the single-row height (see
   * `pillRadius` below), not the "as round as the box allows" `radius.full`
   * token — a growing multiline pill must read as a rounded rectangle once it
   * passes one row, not balloon into an oval as height overtakes width (#407).
   */
  pill?: boolean;
  secureTextEntry?: boolean;
  /**
   * Keyboard layout and autofill behaviour.
   *
   * Grouped into one prop rather than exposing RN's seven separate ones,
   * because getting an email field right means setting four of them
   * consistently and a field that sets three is worse than one that sets none
   * -- an autocapitalised email that the password manager will not fill is a
   * field users abandon.
   */
  kind?: FieldKind;
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
  scheme?: ColorScheme;
  testID?: string;
  /** OS font scale, for the minimum-height calculation. */
  fontScale?: number;
  onSubmitEditing?: () => void;
  /**
   * The field took focus. For a screen that has to scroll the field *and* the
   * button under it clear of the keyboard; the focus ring is handled here.
   */
  onFocus?: () => void;
  /**
   * The field lost focus. For a composer whose inline suggestion list must
   * close when the user taps away (#380); the focus ring is handled here.
   */
  onBlur?: () => void;
  /**
   * The caret or selection moved. Read-only on purpose: the field reports
   * where the caret is (so a composer can complete the `@mention` the caret is
   * inside, #380) but is never handed a controlled `selection`, which on iOS
   * fights the user's own caret moves.
   */
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  /**
   * What Return says and does. `next` keeps the keyboard up on submit, so a
   * form's `onSubmitEditing` can move focus to the following field (through
   * that field's `inputRef`) without the keyboard dropping and coming back.
   */
  returnKeyType?: 'next' | 'done' | 'go' | 'send';
  /** The native field, for a screen that moves focus to it. */
  inputRef?: Ref<RNTextInput>;
}

/** The field's own type token. Both the text and the box are sized from it. */
const FIELD_TYPE: TypeTokenName = 'body';

const MIN_HEIGHT = {
  /** The same 44pt floor Button holds — a field is tapped before it is typed in. */
  single: size.touchTarget,
  /** Two rows, so a composer looks like somewhere a paragraph goes. */
  multiline: size.row * 2,
} as const;

/**
 * There is no `aria-invalid` prop and no `invalid` in `AccessibilityState`, and
 * RN's `TextInput` rebuilds the state object from five known keys on the way
 * down, so the flag does not reach the host element either. It is declared
 * anyway — it is the field's own contract, and it costs nothing the day RN
 * grows the key — but the announcement users actually get is the `alert` role
 * on the error line below.
 */
type FieldAccessibilityState = AccessibilityState & { invalid?: boolean };

/**
 * What a field is for, as one word.
 *
 * `text` is the default and changes nothing. The others each set the whole
 * group of RN props that make a field behave: an email field that
 * autocapitalises, or a password field with no `textContentType`, are both
 * things a reviewer notices only after typing into a shipped build.
 */
export type FieldKind = 'text' | 'email' | 'password' | 'newPassword' | 'oneTimeCode';

interface FieldBehaviour {
  keyboardType: RNTextInputProps['keyboardType'];
  autoCapitalize: RNTextInputProps['autoCapitalize'];
  autoCorrect: boolean;
  textContentType: RNTextInputProps['textContentType'];
  autoComplete: RNTextInputProps['autoComplete'];
}

const FIELD_BEHAVIOUR: Record<FieldKind, FieldBehaviour> = {
  text: {
    keyboardType: 'default',
    autoCapitalize: 'sentences',
    autoCorrect: true,
    textContentType: 'none',
    autoComplete: 'off',
  },
  email: {
    keyboardType: 'email-address',
    // All four matter. Autocapitalisation alone produces "Ada@..." on iOS,
    // which the server lowercases -- but the user sees a value that looks
    // wrong while typing and deletes it.
    autoCapitalize: 'none',
    autoCorrect: false,
    textContentType: 'emailAddress',
    autoComplete: 'email',
  },
  password: {
    keyboardType: 'default',
    autoCapitalize: 'none',
    autoCorrect: false,
    textContentType: 'password',
    autoComplete: 'current-password',
  },
  newPassword: {
    keyboardType: 'default',
    autoCapitalize: 'none',
    autoCorrect: false,
    // Distinct from `password` so the keychain offers to GENERATE one rather
    // than to fill the existing one, which is the whole point of the
    // distinction on iOS.
    textContentType: 'newPassword',
    autoComplete: 'new-password',
  },
  oneTimeCode: {
    // `oneTimeCode` is what makes iOS offer the code from Mail/Messages above
    // the keyboard; a number pad because the code is digits only.
    keyboardType: 'number-pad',
    autoCapitalize: 'none',
    autoCorrect: false,
    textContentType: 'oneTimeCode',
    autoComplete: 'one-time-code',
  },
};

export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  pill = false,
  secureTextEntry = false,
  kind = 'text',
  autoFocus = false,
  editable = true,
  maxLength,
  scheme: schemeOverride,
  testID,
  fontScale,
  onSubmitEditing,
  onFocus,
  onBlur,
  onSelectionChange,
  returnKeyType,
  inputRef,
}: TextInputProps) {
  const scheme = useResolvedScheme(schemeOverride);
  // The prop wins when given (tests pin a scale); otherwise the device decides.
  const resolvedFontScale = useResolvedFontScale(fontScale);
  const [focused, setFocused] = useState(false);

  const invalid = error !== undefined && error.length > 0;
  // Detected from what is in the field, falling back to the placeholder so an
  // empty Hebrew-prompted field does not sit left-aligned waiting to flip.
  const direction = textDirection(value.length > 0 ? value : (placeholder ?? ''));

  const state: FieldAccessibilityState = { disabled: !editable, invalid };
  const behaviour = FIELD_BEHAVIOUR[kind];

  /**
   * The pill's corner radius (#407).
   *
   * `radius.full` (999) is a "however round the box allows" value, correct
   * only because RN clips a corner radius to half of the box's *smaller*
   * dimension. That is fine for a one-row pill, where height is the smaller
   * side and the clip produces two neat semicircular ends. It stops being
   * fine the moment the message wraps: this field is `multiline`, so height
   * grows past width as lines are added, and the same clip then starts
   * reading off *half the width* instead — a corner radius that keeps
   * climbing as the box grows taller. Past the point width and height cross,
   * the shape stops looking like a pill with a long straight run and starts
   * looking like an oval, and a radius that large eats far enough into the
   * box that the last line's glyphs land in the curve instead of clear of it.
   *
   * A pill's radius has to be a constant, not a function of the box's own
   * size: half the single-row height it was designed for, computed the same
   * way that height is (so it grows with Dynamic Type, never with content).
   * At one row this is the exact number `radius.full` used to get clipped
   * down to, so the pill looks identical; past one row it stops climbing,
   * and the box reads as a normal rounded rectangle instead of ballooning.
   */
  const pillRadius = scaledMinHeight(MIN_HEIGHT.single, FIELD_TYPE, resolvedFontScale) / 2;

  return (
    <View style={styles.container}>
      {label === undefined ? null : (
        <Text variant="caption" color="textSecondary" scheme={scheme} style={styles.label}>
          {label}
        </Text>
      )}

      <RNTextInput
        accessibilityLabel={label ?? placeholder}
        accessibilityState={state}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={behaviour.keyboardType}
        autoCapitalize={behaviour.autoCapitalize}
        autoCorrect={behaviour.autoCorrect}
        textContentType={behaviour.textContentType}
        autoComplete={behaviour.autoComplete}
        autoFocus={autoFocus}
        editable={editable}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        ref={inputRef}
        {...(returnKeyType === undefined ? {} : { returnKeyType })}
        {...(returnKeyType === 'next' ? { submitBehavior: 'submit' as const } : {})}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        {...(onSelectionChange === undefined
          ? {}
          : {
              onSelectionChange: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
                onSelectionChange(event.nativeEvent.selection),
            })}
        // Capped for the same reason Text caps: the box below grows by the
        // clamped factor, so unbounded glyph growth would overflow it.
        maxFontSizeMultiplier={maxFontScale[FIELD_TYPE]}
        style={[
          styles.input,
          typography[FIELD_TYPE],
          directionStyle(direction),
          {
            backgroundColor: scheme.surface,
            borderColor: invalid ? scheme.red : focused ? scheme.focus : scheme.separator,
            // Dimmed by colour rather than Button's 0.35 opacity: a whole
            // paragraph at that opacity reads as unreadable, not as read-only.
            color: editable ? scheme.textPrimary : scheme.textSecondary,
            minHeight: scaledMinHeight(
              // A pill starts at one row however `multiline` is set: it grows
              // with the message, but a composer that opens two rows tall eats
              // the transcript behind it before a word is typed.
              multiline && !pill ? MIN_HEIGHT.multiline : MIN_HEIGHT.single,
              FIELD_TYPE,
              resolvedFontScale,
            ),
            borderRadius: pill ? pillRadius : radius.md,
            paddingHorizontal: pill ? space[4] : space[3],
            paddingVertical: multiline && !pill ? space[3] : space[2],
            // Android centres multiline text in the box without this.
            textAlignVertical: multiline && !pill ? 'top' : 'center',
          },
        ]}
      />

      {invalid ? (
        <Text
          variant="caption"
          color="red"
          scheme={scheme}
          // With `invalid` stripped upstream, this is the only part a screen
          // reader announces when the error appears.
          accessibilityRole="alert"
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch' },
  label: { marginBottom: space[1] },
  // Radius and horizontal padding are set inline: they differ between the
  // default field and the pill, and splitting one decision across two places is
  // how the two variants drift.
  input: { borderWidth: StyleSheet.hairlineWidth },
  error: { marginTop: space[1] },
});
