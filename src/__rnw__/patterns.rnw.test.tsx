import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import { SchemeProvider } from '../primitives/useScheme.js';
import { Text } from '../primitives/Text.js';
import {
  FilterChips,
  NavRail,
  ScreenHeader,
  ShellFrame,
  TabBar,
  formatBadgeCount,
  type NavRailItem,
} from '../patterns/index.js';
import { darkColors, lightColors } from '../tokens/colors.js';
import { RAIL_WIDTH } from '../tokens/layout.js';

/** `rgb(r, g, b)` from a `#rrggbb` token, as jsdom reports computed colours. */
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

afterEach(cleanup);

const withScheme = (preference: 'dark' | 'light', node: ReactNode) => (
  <SchemeProvider preference={preference}>{node}</SchemeProvider>
);

const railItems: NavRailItem[] = [
  { key: 'a', label: 'Chats', icon: ({ color }) => <Text color={color}>a</Text>, badge: '3', accessibilityLabel: 'Chats, 3 unread', testID: 'tab-a' },
  { key: 'b', label: 'A very long destination name', icon: ({ color }) => <Text color={color}>b</Text>, testID: 'tab-b' },
];

describe('ScreenHeader through react-native-web', () => {
  it('renders the title, a badge and labelled icon-only actions', () => {
    const onPress = jest.fn();
    render(
      <ScreenHeader
        title="Tasks"
        badge={<Text>2 need you</Text>}
        actions={[{ key: 's', icon: <Text>s</Text>, accessibilityLabel: 'Search', onPress, testID: 'act-s' }]}
        testID="h"
      />,
    );
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('2 need you')).toBeTruthy();
    const search = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(search);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws the title in the %s text colour', (preference, scheme) => {
    render(withScheme(preference, <ScreenHeader title="Tasks" actions={[]} />));
    expect(getComputedStyle(screen.getByText('Tasks')).color).toBe(rgb(scheme.textPrimary));
  });
});

