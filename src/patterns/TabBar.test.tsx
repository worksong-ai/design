import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { SchemeProvider } from '../primitives/useScheme.js';
import { contrastRatio, darkColors, lightColors } from '../tokens/colors.js';
import { TAB_BAR_LAYOUT } from '../tokens/layout.js';
import { size } from '../tokens/space.js';
import { TabBar, type TabBarItem } from './TabBar.js';

const flat = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

const item = (key: string, extra: Partial<TabBarItem> = {}): TabBarItem => ({
  key,
  label: key.toUpperCase(),
  icon: ({ selected, color, size: px }) => (
    <RNText testID={`glyph-${key}`} style={{ color, width: px, height: px }}>
      {selected ? `${key}-on` : `${key}-off`}
    </RNText>
  ),
  testID: `tab-${key}`,
  ...extra,
});

const keys = ['a', 'b', 'c', 'd', 'e'];
const items = keys.map((k) => item(k));

function setup(props: Partial<React.ComponentProps<typeof TabBar>> = {}) {
  const onSelect = jest.fn();
  const onLongPress = jest.fn();
  render(<TabBar items={items} activeKey="a" onSelect={onSelect} onLongPress={onLongPress} {...props} />);
  return { onSelect, onLongPress };
}

/** The badge is hidden from assistive tech on purpose, so queries must opt in. */
const badge = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });

