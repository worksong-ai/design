/**
 * Colour tokens, as light/dark pairs.
 *
 * The dark values are Worksong's `NDColor` verbatim — true-black background,
 * signature green for healthy/running, red for error, yellow for pending, blue
 * for info — so the two products stay visually identical. (Those in turn came
 * from TradeQuests's `TQColor`, converted from SwiftUI 0–1 to 0–255.)
 *
 * v1 ships dark-only. Light is defined anyway because Worksong's palette is
 * dark-only at six independent layers, and two of them make a later retrofit
 * genuinely expensive:
 *
 *   - `textSecondary` / `textTertiary` are white-alpha, so they are invisible
 *     on a light background rather than merely low-contrast;
 *   - the background colour doubles as the implicit "on accent" colour, which
 *     inverts meaninglessly under a light theme.
 *
 * Defining the pair now costs almost nothing. Retrofitting it after 40 screens
 * exist costs a re-theme, which is how Worksong ended up where it is. The
 * second problem is fixed here by giving `onAccent` a name of its own instead
 * of reaching for `background`.
 */

export interface ColorScheme {
  /** App background. */
  background: string;
  /** Elevated surface for cards and sheets. */
  surface: string;
  /** Further-elevated surface. */
  surfaceElevated: string;
  /** Hairline separators. */
  separator: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  /** Signature green — running / idle / healthy / approved. */
  green: string;
  /** Error red — error / stopped / rejected / expired. */
  red: string;
  /** Warning yellow — pending / degraded. */
  yellow: string;
  /** Info blue — info / neutral. */
  blue: string;

  /** Accent. The signature green in both schemes. */
  accent: string;
  /**
   * Text and icons drawn ON the accent.
   *
   * Named rather than derived. Worksong uses its background colour for this,
   * which works only because that colour happens to be black.
   */
  onAccent: string;

  /** Outgoing chat bubble. A primary surface in a chat-first product. */
  bubbleOut: string;
  /** Incoming chat bubble. */
  bubbleIn: string;

  /** Focus ring / selected outline. */
  focus: string;
  /** Scrim behind a modal or sheet. */
  scrim: string;
  /**
   * Drop-shadow colour.
   *
   * Black in both schemes — a light theme lowers shadow *opacity*, it does not
   * tint the shadow. Named anyway so the elevation scale has somewhere to read
   * it from instead of carrying a literal of its own.
   */
  shadow: string;
}

export const darkColors: ColorScheme = {
  background: '#000000',
  surface: '#1A1A1A', // white 0.10
  surfaceElevated: '#242424', // white 0.14
  separator: '#2E2E2E', // white 0.18

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.62)',
  textTertiary: 'rgba(255, 255, 255, 0.42)',

  green: '#00C752',
  red: '#FF5252',
  yellow: '#FACC15',
  blue: '#7EB8DA',

  accent: '#00C752',
  onAccent: '#000000',

  // Worksong hardcodes this one in ChatScreen, outside its token set.
  bubbleOut: '#0B4A33',
  bubbleIn: '#1A1A1A',

  focus: '#00C752',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const lightColors: ColorScheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#EBEBEB',
  separator: '#D9D9D9',

  textPrimary: '#0A0A0A',
  textSecondary: 'rgba(0, 0, 0, 0.62)',
  textTertiary: 'rgba(0, 0, 0, 0.42)',

  // Darkened so they still pass contrast on white; the dark scheme's values are
  // tuned for a black background and are too light here.
  green: '#00A344',
  red: '#D93B3B',
  yellow: '#B8860B',
  blue: '#3F7FA6',

  accent: '#00A344',
  onAccent: '#FFFFFF',

  bubbleOut: '#D6F5E4',
  bubbleIn: '#F0F0F0',

  focus: '#00A344',
  scrim: 'rgba(0, 0, 0, 0.35)',
  shadow: '#000000',
};

export type ColorSchemeName = 'light' | 'dark';

export const colorSchemes: Record<ColorSchemeName, ColorScheme> = {
  dark: darkColors,
  light: lightColors,
};

/**
 * Semantic colour for a status string.
 *
 * Ported from Worksong's `statusColor`, extended with the vocabulary the bot
 * API actually emits — run statuses (`queued`, `running`, `completed`,
 * `cancelled`), approval statuses (`pending`, `approved`, `denied`) and bot
 * statuses (`active`, `paused`, `archived`).
 *
 * Unknown input returns `blue`, deliberately: a status nobody has mapped is
 * informational, not an error, and colouring it red would invent a problem.
 */
export function statusColor(status: string, scheme: ColorScheme = darkColors): string {
  switch (status.toLowerCase()) {
    case 'running':
    case 'idle':
    case 'healthy':
    case 'approved':
    case 'active':
    case 'live':
    case 'ok':
    case 'success':
    case 'completed':
      return scheme.green;

    case 'pending':
    case 'degraded':
    case 'warning':
    case 'starting':
    case 'waiting':
    case 'queued':
    case 'paused':
      return scheme.yellow;

    case 'error':
    case 'stopped':
    case 'rejected':
    case 'expired':
    case 'failed':
    case 'dead':
    case 'offline':
    case 'denied':
    case 'cancelled':
      return scheme.red;

    default:
      return scheme.blue;
  }
}

/** Gain/loss colour for a signed number. */
export function changeColor(value: number, scheme: ColorScheme = darkColors): string {
  return value >= 0 ? scheme.green : scheme.red;
}

/* -------------------------------------------------------------------------- */
/* Contrast                                                                    */
/* -------------------------------------------------------------------------- */

/** Parse `#rgb`, `#rrggbb` or `rgba(r, g, b, a)` into 0-255 channels. */
function channels(color: string): [number, number, number] | null {
  const hex = color.trim();
  if (hex.startsWith('#')) {
    const body = hex.slice(1);
    const full =
      body.length === 3
        ? body
            .split('')
            .map((c) => c + c)
            .join('')
        : body;
    if (full.length !== 6) return null;
    const value = Number.parseInt(full, 16);
    if (Number.isNaN(value)) return null;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const match = /^rgba?\(([^)]+)\)$/.exec(hex);
  if (match === null) return null;
  const parts = match[1]!.split(',').map((p) => Number.parseFloat(p.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  return [parts[0]!, parts[1]!, parts[2]!];
}

/** WCAG relative luminance. */
function luminance(color: string): number | null {
  const rgb = channels(color);
  if (rgb === null) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two colours, 1–21.
 *
 * Returns null when either colour cannot be parsed. Alpha is ignored — an
 * alpha-composited value depends on what is behind it, so a caller wanting a
 * true ratio for `textSecondary` must composite it over the background first.
 */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}
