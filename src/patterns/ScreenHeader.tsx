/**
 * The title row of a root screen: the title, an optional badge beside it, and a
 * row of icon buttons on the right. Two root screens that use it have their
 * title and buttons at the same X/Y.
 *
 * The badge is a sibling of the title, not part of it: it is laid out in its
 * own slot and the row is a fixed minimum height, so a badge appearing,
 * growing or disappearing cannot move the title's baseline or the buttons.
 *
 * A pushed screen passes `back` (a chevron before the title) and may add a
 * `subtitle`; a root screen passes neither. Nothing else draws a screen title.
 *
 * Generic on purpose: no icons, routes or product copy. The glyph of each
 * action arrives as a node (see `IconButton`) and `accessibilityLabel` is
 * required, because an icon-only action has no text for a screen reader.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../primitives/IconButton.js';
import { Text } from '../primitives/Text.js';
import { HEADER_LAYOUT } from '../tokens/layout.js';

export interface ScreenHeaderAction {
  key: string;
  icon: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  testID: string;
}

/** The back chevron of a pushed screen, drawn before the title. */
export interface ScreenHeaderBack {
  icon: ReactNode;
  /** Defaults to "Back". */
  accessibilityLabel?: string;
  onPress: () => void;
  testID: string;
}

export interface ScreenHeaderProps {
  title: string;
  /** A pushed screen's way back. Root (tab) screens leave it out. */
  back?: ScreenHeaderBack;
  /** One line under the title (the bot a screen is about). Never moves the buttons. */
  subtitle?: string;
  /** Sits beside the title (e.g. "1 need you"). Never affects the title's position. */
  badge?: ReactNode;
  actions: readonly ScreenHeaderAction[];
  testID?: string;
}

export function ScreenHeader({ title, back, subtitle, badge, actions, testID }: ScreenHeaderProps) {
  return (
    <View style={styles.header} testID={testID}>
      <View style={styles.titleCluster} testID="screen-header-title">
        {back === undefined ? null : (
          <IconButton
            icon={back.icon}
            accessibilityLabel={back.accessibilityLabel ?? 'Back'}
            onPress={back.onPress}
            testID={back.testID}
          />
        )}
        <View style={styles.titleText}>
          <Text variant="screenTitle" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle === undefined ? null : (
            <Text variant="caption" color="textSecondary" numberOfLines={1} testID="screen-header-subtitle">
              {subtitle}
            </Text>
          )}
        </View>
        {badge === undefined || badge === null ? null : <View style={styles.badgeSlot}>{badge}</View>}
      </View>
      <View style={styles.actions} testID="screen-header-actions">
        {actions.map((action) => (
          <IconButton
            key={action.key}
            icon={action.icon}
            accessibilityLabel={action.accessibilityLabel}
            {...(action.accessibilityHint === undefined
              ? {}
              : { accessibilityHint: action.accessibilityHint })}
            onPress={action.onPress}
            testID={action.testID}
          />
        ))}
      </View>
    </View>
  );
}

/** The header row's frame, shared with a screen's own variants (a search bar in its place). */
export const screenHeaderStyles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER_LAYOUT.paddingHorizontal,
    paddingVertical: HEADER_LAYOUT.paddingVertical,
    gap: HEADER_LAYOUT.gap,
    minHeight: HEADER_LAYOUT.minHeight + HEADER_LAYOUT.paddingVertical * 2,
  },
});

const styles = StyleSheet.create({
  header: screenHeaderStyles.frame,
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_LAYOUT.titleGap,
    flexShrink: 1,
  },
  titleText: { flexShrink: 1 },
  badgeSlot: { flexShrink: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: HEADER_LAYOUT.actionsGap },
});
