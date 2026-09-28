import { fireEvent, render, screen } from '@testing-library/react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { elevation, radius, size, space } from '../tokens/space.js';
import { Card } from './Card.js';
import { Text } from './Text.js';
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

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <Text>Run completed</Text>
      </Card>,
    );
    expect(screen.getByText('Run completed')).toBeTruthy();
  });

  it('routes a bare string child through the Text primitive', () => {
    // A raw string in a View throws on native, and going through Text is also
    // what gets direction detection on a Hebrew card.
    render(<Card>שלום עולם</Card>);
    expect(styleOf(screen.getByText('שלום עולם')).textAlign).toBe('right');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress} testID="c">
        <Text>Body</Text>
      </Card>,
    );

    fireEvent.press(screen.getByTestId('c'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has no press handling at all without onPress', () => {
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const card = screen.getByTestId('c');
    // Not a touch responder, so a tap falls through to whatever is underneath
    // rather than being absorbed by a card that does nothing with it.
    expect(card.props.onStartShouldSetResponder).toBeUndefined();
    expect(() => fireEvent.press(card)).not.toThrow();
  });

  it('is not announced as a button when it is not interactive', () => {
    // A read-only card with a button role is how a list reads as a screenful
    // of controls that ignore every tap.
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const card = screen.getByTestId('c');
    expect(card.props.accessibilityRole).toBeUndefined();
    expect(card.props.accessibilityState).toBeUndefined();
  });

  it('reports a button role and state once it is interactive', () => {
    render(
      <Card onPress={jest.fn()} testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const card = screen.getByTestId('c');
    expect(card.props.accessibilityRole).toBe('button');
    expect(card.props.accessibilityState).toMatchObject({ disabled: false });
  });

  it('sets the iOS shadow and the Android elevation together', () => {
    // One without the other renders flat on the platform the author was not
    // looking at.
    render(
      <Card elevation="medium" testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const style = styleOf(screen.getByTestId('c'));
    expect(style.shadowOpacity).toBe(elevation.medium.shadowOpacity);
    expect(style.elevation).toBe(elevation.medium.elevation);
    expect(style.shadowRadius).toBe(elevation.medium.shadowRadius);
  });

  it('is flat by default', () => {
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const style = styleOf(screen.getByTestId('c'));
    expect(style.shadowOpacity).toBe(elevation.none.shadowOpacity);
    expect(style.elevation).toBe(elevation.none.elevation);
  });

  it('insets from the space scale, defaulting to the screen padding', () => {
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(styleOf(screen.getByTestId('c')).padding).toBe(space[4]);

    // A second render() unmounts the first.
    render(
      <Card padding={6} testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(styleOf(screen.getByTestId('c')).padding).toBe(space[6]);
  });

  it('takes its surface and corner from the scheme, never a literal', () => {
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );

    expect(styleOf(screen.getByTestId('c'))).toMatchObject({
      backgroundColor: darkColors.surface,
      borderRadius: radius.lg,
    });
  });

  it('honours an alternate scheme', () => {
    render(
      <Card scheme={lightColors} testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(styleOf(screen.getByTestId('c')).backgroundColor).toBe(lightColors.surface);
  });

  it('meets the 44pt hit area once it is tappable', () => {
    render(
      <Card onPress={jest.fn()} testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const { minHeight } = styleOf(screen.getByTestId('c'));
    expect(minHeight as number).toBeGreaterThanOrEqual(size.touchTarget);
  });

  it('grows that minimum with the OS font scale', () => {
    render(
      <Card onPress={jest.fn()} testID="normal" fontScale={1}>
        <Text>Body</Text>
      </Card>,
    );
    const normal = styleOf(screen.getByTestId('normal')).minHeight as number;

    render(
      <Card onPress={jest.fn()} testID="large" fontScale={2}>
        <Text>Body</Text>
      </Card>,
    );
    const large = styleOf(screen.getByTestId('large')).minHeight as number;

    expect(large).toBeGreaterThan(normal);
  });

  it('does not impose a hit area on a card that cannot be tapped', () => {
    // 44pt is a tap guarantee, not a layout one — forcing it would stop a
    // static card from sizing to its own content.
    render(
      <Card testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(styleOf(screen.getByTestId('c')).minHeight).toBeUndefined();
  });

  it('labels a plain card as a single node, or the label is never read', () => {
    render(
      <Card accessibilityLabel="Run summary" testID="c">
        <Text>Body</Text>
      </Card>,
    );

    const card = screen.getByTestId('c');
    expect(card.props.accessibilityLabel).toBe('Run summary');
    expect(card.props.accessible).toBe(true);
  });

  it('labels an interactive card', () => {
    render(
      <Card onPress={jest.fn()} accessibilityLabel="Open run" testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(screen.getByTestId('c').props.accessibilityLabel).toBe('Open run');
  });

  it('lets a style prop win over the tokens', () => {
    render(
      <Card style={{ borderRadius: radius.full }} testID="c">
        <Text>Body</Text>
      </Card>,
    );
    expect(styleOf(screen.getByTestId('c')).borderRadius).toBe(radius.full);
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <Card testID="c">
          <Text>Body</Text>
        </Card>
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('c')).backgroundColor).toBe(lightColors.surface);
  });
});
