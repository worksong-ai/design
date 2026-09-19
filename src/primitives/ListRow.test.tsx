import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { size } from '../tokens/space.js';
import { ListRow } from './ListRow.js';

/** Flatten RN's array-of-styles into one object. */
function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('ListRow', () => {
  it('renders its title and subtitle', () => {
    render(<ListRow title="Research bot" subtitle="Idle · 12 runs" testID="r" />);

    expect(screen.getByText('Research bot')).toBeTruthy();
    expect(screen.getByText('Idle · 12 runs')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<ListRow title="Research bot" onPress={onPress} testID="r" />);

    fireEvent.press(screen.getByTestId('r'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is inert with no handler and no button role when onPress is omitted', () => {
    // A row that only displays must not be announced as tappable, and pressing
    // it must not reach anything.
    render(<ListRow title="Workspace" subtitle="Acme" testID="r" />);

    const row = screen.getByTestId('r');
    expect(row.props.onPress).toBeUndefined();
    expect(row.props.accessibilityRole).toBeUndefined();
    expect(() => fireEvent.press(row)).not.toThrow();
  });

  it('paints a destructive title from the red token', () => {
    render(
      <>
        <ListRow title="Delete bot" destructive testID="danger" />
        <ListRow title="Rename bot" testID="normal" />
      </>,
    );

    expect(styleOf(screen.getByText('Delete bot')).color).toBe(darkColors.red);
    expect(styleOf(screen.getByText('Rename bot')).color).toBe(darkColors.textPrimary);
  });

  it('fills a selected row with surfaceElevated', () => {
    // Both in one tree: a second render() unmounts the first.
    render(
      <>
        <ListRow title="A" onPress={jest.fn()} selected testID="on" />
        <ListRow title="B" onPress={jest.fn()} testID="off" />
      </>,
    );

    expect(styleOf(screen.getByTestId('on')).backgroundColor).toBe(darkColors.surfaceElevated);
    expect(styleOf(screen.getByTestId('off')).backgroundColor).toBe('transparent');
  });

  it('keeps the 56pt design height at font scale 1', () => {
    // Pinned deliberately. jest-expo's mocked window reports fontScale = 2, and
    // since the primitives now read the real device scale rather than assuming
    // 1, an unpinned render here measures 79 -- the correct grown height, not
    // the design height this test is about.
    render(<ListRow title="A" testID="r" fontScale={1} />);
    expect(styleOf(screen.getByTestId('r')).minHeight).toBe(size.row);
  });

  it('grows its minimum height with the OS font scale', () => {
    // Worksong's rows are a fixed 56pt and crop their text at large Dynamic
    // Type sizes. This is the guarantee that stops the same thing here.
    render(<ListRow title="A" testID="normal" fontScale={1} />);
    const normal = styleOf(screen.getByTestId('normal')).minHeight as number;

    render(<ListRow title="A" testID="large" fontScale={2} />);
    const large = styleOf(screen.getByTestId('large')).minHeight as number;

    expect(large).toBeGreaterThan(normal);
  });

  it('renders leading and trailing content', () => {
    render(
      <ListRow
        title="Research bot"
        leading={<View testID="avatar" />}
        trailing={<View testID="badge" />}
        testID="r"
      />,
    );

    expect(screen.getByTestId('avatar')).toBeTruthy();
    expect(screen.getByTestId('badge')).toBeTruthy();
  });

  it('reports selection to assistive technology', () => {
    render(<ListRow title="Research bot" onPress={jest.fn()} selected testID="r" />);

    const row = screen.getByTestId('r');
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('holds title and subtitle to one line each', () => {
    // A long value must ellipsise; if it wrapped, the row height would be set
    // by the data rather than by the layout.
    render(<ListRow title="A very long bot name" subtitle="A very long subtitle" testID="r" />);

    expect(screen.getByText('A very long bot name').props.numberOfLines).toBe(1);
    expect(screen.getByText('A very long subtitle').props.numberOfLines).toBe(1);
  });

  it('shows the chevron only when asked, and hides it from assistive technology', () => {
    render(<ListRow title="Settings" onPress={jest.fn()} testID="r" />);
    expect(screen.queryByTestId('list-row-chevron')).toBeNull();

    render(<ListRow title="Settings" onPress={jest.fn()} showChevron testID="r" />);
    expect(screen.getByTestId('list-row-chevron').props.accessible).toBe(false);
  });

  it('draws a hairline separator from the separator token', () => {
    render(<ListRow title="A" testID="r" />);

    const style = styleOf(screen.getByTestId('r'));
    expect(style.borderBottomColor).toBe(darkColors.separator);
    expect(style.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
  });

  it('honours an alternate scheme', () => {
    render(<ListRow title="Delete bot" destructive selected scheme={lightColors} testID="r" />);

    expect(styleOf(screen.getByTestId('r')).backgroundColor).toBe(lightColors.surfaceElevated);
    expect(styleOf(screen.getByText('Delete bot')).color).toBe(lightColors.red);
  });
});
