/**
 * Screen layout and shell tokens: the grid every list-style root screen sits on
 * and the breakpoints of the rail / list / main frame.
 *
 * Extracted from `worksong-ai/worksong` (`ui/screenLayout.ts`,
 * `shell/desktop/layoutMode.ts`) so two Worksong apps that use the same
 * root-list pattern line up pixel for pixel without re-deriving the geometry.
 * `ScreenHeader`, `FilterChips`, `NavRail` and `ShellFrame` read these; so can
 * a product's own custom rows, headers and detail frames.
 *
 * Pure TypeScript (tokens only, no React Native import), like the rest of
 * `tokens/`, so it is asserted on in the Vitest lane.
 */
import { radius, screenPadding, size, space } from './space.js';

/** Left/right margin of every primary element: header, chips, list. */
export const SCREEN_GUTTER = screenPadding;

export const HEADER_LAYOUT = {
  paddingHorizontal: SCREEN_GUTTER,
  paddingVertical: space[3],
  /** Between the title cluster and the action buttons. */
  gap: space[2],
  /** Between neighbouring action buttons. */
  actionsGap: space[2],
  /** Between the title and an inline badge beside it. */
  titleGap: space[3],
  /**
   * The header row is never shorter than one action button, so a screen with
   * fewer buttons, or a badge taller than the title, cannot move the title.
   */
  minHeight: size.touchTarget,
} as const;

/** Always drawn; see `CHIP_LAYOUT.borderWidth`. */
const CHIP_BORDER = 1;

export const CHIP_LAYOUT = {
  /** Header-to-chips: the header's own bottom padding; nothing is added here. */
  rowPaddingHorizontal: SCREEN_GUTTER,
  rowPaddingBottom: space[2],
  gap: space[2],
  /**
   * `space[3]` minus the border, so a chip's outer width is `2 * space[3] +
   * text` whether or not it is selected: the border is always drawn
   * (transparent when unselected) and the padding gives up the same width.
   */
  paddingHorizontal: space[3] - CHIP_BORDER,
  paddingVertical: space[2],
  radius: radius.full,
  /**
   * Always drawn. An unselected chip has a transparent border, so selecting
   * one changes colour and never geometry.
   */
  borderWidth: CHIP_BORDER,
} as const;

/** A list starts this far under the chips; a sectioned list's first section does too. */
export const LIST_TOP = space[2];

/** The scroll content's own horizontal padding (the shared gutter). */
export const CONTENT_LAYOUT = {
  paddingHorizontal: SCREEN_GUTTER,
  gap: space[3],
} as const;

/**
 * A row's inner grid. This is `ListRow`'s own, restated as constants so a
 * custom row can sit on the identical grid: content is inset by one more gutter
 * inside the list's gutter, and the hairline separator spans the list's width.
 */
export const ROW_LAYOUT = {
  minHeight: size.row,
  paddingHorizontal: SCREEN_GUTTER,
  paddingVertical: space[2],
  columnGap: space[3],
} as const;

/** Section headings align with row content, not the bare gutter. */
export const SECTION_LAYOUT = {
  paddingHorizontal: ROW_LAYOUT.paddingHorizontal,
  marginTop: space[3],
  marginBottom: space[1],
} as const;

/**
 * Which frame a window gets. The package owns the breakpoints, not the
 * navigation: what `mobile` means (bottom tabs, a stack) is the product's.
 *
 *   - `mobile`  (< 640): phone-native navigation, owned by the product.
 *   - `tablet`  (640-959): the rail, then ONE pane -- the list at a section's
 *     root, the selected item once there is one.
 *   - `desktop` (>= 960): rail, list and main side by side.
 */
export type ShellLayout = 'mobile' | 'tablet' | 'desktop';

/** First width that gets the rail. Below it the phone shell is the product. */
export const TABLET_MIN_WIDTH = 640;
/** First width that has room for list and main side by side. */
export const DESKTOP_MIN_WIDTH = 960;

export function shellLayoutFor(width: number): ShellLayout {
  if (!Number.isFinite(width)) return 'mobile';
  if (width >= DESKTOP_MIN_WIDTH) return 'desktop';
  if (width >= TABLET_MIN_WIDTH) return 'tablet';
  return 'mobile';
}

/** The rail's width. Icon over a short label, as in a phone tab bar. */
export const RAIL_WIDTH = 92;

/**
 * The list pane's width. It grows a little on wide windows -- a row's preview
 * is the one thing that wants room -- and never takes more than about a third
 * of the window, so the main pane keeps the rest.
 */
export function listPaneWidth(width: number): number {
  return width >= 1280 ? 380 : 340;
}

/** The main pane never gets narrower than this at `desktop`. */
export const MAIN_PANE_MIN_WIDTH = DESKTOP_MIN_WIDTH - RAIL_WIDTH - 340;

/** The rail's item geometry. None of it depends on the active or badge state. */
export const RAIL_LAYOUT = {
  itemHeight: 60,
  activeBarWidth: 3,
  badgeSize: 18,
} as const;

/**
 * The bottom tab bar's geometry (the phone shell's counterpart to the rail).
 * None of it depends on which tab is selected or on a badge: only colour and
 * glyph do, so selecting a tab or a count growing to "99+" never moves a
 * neighbour.
 */
export const TAB_BAR_LAYOUT = {
  /** The iOS tab bar's content height, before the home-indicator inset. */
  barHeight: 49,
  /** The icon's box; the glyph is drawn at the same size. */
  iconBox: size.iconLarge,
  iconToLabelGap: 2,
  /** One weight for every label, selected or not: a bolder face is wider and re-fits. */
  labelWeight: '600',
  /** Fixed, so the label box is identical whatever it says or however it fits. */
  labelLineHeight: 14,
  /** How far a label may follow Dynamic Type before it shrinks instead. */
  labelMaxFontScale: 1.3,
  badgeSize: 18,
} as const;
