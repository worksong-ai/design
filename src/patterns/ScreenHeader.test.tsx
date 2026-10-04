import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { HEADER_LAYOUT } from '../tokens/layout.js';
import { SchemeProvider } from '../primitives/useScheme.js';
import { ScreenHeader } from './ScreenHeader.js';

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, unknown>;

const glyph = (g: string) => <RNText>{g}</RNText>;
const actions = (onPress = jest.fn()) => [
  { key: 'a', icon: glyph('s'), accessibilityLabel: 'Search', onPress, testID: 'act-a' },
  { key: 'b', icon: glyph('m'), accessibilityLabel: 'More', onPress, testID: 'act-b' },
  { key: 'c', icon: glyph('+'), accessibilityLabel: 'New', accessibilityHint: 'Makes one', onPress, testID: 'act-c' },
];

describe('ScreenHeader', () => {
  it('renders the title and every action in order, and reports presses', () => {
    const onPress = jest.fn();
    render(<ScreenHeader title="Things" actions={actions(onPress)} testID="h" />);
    expect(screen.getByText('Things')).toBeTruthy();
    const labels = within(screen.getByTestId('screen-header-actions'))
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel);
    expect(labels).toEqual(['Search', 'More', 'New']);
    fireEvent.press(screen.getByTestId('act-c'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('New').props.accessibilityHint).toBe('Makes one');
  });

  it('lays out on the shared header tokens', () => {
    render(<ScreenHeader title="Things" actions={actions()} testID="h" />);
    const style = flat('h');
    expect(style.paddingHorizontal).toBe(HEADER_LAYOUT.paddingHorizontal);
    expect(style.paddingVertical).toBe(HEADER_LAYOUT.paddingVertical);
    expect(style.gap).toBe(HEADER_LAYOUT.gap);
    expect(style.alignItems).toBe('center');
    expect(flat('screen-header-actions').gap).toBe(HEADER_LAYOUT.actionsGap);
    expect(flat('screen-header-title').gap).toBe(HEADER_LAYOUT.titleGap);
  });

  it('does not change the title cluster or the header frame when a badge is added', () => {
    const { rerender } = render(<ScreenHeader title="Things" actions={actions()} testID="h" />);
    const before = { header: flat('h'), title: flat('screen-header-title'), actions: flat('screen-header-actions') };
    rerender(
      <ScreenHeader title="Things" actions={actions()} testID="h" badge={<RNText testID="badge">9 need you</RNText>} />,
    );
    expect(flat('h')).toEqual(before.header);
    expect(flat('screen-header-title')).toEqual(before.title);
    expect(flat('screen-header-actions')).toEqual(before.actions);
    expect(within(screen.getByTestId('screen-header-title')).getByTestId('badge')).toBeTruthy();
  });

  it('keeps the same frame whatever the number of actions', () => {
    const { rerender } = render(<ScreenHeader title="Things" actions={actions()} testID="h" />);
    const three = flat('h');
    rerender(<ScreenHeader title="Things" actions={[]} testID="h" />);
    expect(flat('h')).toEqual(three);
    expect(flat('h').minHeight).toBeGreaterThanOrEqual(HEADER_LAYOUT.minHeight);
  });

  it('lets a long title shrink and truncate instead of pushing the actions out', () => {
    render(<ScreenHeader title={'A very long title '.repeat(12)} actions={actions()} testID="h" />);
    expect(flat('screen-header-title').flexShrink).toBe(1);
    expect(screen.getByText(/A very long title/).props.numberOfLines).toBe(1);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('draws the title in the scheme text colour, light and dark', () => {
    const { rerender } = render(
      <SchemeProvider preference="dark">
        <ScreenHeader title="Things" actions={[]} />
      </SchemeProvider>,
    );
    expect(StyleSheet.flatten(screen.getByText('Things').props.style).color).toBe(darkColors.textPrimary);
    rerender(
      <SchemeProvider preference="light">
        <ScreenHeader title="Things" actions={[]} />
      </SchemeProvider>,
    );
    expect(StyleSheet.flatten(screen.getByText('Things').props.style).color).toBe(lightColors.textPrimary);
  });

  it('caps the title at the type scale, so a huge OS font cannot break the row', () => {
    render(<ScreenHeader title="Things" actions={[]} />);
    expect(screen.getByText('Things').props.maxFontSizeMultiplier).toBeGreaterThan(0);
    expect(screen.getByText('Things').props.maxFontSizeMultiplier).toBeLessThan(2.5);
  });
});