describe('FilterChips through react-native-web', () => {
  const chips = (selected: 'a' | 'b') => [
    { id: 'a' as const, label: 'All', selected: selected === 'a', testID: 'chip-a' },
    { id: 'b' as const, label: 'Needs you 12', selected: selected === 'b', accessibilityLabel: 'Needs you, 12', testID: 'chip-b' },
  ];

  it('exposes a radio group of radios with checked state, and reports a click', () => {
    const onSelect = jest.fn();
    render(<FilterChips chips={chips('a')} onSelect={onSelect} testID="chips" radioGroup />);
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    expect(screen.getByRole('radio', { name: 'Needs you, 12' })).toBeTruthy();
    fireEvent.click(radios[1]!);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('is reachable and activatable from the keyboard', () => {
    const onSelect = jest.fn();
    render(<FilterChips chips={chips('a')} onSelect={onSelect} testID="chips" />);
    const chip = screen.getByRole('radio', { name: 'Needs you, 12' });
    expect(chip.getAttribute('tabindex')).toBe('0');
    act(() => chip.focus());
    expect(document.activeElement).toBe(chip);
    fireEvent.keyDown(chip, { key: 'Enter' });
    fireEvent.keyUp(chip, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('keeps every chip the same box when the selection moves', () => {
    const { rerender } = render(<FilterChips chips={chips('a')} onSelect={() => {}} testID="chips" />);
    const box = (id: string) => {
      const s = getComputedStyle(byTestId(id)!);
      return [s.paddingLeft, s.paddingRight, s.paddingTop, s.paddingBottom, s.borderTopWidth, s.borderLeftWidth];
    };
    const before = [box('chip-a'), box('chip-b')];
    rerender(<FilterChips chips={chips('b')} onSelect={() => {}} testID="chips" />);
    expect([box('chip-a'), box('chip-b')]).toEqual(before);
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws the selected chip raised in the %s scheme', (preference, scheme) => {
    render(withScheme(preference, <FilterChips chips={chips('a')} onSelect={() => {}} testID="chips" />));
    expect(getComputedStyle(byTestId('chip-a')!).backgroundColor).toBe(rgb(scheme.surfaceElevated));
    expect(getComputedStyle(byTestId('chip-b')!).backgroundColor).toBe(rgb(scheme.surface));
  });
});

describe('NavRail through react-native-web', () => {
  it('is a tablist of tabs with selected state and the accessible label', () => {
    render(<NavRail items={railItems} activeKey="a" onSelect={() => {}} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(screen.getByRole('tab', { name: 'Chats, 3 unread' })).toBeTruthy();
    expect(getComputedStyle(byTestId('nav-rail')!).width).toBe(`${RAIL_WIDTH}px`);
  });

  it('moves between destinations with the keyboard', () => {
    const onSelect = jest.fn();
    render(<NavRail items={railItems} activeKey="a" onSelect={onSelect} />);
    const second = screen.getAllByRole('tab')[1]!;
    expect(second.getAttribute('tabindex')).toBe('0');
    act(() => second.focus());
    expect(document.activeElement).toBe(second);
    fireEvent.keyDown(second, { key: 'Enter' });
    fireEvent.keyUp(second, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('hides the badge from assistive tech, and draws it only on the item that has one', () => {
    render(<NavRail items={railItems} activeKey="a" onSelect={() => {}} />);
    const badge = byTestId('tab-a-badge')!;
    expect(within(badge).getByText('3')).toBeTruthy();
    expect(badge.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(byTestId('tab-b-badge')).toBeNull();
  });

  it('keeps the same item box whether active or not, and with a badge or not', () => {
    const box = (id: string) => {
      const s = getComputedStyle(byTestId(id)!);
      return [s.height, s.width, s.borderTopWidth];
    };
    const { rerender } = render(<NavRail items={railItems} activeKey="a" onSelect={() => {}} />);
    const before = railItems.map((i) => box(i.testID));
    rerender(<NavRail items={railItems.map((i) => ({ ...i, badge: i.key === 'b' ? '99+' : null }))} activeKey="b" onSelect={() => {}} />);
    expect(railItems.map((i) => box(i.testID))).toEqual(before);
  });

  it('truncates a long label to one line instead of growing the item', () => {
    render(<NavRail items={railItems} activeKey="a" onSelect={() => {}} />);
    const label = byTestId('tab-b-label')!;
    expect(getComputedStyle(label).whiteSpace).toBe('nowrap');
    expect(label.textContent).toBe('A very long destination name');
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('marks the active item in the %s scheme', (preference, scheme) => {
    render(withScheme(preference, <NavRail items={railItems} activeKey="a" onSelect={() => {}} />));
    expect(getComputedStyle(byTestId('tab-a-active-bar')!).backgroundColor).toBe(rgb(scheme.accent));
    expect(getComputedStyle(byTestId('tab-a')!).backgroundColor).toBe(rgb(scheme.surface));
  });
});

describe('TabBar through react-native-web', () => {
  it('is a tablist of tabs with selected state and the accessible label', () => {
    render(<TabBar items={railItems} activeKey="a" onSelect={() => {}} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(screen.getByRole('tab', { name: 'Chats, 3 unread' })).toBeTruthy();
  });

  it('reports a press, and is reachable and activatable by keyboard', () => {
    const onSelect = jest.fn();
    render(<TabBar items={railItems} activeKey="a" onSelect={onSelect} />);
    const second = screen.getAllByRole('tab')[1]!;
    expect(second.getAttribute('tabindex')).toBe('0');
    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('hides the badge from assistive tech and keeps every tab box the same with or without one', () => {
    const box = (id: string) => {
      const s = getComputedStyle(byTestId(id)!);
      return [s.height, s.width, s.minHeight];
    };
    const { rerender } = render(<TabBar items={railItems} activeKey="a" onSelect={() => {}} />);
    expect(byTestId('tab-a-badge')!.closest('[aria-hidden="true"]')).not.toBeNull();
    const before = railItems.map((i) => box(i.testID));
    rerender(
      <TabBar items={railItems.map((i) => ({ ...i, badge: i.key === 'b' ? '99+' : null }))} activeKey="b" onSelect={() => {}} />,
    );
    expect(railItems.map((i) => box(i.testID))).toEqual(before);
  });

  it('truncates a long label to one line instead of growing the tab', () => {
    render(<TabBar items={railItems} activeKey="a" onSelect={() => {}} />);
    expect(getComputedStyle(byTestId('tab-b-label')!).whiteSpace).toBe('nowrap');
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws the bar and the active label in the %s scheme', (preference, scheme) => {
    render(withScheme(preference, <TabBar items={railItems} activeKey="a" onSelect={() => {}} />));
    expect(getComputedStyle(byTestId('tab-bar')!).backgroundColor).toBe(rgb(scheme.background));
    expect(getComputedStyle(byTestId('tab-a-label')!).color).toBe(rgb(scheme.accent));
    expect(getComputedStyle(byTestId('tab-b-label')!).color).not.toBe(rgb(scheme.accent));
  });
});

describe('ShellFrame through react-native-web', () => {
  const frame = (layout: 'mobile' | 'tablet' | 'desktop', tabletPane: 'list' | 'main' = 'list') => (
    <ShellFrame
      layout={layout}
      tabletPane={tabletPane}
      rail={<Text>rail</Text>}
      list={<Text>list</Text>}
      main={<Text>main</Text>}
    />
  );

  it('shows rail, list and main side by side on desktop, with the list pane at its width', () => {
    render(frame('desktop'));
    expect(screen.getByText('rail')).toBeTruthy();
    expect(getComputedStyle(byTestId('shell-frame')!).flexDirection).toBe('row');
    expect(getComputedStyle(byTestId('shell-list-pane')!).display).not.toBe('none');
    expect(getComputedStyle(byTestId('shell-main-pane')!).display).not.toBe('none');
    expect(getComputedStyle(byTestId('shell-list-pane')!).width).toMatch(/^3[48]0px$/);
  });

  it('collapses to one pane on a tablet and flips with tabletPane', () => {
    const { rerender } = render(frame('tablet'));
    expect(getComputedStyle(byTestId('shell-list-pane')!).display).not.toBe('none');
    expect(getComputedStyle(byTestId('shell-main-pane')!).display).toBe('none');
    rerender(frame('tablet', 'main'));
    expect(getComputedStyle(byTestId('shell-list-pane')!).display).toBe('none');
    expect(getComputedStyle(byTestId('shell-main-pane')!).display).not.toBe('none');
  });

  it('renders just main on mobile', () => {
    render(frame('mobile'));
    expect(screen.getByText('main')).toBeTruthy();
    expect(screen.queryByText('rail')).toBeNull();
    expect(screen.queryByText('list')).toBeNull();
  });

  it('does not overflow the window horizontally', () => {
    render(frame('desktop'));
    const s = getComputedStyle(byTestId('shell-frame')!);
    expect(s.overflowX).not.toBe('scroll');
    expect(getComputedStyle(byTestId('shell-main-pane')!).minWidth).toBe('0px');
  });
});

describe('formatBadgeCount', () => {
  it('is shared with web unchanged', () => {
    expect(formatBadgeCount(120)).toBe('99+');
  });
});
