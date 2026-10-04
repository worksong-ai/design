/**
 * The horizontally-scrolling filter chips under a root screen's header.
 *
 * Same height, radius, typography, padding, gap and selected treatment on every
 * screen, and the same distance under the header. Each screen keeps its own
 * filters, labels (counts can ride in them) and testIDs.
 *
 * Selecting a chip changes colour and never geometry: the border is always
 * drawn (transparent when unselected), so neighbours do not move.
 */
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '../primitives/Text.js';
import { useScheme } from '../primitives/useScheme.js';
import { CHIP_LAYOUT } from '../tokens/layout.js';

export interface FilterChip<Id extends string> {
  id: Id;
  /** What the chip shows. */
  label: string;
  selected: boolean;
  /** What a screen reader says; defaults to `label`. */
  accessibilityLabel?: string;
  testID: string;
}

export interface FilterChipsProps<Id extends string> {
  chips: readonly FilterChip<Id>[];
  onSelect: (id: Id) => void;
  testID: string;
  /** Marks the row as a radio group for assistive tech. */
  radioGroup?: boolean;
}

export function FilterChips<Id extends string>({
  chips,
  onSelect,
  testID,
  radioGroup = false,
}: FilterChipsProps<Id>) {
  const c = useScheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      {...(radioGroup ? { accessibilityRole: 'radiogroup' as const } : {})}
      testID={testID}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.id}
          accessibilityRole="radio"
          accessibilityState={{ selected: chip.selected }}
          // react-native-web ignores `accessibilityState`; a DOM radio is
          // "checked", not "selected". Native keeps `selected` only, as before.
          {...(Platform.OS === 'web' ? { 'aria-checked': chip.selected } : {})}
          accessibilityLabel={chip.accessibilityLabel ?? chip.label}
          onPress={() => onSelect(chip.id)}
          // The chip is drawn compact, as designed; the hit target is not.
          // 44pt is the floor for anything tappable.
          hitSlop={{ top: CHIP_LAYOUT.paddingVertical, bottom: CHIP_LAYOUT.paddingVertical }}
          testID={chip.testID}
          style={[
            styles.chip,
            {
              backgroundColor: chip.selected ? c.surfaceElevated : c.surface,
              borderColor: chip.selected ? c.focus : 'transparent',
            },
          ]}
        >
          <Text variant="tiny" color={chip.selected ? 'textPrimary' : 'textSecondary'}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexShrink too: RN's ScrollView defaults to flexShrink 1, so a long list
  // below would squeeze this row and clip the chip labels.
  row: { flexGrow: 0, flexShrink: 0 },
  content: {
    paddingHorizontal: CHIP_LAYOUT.rowPaddingHorizontal,
    gap: CHIP_LAYOUT.gap,
    paddingBottom: CHIP_LAYOUT.rowPaddingBottom,
  },
  chip: {
    paddingHorizontal: CHIP_LAYOUT.paddingHorizontal,
    paddingVertical: CHIP_LAYOUT.paddingVertical,
    borderRadius: CHIP_LAYOUT.radius,
    borderWidth: CHIP_LAYOUT.borderWidth,
  },
});
