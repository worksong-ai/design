/**
 * A bottom tab bar: the phone shell's navigation, drawn from the same item
 * model as `NavRail` (icon over a short label, optional numeric badge).
 *
 * Presentation only. It takes the items, the active key and the badge strings
 * and reports presses; it reads no router and no API, so a product keeps its
 * own destinations, routes and badge fetching and renders this from them.
 *
 * Design decisions that are easy to undo by accident:
 *
 *   - **Selected is colour and glyph, and nothing that has a size.** Accent
 *     colour and the caller's active glyph -- so it survives colour blindness
 *     and greyscale, and a screen reader gets `selected` on top. It is
 *     deliberately NOT a heavier label: a bolder face is wider, so with
 *     `adjustsFontSizeToFit` the label would re-fit on every tab change and the
 *     row of labels would visibly shift. Every box is the same in every state
 *     (`TAB_BAR_LAYOUT`).
 *   - **The badge floats.** It is absolutely positioned against the icon, so a
 *     count appearing or growing to "99+" never moves a label or a neighbour.
 *   - **Labels cannot grow into each other.** Labels follow Dynamic Type only a
 *     little way and then shrink to fit on one line. The full name, and the
 *     real count, belong in `accessibilityLabel`.
 *   - **The inset is the bottom padding.** The bar grows by exactly the home
 *     indicator's height, so nothing tappable sits on the indicator. A device
 *     without one still gets a little air under the labels.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../primitives/Text.js';
import { useScheme } from '../primitives/useScheme.js';
import { TAB_BAR_LAYOUT } from '../tokens/layout.js';
import { size, space } from '../tokens/space.js';
import type { NavRailItem } from './NavRail.js';

/** A tab is a rail item: same key, label, glyph function, badge string and ids. */
export type TabBarItem = NavRailItem;

export interface TabBarProps {
  items: readonly TabBarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onLongPress?: (key: string) => void;
  /** The bottom safe-area inset: the home indicator's height, or 0. */
  bottomInset?: number;
  /** Also the container of the tab list. Items prefix `-badge` and `-label` with their own id. */
  testID?: string;
}

export function TabBar({
  items,
  activeKey,
  onSelect,
  onLongPress,
  bottomInset = 0,
  testID = 'tab-bar',
}: TabBarProps) {
  const c = useScheme();

  return (
    <View
      accessibilityRole="tablist"
      testID={testID}
      style={[
        styles.bar,
        {
          backgroundColor: c.background,
          borderTopColor: c.separator,
          paddingBottom: bottomInset > 0 ? bottomInset : space[2],
        },
      ]}
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
            onLongPress={onLongPress === undefined ? undefined : () => onLongPress(item.key)}
            testID={item.testID}
            style={styles.tab}
          >
            <View style={styles.iconWrap}>
              {item.icon({ selected, color, size: TAB_BAR_LAYOUT.iconBox })}
              {badge === null ? null : (
                <View
                  // The tab's own label already says "Approvals, 3 pending";
                  // the badge on its own would be read as a stray "3".
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
              maxFontSizeMultiplier={TAB_BAR_LAYOUT.labelMaxFontScale}
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
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[1],
    paddingHorizontal: space[1],
  },
  tab: {
    flex: 1,
    minHeight: Math.max(TAB_BAR_LAYOUT.barHeight, size.touchTarget),
    alignItems: 'center',
    justifyContent: 'center',
    gap: TAB_BAR_LAYOUT.iconToLabelGap,
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: TAB_BAR_LAYOUT.iconBox,
    height: TAB_BAR_LAYOUT.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -space[1],
    // Anchored to the icon's trailing edge and growing away from it, so a
    // two- or three-character count extends into empty space, not the glyph.
    left: TAB_BAR_LAYOUT.iconBox - space[2],
    minWidth: TAB_BAR_LAYOUT.badgeSize,
    height: TAB_BAR_LAYOUT.badgeSize,
    borderRadius: TAB_BAR_LAYOUT.badgeSize / 2,
    borderWidth: 1.5,
    paddingHorizontal: space[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12, letterSpacing: 0 },
  label: {
    fontWeight: TAB_BAR_LAYOUT.labelWeight,
    letterSpacing: 0,
    lineHeight: TAB_BAR_LAYOUT.labelLineHeight,
  },
});
