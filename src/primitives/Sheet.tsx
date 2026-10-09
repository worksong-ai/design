/**
 * Sheet.
 *
 * The mobile replacement for the web bot's modal dialogs — approve, rename,
 * confirm — which on a phone belong at the thumb end of the screen rather than
 * centred in it. Worksong re-rolls this shell in confirm-sheet and
 * rename-modal, with a different scrim in each and no agreement on whether the
 * hardware back button does anything.
 *
 * Four things it guarantees that a hand-rolled Modal does not:
 *
 *   - **A press inside never dismisses.** The backdrop is a *sibling* of the
 *     panel rather than its parent, so there is no bubbling path from the
 *     content to the dismiss handler at all. Wrapping the panel in the
 *     backdrop and relying on the inner view to swallow the touch is the same
 *     bug waiting on the next refactor.
 *   - **Android Back closes it.** `onRequestClose` is the only route the
 *     hardware button has into a Modal, and a sheet that ignores Back is a
 *     trapped user.
 *   - **It never grows past the screen.** The panel is capped at
 *     `SHEET_MAX_HEIGHT_RATIO` of the window and its body scrolls inside the
 *     cap, under a header that stays put. Without the cap a sheet with more
 *     rows than the window is tall (the chat's More menu on a phone held
 *     sideways) grew off the top: the title and the first row were cut off
 *     and nothing could scroll them back.
 *   - **The whole scrim dismisses.** The backdrop fills the screen *behind*
 *     the panel, so a tap beside a centred card on an iPad or a desktop
 *     window closes it, not only a tap above it (a flex child above the panel
 *     left the strips either side of a 560 pt card dead).
 */
import type { ReactNode } from 'react';
import {
  Modal,
  type ModalProps,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import type { ColorScheme } from '../tokens/colors.js';
import { radius, size, space } from '../tokens/space.js';
import { scaledMinHeight } from '../tokens/typography.js';
import { Text } from './Text.js';
import { useResolvedFontScale } from './useFontScale.js';
import { useResolvedScheme } from './useScheme.js';

/** Every orientation, so a sheet never forces the screen underneath to turn. */
export const SHEET_ORIENTATIONS: NonNullable<ModalProps['supportedOrientations']> = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];

/** A sheet is never taller than this share of the window; the rest is scrim. */
export const SHEET_MAX_HEIGHT_RATIO = 0.9;

/**
 * Widest a sheet gets. A bottom sheet stretched across an iPad or a browser
 * window is a long flat strip, so past this width it stays a centred card.
 */
export const SHEET_MAX_WIDTH = 560;

/** Diameter of the small close button in a sheet's title row. */
const CLOSE_SIZE = 32;

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  scheme?: ColorScheme;
  testID?: string;
  /** Tap the scrim to dismiss. Turn off for a sheet that must be answered. */
  dismissOnBackdropPress?: boolean;
  /**
   * A small X at the end of the title row. On by default for a titled sheet
   * that can be dismissed; a sheet that must be answered never shows it.
   */
  showCloseButton?: boolean;
  /** OS font scale, for the header's minimum height. */
  fontScale?: number;
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
  scheme: schemeOverride,
  testID,
  dismissOnBackdropPress = true,
  showCloseButton = true,
  fontScale,
}: SheetProps) {
  const scheme = useResolvedScheme(schemeOverride);
  // The prop wins when given (tests pin a scale); otherwise the device decides.
  const resolvedFontScale = useResolvedFontScale(fontScale);
  const { height: windowHeight } = useWindowDimensions();
  const maxHeight = Math.floor(windowHeight * SHEET_MAX_HEIGHT_RATIO);
  return (
    <Modal
      testID="sheet-modal"
      visible={visible}
      // Transparent so the scrim below is what the user sees through.
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // React Native's iOS Modal supports portrait only unless told otherwise,
      // so opening a sheet on a phone held sideways rotated the whole app to
      // portrait for as long as the sheet was up (TestFlight 2.0.0 (5)).
      supportedOrientations={SHEET_ORIENTATIONS}
    >
      <View
        // Without this, VoiceOver keeps walking the screen underneath as
        // though the sheet were not there.
        accessibilityViewIsModal
        testID={testID}
        style={[styles.container, { backgroundColor: scheme.scrim }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessibilityState={{ disabled: !dismissOnBackdropPress }}
          testID="sheet-backdrop"
          disabled={!dismissOnBackdropPress}
          onPress={onClose}
          // Behind the panel and over the whole screen, so the strips either
          // side of a centred card close the sheet too.
          style={StyleSheet.absoluteFill}
        />
        <View
          testID="sheet-panel"
          style={[
            styles.panel,
            {
              maxHeight,
              backgroundColor: scheme.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
            },
          ]}
        >
          {title === undefined ? null : (
            <View
              testID="sheet-header"
              style={[
                styles.header,
                { minHeight: scaledMinHeight(size.touchTarget, 'sectionTitle', resolvedFontScale) },
              ]}
            >
              <Text variant="sectionTitle" scheme={scheme} style={styles.title}>
                {title}
              </Text>
              {showCloseButton && dismissOnBackdropPress ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close sheet"
                  testID="sheet-close"
                  onPress={onClose}
                  hitSlop={space[2]}
                  style={[styles.close, { backgroundColor: scheme.surfaceElevated }]}
                >
                  <View style={[styles.bar, styles.barA, { backgroundColor: scheme.textSecondary }]} />
                  <View style={[styles.bar, styles.barB, { backgroundColor: scheme.textSecondary }]} />
                </Pressable>
              ) : null}
            </View>
          )}
          <ScrollView
            testID="sheet-body"
            style={styles.body}
            // Rows inside take their own taps even while a keyboard is up.
            keyboardShouldPersistTaps="handled"
            // A short sheet is not a scroll view: no rubber-banding, no bar.
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: space[4],
    paddingTop: space[4],
    // Clears the home indicator. This package cannot depend on
    // safe-area-context, so the inset is a constant rather than a measurement.
    paddingBottom: space[8],
  },
  // `flexShrink` lets the body give way to the cap above; `flexGrow: 0` keeps a
  // short body at its own height instead of stretching the panel.
  body: { flexGrow: 0, flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: space[2] },
  title: { flex: 1 },
  // Small on purpose: the title row is the sheet's, and the scrim is the big
  // way out. `hitSlop` keeps the touch target at the 44 pt floor.
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: space[3],
  },
  // Two crossed bars rather than a glyph: no font or icon dependency.
  bar: { position: 'absolute', width: 14, height: 2, borderRadius: 1 },
  barA: { transform: [{ rotate: '45deg' }] },
  barB: { transform: [{ rotate: '-45deg' }] },
});
