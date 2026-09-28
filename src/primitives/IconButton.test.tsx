import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { size } from '../tokens/space.js';
import { IconButton, __iconButtonTone } from './IconButton.js';
import { SchemeProvider } from './useScheme.js';

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

const glyph = <RNText>+</RNText>;

describe('IconButton', () => {
  it('fires once when pressed', () => {
    const onPress = jest.fn();
    render(<IconButton icon={glyph} accessibilityLabel="Add" onPress={onPress} testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is named for VoiceOver, which is the only label it has', () => {
    // A glyph has no text. Without this the control is invisible to anyone
    // using a screen reader, and the failure is silent for everybody else.
    render(<IconButton icon={glyph} accessibilityLabel="Attach a file" onPress={jest.fn()} />);
    expect(screen.getByLabelText('Attach a file')).toBeTruthy();
  });

  it('does not fire while busy, so a second tap cannot double-submit', () => {
    const onPress = jest.fn();
    render(<IconButton icon={glyph} accessibilityLabel="Send" onPress={onPress} busy testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides the glyph while busy and keeps its accessible name', () => {
    render(<IconButton icon={glyph} accessibilityLabel="Send" onPress={jest.fn()} busy testID="b" />);
    expect(screen.queryByText('+')).toBeNull();
    expect(screen.getByLabelText('Send')).toBeTruthy();
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(
      <IconButton icon={glyph} accessibilityLabel="Send" onPress={onPress} disabled testID="b" />,
    );
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is at least a 44pt target at the default font scale', () => {
    // `size.touchTarget` is iOS's minimum, not a preference.
    render(
      <IconButton icon={glyph} accessibilityLabel="Send" onPress={jest.fn()} fontScale={1} testID="b" />,
    );
    const style = styleOf(screen.getByTestId('b'));
    expect(style.width).toBe(size.touchTarget);
    expect(style.height).toBe(size.touchTarget);
    expect(size.touchTarget).toBeGreaterThanOrEqual(44);
  });

  it('grows with Dynamic Type rather than staying fixed beside a growing field', () => {
    render(
      <IconButton icon={glyph} accessibilityLabel="Send" onPress={jest.fn()} fontScale={1.3} testID="b" />,
    );
    expect(Number(styleOf(screen.getByTestId('b')).width)).toBeGreaterThan(size.touchTarget);
  });

  it('stops growing before it pushes the field out of the bar', () => {
    const huge = styleOf(
      render(
        <IconButton icon={glyph} accessibilityLabel="Send" onPress={jest.fn()} fontScale={3} testID="b" />,
      ).getByTestId('b'),
    );
    expect(Number(huge.width)).toBeLessThanOrEqual(Math.round(size.touchTarget * 1.4));
  });

  it('paints accent and danger as filled, plain as a hairline', () => {
    expect(__iconButtonTone('accent').background).toBe(darkColors.accent);
    expect(__iconButtonTone('danger').background).toBe(darkColors.red);
    expect(__iconButtonTone('plain').background).toBe(darkColors.surface);
  });

  it('follows the scheme in force rather than always painting dark', () => {
    // The whole point of the context: a primitive inside a light provider must
    // not need a prop to know it.
    render(
      <SchemeProvider preference="light">
        <IconButton icon={glyph} accessibilityLabel="Send" onPress={jest.fn()} testID="b" />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(lightColors.surface);
  });

  it('lets an explicit scheme win, which is what a test pins', () => {
    render(
      <SchemeProvider preference="light">
        <IconButton
          icon={glyph}
          accessibilityLabel="Send"
          onPress={jest.fn()}
          scheme={darkColors}
          testID="b"
        />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(darkColors.surface);
  });
});
