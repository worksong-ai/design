/**
 * The OS font scale, as a hook.
 *
 * Every primitive that reserves vertical space takes a `fontScale` and threads
 * it into `scaledMinHeight`. Until this existed, nothing supplied it: each
 * defaulted to `1`, so the caps and grown row heights were exercised only by
 * tests and the accessibility guarantee they encode was, in the running app,
 * dead code. This is what connects them to the device.
 *
 * `useWindowDimensions().fontScale` rather than `PixelRatio.getFontScale()`
 * because only the hook re-renders when the user changes the setting while the
 * app is open — on iOS that happens without a relaunch, so reading it once at
 * module load produces a layout that is correct only until someone adjusts the
 * slider.
 *
 * A primitive still accepts an explicit `fontScale` prop, which wins. That is
 * what lets a test pin a scale without mocking the platform.
 */
import { useWindowDimensions } from 'react-native';

export function useFontScale(): number {
  const { fontScale } = useWindowDimensions();
  // Guard the value rather than trusting it: a non-finite or zero scale would
  // propagate into every minHeight as NaN and collapse the layout silently.
  return Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
}

/**
 * Resolve the scale a primitive should use.
 *
 * Call as `const scale = useResolvedFontScale(props.fontScale)`. Hook rules mean
 * the underlying hook must run unconditionally, so the override is applied after
 * the read, not instead of it.
 */
export function useResolvedFontScale(override: number | undefined): number {
  const osScale = useFontScale();
  return override ?? osScale;
}