describe('TabBar', () => {
  it('is a tablist of tabs in the given order, each named and carrying its selected state', () => {
    setup({ activeKey: 'c' });
    expect(screen.getByTestId('tab-bar').props.accessibilityRole).toBe('tablist');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.props.testID)).toEqual(items.map((i) => i.testID));
    expect(tabs.filter((t) => t.props.accessibilityState?.selected === true)).toHaveLength(1);
    expect(screen.getByTestId('tab-c').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('tab-a').props.accessibilityLabel).toBe('A');
  });

  it('names a tab by its accessibilityLabel when given, so the real count is spoken', () => {
    setup({ items: [item('a', { accessibilityLabel: 'Approvals, 250 pending', badge: '99+' })] });
    expect(screen.getByTestId('tab-a').props.accessibilityLabel).toBe('Approvals, 250 pending');
  });

  it('reports a tap and a long press with the item key', () => {
    const { onSelect, onLongPress } = setup();
    fireEvent.press(screen.getByTestId('tab-d'));
    expect(onSelect).toHaveBeenCalledWith('d');
    fireEvent(screen.getByTestId('tab-e'), 'longPress');
    expect(onLongPress).toHaveBeenCalledWith('e');
  });

  it('asks each item for its glyph with the state, colour and size the bar lays out for', () => {
    setup({ activeKey: 'b' });
    expect(screen.getByText('b-on')).toBeTruthy();
    expect(screen.getByText('a-off')).toBeTruthy();
    expect(flat(screen.getByTestId('glyph-b')).color).toBe(darkColors.accent);
    expect(flat(screen.getByTestId('glyph-a')).color).toBe(darkColors.textSecondary);
    expect(flat(screen.getByTestId('glyph-a')).width).toBe(TAB_BAR_LAYOUT.iconBox);
  });

  it('draws the active label in the accent colour and the rest in the neutral one', () => {
    setup({ activeKey: 'b' });
    expect(flat(screen.getByTestId('tab-b-label')).color).toBe(darkColors.accent);
    expect(flat(screen.getByTestId('tab-a-label')).color).toBe(darkColors.textSecondary);
  });

  it('follows the scheme, so the bar is not one dark strip on a light screen', () => {
    render(
      <SchemeProvider preference="light">
        <TabBar items={items} activeKey="b" onSelect={jest.fn()} />
      </SchemeProvider>,
    );
    expect(flat(screen.getByTestId('tab-b-label')).color).toBe(lightColors.accent);
    expect(flat(screen.getByTestId('tab-bar')).backgroundColor).toBe(lightColors.background);
    expect(flat(screen.getByTestId('tab-bar')).borderTopColor).toBe(lightColors.separator);
  });

  describe('badges', () => {
    it('draws one only on an item that has one', () => {
      setup({ items: [item('a', { badge: '3' }), item('b', { badge: null }), item('c')] });
      expect(within(badge('tab-a-badge')).getByText('3', { includeHiddenElements: true })).toBeTruthy();
      expect(screen.queryByTestId('tab-b-badge', { includeHiddenElements: true })).toBeNull();
      expect(screen.queryByTestId('tab-c-badge', { includeHiddenElements: true })).toBeNull();
    });

    it('is hidden from assistive tech, because the tab already says the count', () => {
      setup({ items: [item('a', { badge: '3' })] });
      expect(badge('tab-a-badge').props.importantForAccessibility).toBe('no-hide-descendants');
      expect(badge('tab-a-badge').props.accessibilityElementsHidden).toBe(true);
    });

    it('floats over the icon, so a badge appearing never shifts the layout', () => {
      setup({ items: [item('a', { badge: '99+' })] });
      expect(flat(badge('tab-a-badge')).position).toBe('absolute');
    });

    it('stays legible in both schemes', () => {
      for (const scheme of [darkColors, lightColors]) {
        expect(contrastRatio(scheme.onAccent, scheme.red)!).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('safe area and sizing', () => {
    it('pads the bar by the home-indicator inset', () => {
      setup({ bottomInset: 34 });
      expect(flat(screen.getByTestId('tab-bar')).paddingBottom).toBe(34);
    });

    it('keeps some padding on a device with no inset', () => {
      setup({ bottomInset: 0 });
      expect(flat(screen.getByTestId('tab-bar')).paddingBottom).toBeGreaterThan(0);
    });

    it('gives every tab at least a 44pt tap target', () => {
      setup();
      for (const tab of screen.getAllByRole('tab')) {
        expect(flat(tab).minHeight).toBeGreaterThanOrEqual(size.touchTarget);
      }
    });

    it('keeps each label on one line, shrinking before it would overlap its neighbour', () => {
      setup({ items: [item('a', { label: 'A very long destination' })] });
      const label = screen.getByTestId('tab-a-label');
      expect(label.props.numberOfLines).toBe(1);
      expect(label.props.adjustsFontSizeToFit).toBe(true);
      expect(label.props.maxFontSizeMultiplier).toBe(TAB_BAR_LAYOUT.labelMaxFontScale);
    });
  });

  describe('geometry does not depend on selection or badge', () => {
    /** Everything about the bar except colour and glyph, read off the rendered tree. */
    function geometry(activeKey: string, withBadge: boolean) {
      const list = keys.map((k) => item(k, { badge: withBadge ? '99+' : null }));
      const { unmount } = render(
        <TabBar items={list} activeKey={activeKey} onSelect={jest.fn()} bottomInset={34} />,
      );
      const out = keys.map((k) => {
        const label = screen.getByTestId(`tab-${k}-label`);
        const { color: _color, ...labelStyle } = flat(label);
        void _color;
        return { tab: flat(screen.getByTestId(`tab-${k}`)), label: labelStyle, lines: label.props.numberOfLines };
      });
      const bar = flat(screen.getByTestId('tab-bar'));
      unmount();
      return { out, bar };
    }

    it('is identical for every selection and with or without badges', () => {
      const reference = geometry('a', false);
      for (const k of keys) {
        for (const withBadge of [false, true]) {
          const g = geometry(k, withBadge);
          expect(g.bar).toEqual(reference.bar);
          expect(g.out).toEqual(reference.out);
        }
      }
    });

    it('draws every label in one weight and line box, selected or not', () => {
      setup({ activeKey: 'b' });
      for (const k of keys) {
        const style = flat(screen.getByTestId(`tab-${k}-label`));
        expect(style.fontWeight).toBe(TAB_BAR_LAYOUT.labelWeight);
        expect(style.lineHeight).toBe(TAB_BAR_LAYOUT.labelLineHeight);
        expect(flat(screen.getByTestId(`tab-${k}`)).gap).toBe(TAB_BAR_LAYOUT.iconToLabelGap);
      }
    });

    it('swaps the glyph only for the selected tab', () => {
      const drawn = (activeKey: string) => {
        const { unmount } = render(<TabBar items={items} activeKey={activeKey} onSelect={jest.fn()} />);
        const out = keys.map((k) => screen.getByTestId(`glyph-${k}`).props.children);
        unmount();
        return out;
      };
      for (const selected of keys) {
        drawn(selected).forEach((glyph, i) => {
          expect(glyph).toBe(`${keys[i]}-${keys[i] === selected ? 'on' : 'off'}`);
        });
      }
    });
  });
});
