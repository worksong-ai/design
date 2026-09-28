/**
 * Which colour scheme a primitive should paint itself in.
 *
 * Modelled on `useResolvedFontScale` next door, and for the same reason: every
 * primitive already accepts a `scheme` prop and every one of them defaulted it
 * to `darkColors`, so the light palette — complete, and contrast-tested in CI —
 * was exercised only by tests. This is what connects it to the device.
 *
 * ## Why a context and not a prop
 *
 * There are 118 `darkColors` references across 45 files in the app. Threading a
 * prop through all of them is 45 diffs that must all be right and stay right;
 * one missed call site is a dark card on a light screen, which reads as a
 * rendering bug rather than a missed prop. A context has one provider and a
 * default that is what the app already does.
 *
 * The prop still wins where it is given. That is what lets a test pin a scheme
 * without mounting a provider, which every existing primitive test does.
 *
 * ## The default is dark, deliberately
 *
 * Not `system`. `app.json` pins `userInterfaceStyle: "dark"`, so iOS reports
 * dark whatever the device is set to — until that key is changed, which moves
 * the native fingerprint and therefore needs a new binary (measured:
 * `618694f3…` → `61c36bae…`). Until then a `system` default would be a lie that
 * happens to produce the right answer. `SchemeProvider` is how the app opts in,
 * once the binary can honour it.
 */
import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorScheme } from '../tokens/colors.js';

/** What the app asks for, as opposed to what it gets. */
export type SchemePreference = 'light' | 'dark' | 'system';

const SchemeContext = createContext<ColorScheme>(darkColors);

export interface SchemeProviderProps {
  /**
   * `system` follows the OS. Anything else pins it, which is what a preview
   * screen or a settings toggle wants.
   */
  preference?: SchemePreference;
  children: ReactNode;
}

export function SchemeProvider({ preference = 'system', children }: SchemeProviderProps) {
  // Unconditionally, because hooks: the OS value is read even when a pinned
  // preference is going to discard it.
  const os = useColorScheme();
  const resolved = schemeFor(preference, os);
  // `createElement` rather than JSX so this file stays `.ts` — the rest of the
  // tokens layer is plain TypeScript and the package's build does not treat
  // this directory as JSX-only.
  return createElement(SchemeContext.Provider, { value: resolved }, children);
}

/**
 * The scheme in force. Dark unless a provider says otherwise, which is exactly
 * what the app did before this existed.
 */
export function useScheme(): ColorScheme {
  return useContext(SchemeContext);
}

/**
 * Resolve the scheme a primitive should use.
 *
 * Call as `const scheme = useResolvedScheme(props.scheme)`. Hook rules mean the
 * context read must happen unconditionally, so the override is applied after
 * it, not instead of it.
 */
export function useResolvedScheme(override: ColorScheme | undefined): ColorScheme {
  const fromContext = useScheme();
  return override ?? fromContext;
}

/**
 * Pure, so the resolution itself is testable without a renderer.
 *
 * `useColorScheme()` returns `null` when the platform has no opinion — at that
 * point dark is the honest answer, because it is what this product is.
 */
export function schemeFor(
  preference: SchemePreference,
  // Deliberately wider than `'light' | 'dark'`. React Native's own
  // `ColorSchemeName` also admits `'unspecified'`, and the two apps consuming
  // this package are on different RN versions — narrowing here made the design
  // package fail to typecheck against its own copy. Only `'light'` is light;
  // everything else, known or not, is dark.
  os: string | null | undefined,
): ColorScheme {
  if (preference === 'light') return lightColors;
  if (preference === 'dark') return darkColors;
  return os === 'light' ? lightColors : darkColors;
}
