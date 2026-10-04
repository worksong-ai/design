/**
 * The search state of a screen's header: it replaces the title row while a
 * search is open, because a phone header has room for one thing at a time.
 *
 * Same frame as `ScreenHeader` (`screenHeaderStyles.frame`), so opening search
 * does not move anything below it. The close glyph arrives as a node, as every
 * `IconButton` glyph does here.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../primitives/IconButton.js';
import { TextInput } from '../primitives/TextInput.js';
import { screenHeaderStyles } from './ScreenHeader.js';

export interface SearchHeaderProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  closeIcon: ReactNode;
  /** Defaults to "Close search". */
  closeLabel?: string;
  onClose: () => void;
  testID: string;
  inputTestID: string;
  closeTestID: string;
}

export function SearchHeader({
  value,
  onChangeText,
  placeholder,
  closeIcon,
  closeLabel = 'Close search',
  onClose,
  testID,
  inputTestID,
  closeTestID,
}: SearchHeaderProps) {
  return (
    <View style={screenHeaderStyles.frame} testID={testID}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          pill
          autoFocus
          testID={inputTestID}
        />
      </View>
      <IconButton icon={closeIcon} accessibilityLabel={closeLabel} onPress={onClose} testID={closeTestID} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
});
