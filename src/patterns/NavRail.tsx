/**
 * A compact vertical navigation rail: each destination is an icon over a short
 * label, with a bar on the leading edge when active and an optional numeric
 * badge.
 *
 * Presentation only. It takes the items, the active key and the badge strings
 * and reports presses; it reads no router and no API, so a product keeps its
 * own destinations, routes and badge fetching and renders this from them.
 *
 * Active is colour, the caller's active glyph and a bar on the leading edge;
 * none of them changes a size, so selecting a destination or a badge appearing
 * never shifts a neighbour. The bar is always laid out (transparent when idle)
 * and the badge floats.
 *
 * There are deliberately no window controls, logo or title bar: those are
 * presentation context, not product UI.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../primitives/Text.js';
import { useScheme } from '../primitives/useScheme.js';
import { RAIL_LAYOUT, RAIL_WIDTH } from '../tokens/layout.js';
import { radius, size, space } from '../tokens/space.js';

export interface NavRailIconState {
  selected: boolean;
  /** The colour the rail is drawing this item in; pass it to the glyph. */
  color: string;
  /** The glyph size the rail lays out for. */
  size: number;
}

export interface NavRailItem {
  key: string;
  /** Short: it is drawn under the icon, on one line, shrinking to fit. */
  label: string;
  /** Called with the item's state, so a product can draw a filled glyph while active. */
  icon: (state: NavRailIconState) => ReactNode;
  /** Already formatted (see `formatBadgeCount`); `null` or omitted draws none. */
  badge?: string | null;
  /** What a screen reader says; defaults to `label`. Put the real count here. */
  accessibilityLabel?: string;
  /** Also prefixes `-active-bar`, `-badge` and `-label`. */
  testID: string;
}

export interface NavRailProps {
  items: readonly NavRailItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  testID?: string;
}

export function NavRail({ items, activeKey, onSelect, testID = 'nav-rail' }: NavRailProps) {
  const c = useScheme();

  return (
    <View
      accessibilityRole="tablist"
      testID={testID}
      style={[styles.rail, { backgroundColor: c.background, borderRightColor: c.separator }]}
    >
      {items.map((item) => {
        const selected = item.key === activeKey;
        const badge = item.badge ?? null;
        const color = selected ? c.accent : c.textSecondary;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            // react-native-web ignores `accessibilityState`; `aria-selected`
            // is what reaches the DOM there (and means the same on native).
            aria-selected={selected}
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            onPress={() => onSelect(item.key)}
            testID={item.testID}
            style={[styles.item, { backgroundColor: selected ? c.surface : 'transparent' }]}
          >
            {/* The leading-edge bar is always laid out, transparent when idle:
                selecting must change colour, never geometry. */}
            <View
              testID={`${item.testID}-active-bar`}
              style={[styles.bar, { backgroundColor: selected ? c.accent : 'transparent' }]}
            />
            <View style={styles.iconWrap}>
              {item.icon({ selected, color, size: size.iconLarge })}
              {badge === null ? null : (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  aria-hidden
                  testID={`${item.testID}-badge`}
                  style={[styles.badge, { backgroundColor: c.red, borderColor: c.background }]}
                >
                  <Text
                    variant="tiny"
                    color="onAccent"
                    direction="ltr"
                    numberOfLines={1}
                    maxFontSizeMultiplier={1}
                    style={styles.badgeText}
                  >
                    {badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              variant="tiny"
              color={color}
              direction="ltr"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={styles.label}
              testID={`${item.testID}-label`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: space[4],
    paddingHorizontal: space[2],
    gap: space[1],
    alignItems: 'stretch',
  },
  item: {
    height: RAIL_LAYOUT.itemHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: space[3],
    bottom: space[3],
    width: RAIL_LAYOUT.activeBarWidth,
    borderRadius: radius.full,
  },
  iconWrap: {
    width: size.iconLarge,
    height: size.iconLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -space[1],
    left: size.iconLarge - space[2],
    minWidth: RAIL_LAYOUT.badgeSize,
    height: RAIL_LAYOUT.badgeSize,
    borderRadius: RAIL_LAYOUT.badgeSize / 2,
    borderWidth: 1.5,
    paddingHorizontal: space[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12, letterSpacing: 0 },
  label: { fontWeight: '600', letterSpacing: 0, lineHeight: 14 },
});
