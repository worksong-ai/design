/**
 * The responsive frame around an app: rail, list pane, main pane.
 *
 * ```
 * | rail | list pane | main pane |      desktop
 * | rail | list OR main        |      tablet
 *          main                       mobile
 * ```
 *
 * Presentation only. It owns no navigation state: the product decides which
 * pane a tablet shows (`tabletPane`), what is in each slot, and what `mobile`
 * means -- there it renders just `main`, so the product's own phone navigation
 * (bottom tabs, a stack) lives inside it, untouched.
 *
 * A pane that is not showing stays mounted and is hidden with `display: none`,
 * so a list keeps its scroll position and a conversation its state when a
 * tablet flips between them.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useScheme } from '../primitives/useScheme.js';
import { listPaneWidth, type ShellLayout } from '../tokens/layout.js';

export interface ShellFrameProps {
  layout: ShellLayout;
  rail: ReactNode;
  list: ReactNode;
  main: ReactNode;
  /** On `tablet` only: which of the two panes beside the rail shows. Default `list`. */
  tabletPane?: 'list' | 'main';
  /** Overrides the window-derived list pane width at `desktop`. */
  listWidth?: number;
  testID?: string;
}

export function ShellFrame({
  layout,
  rail,
  list,
  main,
  tabletPane = 'list',
  listWidth,
  testID = 'shell-frame',
}: ShellFrameProps) {
  const c = useScheme();
  const { width } = useWindowDimensions();

  if (layout === 'mobile') {
    return (
      <View style={[styles.shell, { backgroundColor: c.background }]} testID={testID}>
        <View testID="shell-main-pane" style={styles.main}>
          {main}
        </View>
      </View>
    );
  }

  const desktop = layout === 'desktop';
  const showList = desktop || tabletPane === 'list';
  const showMain = desktop || tabletPane === 'main';

  return (
    <View style={[styles.shell, { backgroundColor: c.background }]} testID={testID}>
      {rail}
      <View
        testID="shell-list-pane"
        style={[
          desktop
            ? [styles.listPane, { width: listWidth ?? listPaneWidth(width), borderRightColor: c.separator }]
            : styles.fill,
          !showList && styles.hidden,
        ]}
      >
        {list}
      </View>
      <View testID="shell-main-pane" style={[styles.main, !showMain && styles.hidden]}>
        {main}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  listPane: { borderRightWidth: StyleSheet.hairlineWidth },
  fill: { flex: 1, minWidth: 0 },
  main: { flex: 1, minWidth: 0 },
  hidden: { display: 'none' },
});
