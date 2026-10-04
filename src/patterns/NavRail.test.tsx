import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { SchemeProvider } from '../primitives/useScheme.js';
import { darkColors, lightColors } from '../tokens/colors.js';
import { RAIL_LAYOUT, RAIL_WIDTH } from '../tokens/layout.js';
import { NavRail, type NavRailItem } from './NavRail.js';

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, unknown>;

const item = (key: string, extra: Partial<NavRailItem> = {}): NavRailItem => ({
  key,
  label: key.toUpperCase(),
  icon: ({ selected, color }) => (
    <RNText style={{ color }}>{selected ? `${key}-on` : `${key}-off`}</RNText>
  ),
  testID: `tab-${key}`,
  ...extra,
});

const items = [item('a'), item('b', { accessibilityLabel: 'Bee, 3 new' }), item('c', { label: 'A very long destination' })];

function setup(props: Partial<React.ComponentProps<typeof NavRail>> = {}) {
  const onSelect = jest.fn();
  render(<NavRail items={items} activeKey="a" onSelect={onSelect} {...props} />);
  return { onSelect };
}

describe('NavRail', () => {
  it('is a tablist of tabs, each named and carrying its selected state', () => {
    setup();
    expect(screen.getByTestId('nav-rail').props.accessibilityRole).toBe('tablist');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(items.length);
    expect(tabs.map((t) => t.props.accessibilityState)).toEqual([
      { selected: true },
      { selected: false },
      { selected: false },
    ]);
    expect(screen.getByTestId('tab-a').props.accessibilityLabel).toBe('A');
    expect(screen.getByTestId('tab-b').props.accessibilityLabel).toBe('Bee, 3 new');
  });

  it('reports a press with the item key', () => {
    const { onSelect } = setup();
    fireEvent.press(screen.getByTestId('tab-b'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('asks the item for its glyph in the active state, with the colour and size it is laid out for', () => {
    setup();
    expect(screen.getByText('a-on')).toBeTruthy();
    expect(screen.getByText('b-off')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('a-on').props.style).color).toBe(darkColors.accent);
    expect(StyleSheet.flatten(screen.getByText('b-off').props.style).color).toBe(darkColors.textSecondary);
  });

  it('shows the leading bar only on the active item, but lays it out on all of them', () => {
    setup();
    expect(flat('tab-a-active-bar').backgroundColor).toBe(darkColors.accent);
    expect(flat('tab-b-active-bar').backgroundColor).toBe('transparent');
    expect(flat('tab-b-active-bar').width).toBe(RAIL_LAYOUT.activeBarWidth);
  });

  it('is a fixed-width rail of fixed-height items, whatever is active', () => {
    const geometry = (id: string) => {
      const { backgroundColor: _b, ...rest } = flat(id);
      return rest;
    };
    const { rerender } = render(<NavRail items={items} activeKey="a" onSelect={jest.fn()} />);
    expect(flat('nav-rail').width).toBe(RAIL_WIDTH);
    const before = items.map((i) => geometry(i.testID));
    rerender(<NavRail items={items} activeKey="c" onSelect={jest.fn()} />);
    expect(items.map((i) => geometry(i.testID))).toEqual(before);
    expect(before.every((g) => g.height === RAIL_LAYOUT.itemHeight)).toBe(true);
  });

  it('draws a badge only where an item has one, without moving its neighbours', () => {
    const geometry = () => items.map((i) => flat(i.testID));
    const { rerender } = render(<NavRail items={items} activeKey="a" onSelect={jest.fn()} />);
    expect(screen.queryByTestId('tab-b-badge', { includeHiddenElements: true })).toBeNull();
    const before = geometry();
    const withBadge = [items[0]!, { ...items[1]!, badge: '99+' }, items[2]!];
    rerender(<NavRail items={withBadge} activeKey="a" onSelect={jest.fn()} />);
    const badge = screen.getByTestId('tab-b-badge', { includeHiddenElements: true });
    expect(badge).toBeTruthy();
    expect(screen.getByText('99+', { includeHiddenElements: true })).toBeTruthy();
    expect(badge.props.accessibilityElementsHidden).toBe(true);
    expect(geometry()).toEqual(before);
    // It floats: absolute, so it cannot take space from the glyph.
    expect(StyleSheet.flatten(badge.props.style).position).toBe('absolute');
  });

  it('treats a null badge as none', () => {
    render(<NavRail items={[item('a', { badge: null })]} activeKey="a" onSelect={jest.fn()} />);
    expect(screen.queryByTestId('tab-a-badge', { includeHiddenElements: true })).toBeNull();
  });

  it('keeps a long label on one line and lets it shrink to fit', () => {
    setup();
    const label = screen.getByTestId('tab-c-label');
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBeLessThan(1);
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws the %s scheme', (preference, scheme) => {
    render(
      <SchemeProvider preference={preference}>
        <NavRail items={items} activeKey="a" onSelect={jest.fn()} />
      </SchemeProvider>,
    );
    expect(flat('nav-rail')).toMatchObject({ backgroundColor: scheme.background, borderRightColor: scheme.separator });
    expect(flat('tab-a').backgroundColor).toBe(scheme.surface);
    expect(flat('tab-a-active-bar').backgroundColor).toBe(scheme.accent);
    expect(StyleSheet.flatten(screen.getByTestId('tab-b-label').props.style).color).toBe(scheme.textSecondary);
  });

  it('has no window chrome: only the destinations', () => {
    setup();
    expect(screen.getAllByRole('tab')).toHaveLength(items.length);
  });
});
