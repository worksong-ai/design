import { fireEvent, render, screen } from '@testing-library/react-native';

import { APPLE_BUTTON_MIN_HEIGHT, APPLE_BUTTON_RADIUS, brandColors } from '../tokens/brand.js';
import { AppleSignInButton } from './AppleSignInButton.js';

/** Flatten RN's array-of-styles into one object. */
function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'function') return flatten(value({ pressed: false }));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('AppleSignInButton', () => {
  it('says Continue, because Clerk SSO also registers a first-time user', () => {
    // "Sign in with Apple" on a control that may create the account is the
    // wrong one of Apple's approved strings.
    render(<AppleSignInButton onPress={() => undefined} testID="apple" />);
    expect(screen.getByText('Continue with Apple')).toBeTruthy();
  });

  it('can say Sign in where the account is known to exist', () => {
    render(<AppleSignInButton onPress={() => undefined} label="signIn" testID="apple" />);
    expect(screen.getByText('Sign in with Apple')).toBeTruthy();
  });

  it('draws the Apple glyph rather than a traced one', () => {
    // U+F8FF is the Apple logo in Apple's own system fonts. Written as an
    // escape on both sides: a pasted private-use character does not survive
    // every editor, diff and terminal between here and the build.
    render(<AppleSignInButton onPress={() => undefined} testID="apple" />);
    // `includeHiddenElements` because the glyph is deliberately hidden from
    // the accessibility tree — VoiceOver reading a private-use codepoint next
    // to the word "Apple" is noise.
    expect(screen.getByText('\uF8FF', { includeHiddenElements: true })).toBeTruthy();
  });

  it('meets the appearance the HIG fixes', () => {
    // Colour, radius and height are all checked at review, and all three are
    // the kind of thing a later refactor would quietly retheme.
    render(<AppleSignInButton onPress={() => undefined} testID="apple" />);
    const style = styleOf(screen.getByTestId('apple'));

    expect(style.backgroundColor).toBe(brandColors.apple.background);
    expect(style.minHeight).toBe(APPLE_BUTTON_MIN_HEIGHT);
    expect(style.borderRadius).toBe(APPLE_BUTTON_RADIUS);
    expect(APPLE_BUTTON_MIN_HEIGHT).toBeGreaterThanOrEqual(44);
  });

  it('does not theme with the rest of the app', () => {
    // Apple's white is white. Substituting a surface token would drift the
    // day that token moves.
    expect(brandColors.apple.background).toBe('#FFFFFF');
    expect(brandColors.apple.foreground).toBe('#000000');
  });

  it('fires once when pressed', () => {
    const onPress = jest.fn();
    render(<AppleSignInButton onPress={onPress} testID="apple" />);
    fireEvent.press(screen.getByTestId('apple'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cannot be fired while the browser round trip is open', () => {
    // A second tap mints a second authorisation at Apple.
    const onPress = jest.fn();
    render(<AppleSignInButton onPress={onPress} busy testID="apple" />);
    fireEvent.press(screen.getByTestId('apple'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides the label while busy, so the spinner is not drawn over text', () => {
    render(<AppleSignInButton onPress={() => undefined} busy testID="apple" />);
    expect(screen.queryByText('Continue with Apple')).toBeNull();
  });

  it('keeps an accessible name even when the label is replaced by a spinner', () => {
    render(<AppleSignInButton onPress={() => undefined} busy testID="apple" />);
    expect(screen.getByLabelText('Continue with Apple')).toBeTruthy();
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<AppleSignInButton onPress={onPress} disabled testID="apple" />);
    fireEvent.press(screen.getByTestId('apple'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
