import { fireEvent, render, screen } from '@testing-library/react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { size } from '../tokens/space.js';
import { Button } from './Button.js';
import { SchemeProvider } from './useScheme.js';

/** Flatten RN's array-of-styles into one object. */
function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('Button', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Send" onPress={onPress} testID="b" />);

    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Send" onPress={onPress} disabled testID="b" />);

    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire while busy — a spinner that still submits is a double-submit', () => {
    // This product's buttons start money-spending turns, so busy must block, not
    // merely indicate.
    const onPress = jest.fn();
    render(<Button label="Send" onPress={onPress} busy testID="b" />);

    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner while busy and none otherwise', () => {
    const { rerender } = render(<Button label="Send" onPress={jest.fn()} busy testID="b" />);
    expect(screen.queryByTestId('button-spinner')).not.toBeNull();

    rerender(<Button label="Send" onPress={jest.fn()} testID="b" />);
    expect(screen.queryByTestId('button-spinner')).toBeNull();
  });

  it('keeps the label mounted while busy so the button does not resize mid-press', () => {
    render(<Button label="Send" onPress={jest.fn()} busy testID="b" />);
    expect(screen.getByText('Send')).toBeTruthy();
  });

  it('reports disabled and busy to assistive technology', () => {
    render(<Button label="Send" onPress={jest.fn()} busy testID="b" />);

    const button = screen.getByTestId('b');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it.each(['small', 'medium', 'large'] as const)(
    'meets the 44pt minimum hit area at size %s',
    (buttonSize) => {
      render(<Button label="Go" onPress={jest.fn()} size={buttonSize} testID="b" />);
      const { minHeight } = styleOf(screen.getByTestId('b'));
      expect(minHeight as number).toBeGreaterThanOrEqual(size.touchTarget);
    },
  );

  it('grows its minimum height with the OS font scale', () => {
    // Worksong's fixed 56pt rows clip at large Dynamic Type sizes. This is the
    // guarantee that stops the same thing happening here.
    render(<Button label="Go" onPress={jest.fn()} testID="normal" fontScale={1} />);
    const normal = styleOf(screen.getByTestId('normal')).minHeight as number;

    render(<Button label="Go" onPress={jest.fn()} testID="large" fontScale={2} />);
    const large = styleOf(screen.getByTestId('large')).minHeight as number;

    expect(large).toBeGreaterThan(normal);
  });

  it('paints each variant from the scheme, never a literal', () => {
    render(<Button label="A" onPress={jest.fn()} variant="primary" testID="p" />);
    expect(styleOf(screen.getByTestId('p')).backgroundColor).toBe(darkColors.accent);

    render(<Button label="B" onPress={jest.fn()} variant="danger" testID="d" />);
    expect(styleOf(screen.getByTestId('d')).backgroundColor).toBe(darkColors.red);

    render(<Button label="C" onPress={jest.fn()} variant="ghost" testID="g" />);
    expect(styleOf(screen.getByTestId('g')).backgroundColor).toBe('transparent');
  });

  it('honours an alternate scheme', () => {
    render(
      <Button label="A" onPress={jest.fn()} variant="primary" scheme={lightColors} testID="b" />,
    );
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(lightColors.accent);
  });

  it('dims when disabled', () => {
    // Both in one tree: a second render() unmounts the first.
    render(
      <>
        <Button label="A" onPress={jest.fn()} testID="on" />
        <Button label="B" onPress={jest.fn()} disabled testID="off" />
      </>,
    );

    expect(styleOf(screen.getByTestId('off')).opacity as number).toBeLessThan(
      styleOf(screen.getByTestId('on')).opacity as number,
    );
  });

  it('stretches only when block is set', () => {
    render(<Button label="A" onPress={jest.fn()} testID="inline" />);
    expect(styleOf(screen.getByTestId('inline')).alignSelf).toBe('flex-start');

    render(<Button label="A" onPress={jest.fn()} block testID="block" />);
    expect(styleOf(screen.getByTestId('block')).alignSelf).toBe('stretch');
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <Button label="Send" onPress={jest.fn()} testID="b" />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(lightColors.accent);
  });
});
