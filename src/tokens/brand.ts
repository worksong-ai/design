/**
 * Third-party brand colours, which are not ours to theme.
 *
 * These live in the design package for the same reason every other literal
 * does — CI refuses a raw hex outside it — but they are deliberately *not*
 * part of `ColorScheme`. A `ColorScheme` value is ours and flips with the
 * theme; these are fixed by somebody else's brand guidelines and must not.
 *
 * ## Sign in with Apple
 *
 * Apple's Human Interface Guidelines allow exactly three button styles —
 * black, white, and white-with-outline — and the rule is to pick the one that
 * contrasts with the background. This app is dark-only on true black, so the
 * white button is the only one of the three that is visible at all.
 *
 * The values are absolute black and absolute white on purpose. Substituting
 * the scheme's `background` and `textPrimary`, which happen to be the same two
 * values today, would silently produce a near-black-on-near-white button the
 * day a surface token is nudged — and button appearance is checked at review.
 */
export const brandColors = {
  apple: {
    /** The button fill. White, per the HIG's light style. */
    background: '#FFFFFF',
    /** The Apple mark and the label drawn on it. */
    foreground: '#000000',
  },
  /**
   * WhatsApp linking QR (#392). A QR must be dark modules on a light quiet
   * zone to scan reliably, whatever the app theme — so this is absolute
   * white, not a scheme surface.
   */
  qr: {
    background: '#FFFFFF',
  },
} as const;

/**
 * Apple's minimum button height.
 *
 * The HIG specifies a minimum of 44pt for the Sign in with Apple button, which
 * is also the iOS minimum tap target, so this is a floor and not a preference.
 */
export const APPLE_BUTTON_MIN_HEIGHT = 44;

/** The HIG's corner radius for the default (non-pill) button. */
export const APPLE_BUTTON_RADIUS = 8;
