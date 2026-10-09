import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { radius, size } from '../tokens/space.js';
import { SHEET_MAX_HEIGHT_RATIO, SHEET_MAX_WIDTH, Sheet } from './Sheet.js';
import { Text } from './Text.js';
import { SchemeProvider } from './useScheme.js';

/** Flatten RN's array-of-styles into one object. */
function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('Sheet', () => {
  it('lets the device stay in landscape while it is open', () => {
    render(
      <Sheet visible onClose={jest.fn()}>
        <Text>body</Text>
      </Sheet>,
    );

    // RN's iOS Modal defaults to portrait only, which rotated a phone held
    // sideways back to portrait whenever a sheet opened.
    expect(screen.getByTestId('sheet-modal').props.supportedOrientations).toEqual(
      expect.arrayContaining(['portrait', 'landscape', 'landscape-left', 'landscape-right']),
    );
  });

  it('renders its children when visible', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    expect(screen.getByText('body')).toBeTruthy();
    expect(screen.getByTestId('s')).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    render(
      <Sheet visible={false} onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    expect(screen.queryByTestId('s')).toBeNull();
    expect(screen.queryByText('body')).toBeNull();
  });

  it('closes when the backdrop is pressed', () => {
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    fireEvent.press(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores the backdrop when dismissOnBackdropPress is false', () => {
    // A sheet that must be answered — an approval, a destructive confirm —
    // cannot be dismissed by a stray tap next to it.
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose} dismissOnBackdropPress={false} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    fireEvent.press(screen.getByTestId('sheet-backdrop'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when the sheet itself is pressed', () => {
    // The backdrop is a sibling of the panel rather than its parent, so a press
    // on the content has no path to the dismiss handler at all.
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose} title="Approve" testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    fireEvent.press(screen.getByTestId('sheet-panel'));
    fireEvent.press(screen.getByText('body'));
    fireEvent.press(screen.getByText('Approve'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders a title when given one, and no header when not', () => {
    render(
      <Sheet visible onClose={jest.fn()} title="Approve spend" testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    expect(screen.getByText('Approve spend')).toBeTruthy();

    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    expect(screen.queryByTestId('sheet-header')).toBeNull();
  });

  it('closes on the Android hardware back button', () => {
    // `onRequestClose` is the only route that button has into a Modal; without
    // it the sheet swallows Back and the user is stuck.
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    fireEvent(screen.getByTestId('sheet-modal'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('slides up over a transparent modal', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    const modal = screen.getByTestId('sheet-modal');
    expect(modal.props.animationType).toBe('slide');
    expect(modal.props.transparent).toBe(true);
  });

  it('paints the scrim and surface from the scheme, never a literal', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    expect(styleOf(screen.getByTestId('s')).backgroundColor).toBe(darkColors.scrim);
    expect(styleOf(screen.getByTestId('sheet-panel')).backgroundColor).toBe(darkColors.surface);

    render(
      <Sheet visible onClose={jest.fn()} scheme={lightColors} testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    expect(styleOf(screen.getByTestId('s')).backgroundColor).toBe(lightColors.scrim);
    expect(styleOf(screen.getByTestId('sheet-panel')).backgroundColor).toBe(lightColors.surface);
  });

  it('rounds the top corners only', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    const panel = styleOf(screen.getByTestId('sheet-panel'));
    expect(panel.borderTopLeftRadius).toBe(radius.xl);
    expect(panel.borderTopRightRadius).toBe(radius.xl);
    expect(panel.borderBottomLeftRadius).toBeUndefined();
  });

  it('traps assistive focus on the sheet', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    expect(screen.getByTestId('s').props.accessibilityViewIsModal).toBe(true);
  });

  it('exposes the backdrop as a button and reports when it is inert', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    const live = screen.getByTestId('sheet-backdrop');
    expect(live.props.accessibilityRole).toBe('button');
    expect(live.props.accessibilityState).toMatchObject({ disabled: false });

    render(
      <Sheet visible onClose={jest.fn()} dismissOnBackdropPress={false} testID="s">
        <Text>body</Text>
      </Sheet>,
    );
    expect(screen.getByTestId('sheet-backdrop').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('keeps a tappable strip of backdrop however tall the content is', () => {
    render(
      <Sheet visible onClose={jest.fn()} testID="s">
        <Text>body</Text>
      </Sheet>,
    );

    const { minHeight } = styleOf(screen.getByTestId('sheet-backdrop'));
    expect(minHeight as number).toBeGreaterThanOrEqual(size.touchTarget);
  });

  it('grows the header with the OS font scale', () => {
    // Same guarantee as Button's: a fixed-height header clips the title at the
    // larger Dynamic Type sizes, which is how Worksong's 56pt rows fail today.
    render(
      <Sheet visible onClose={jest.fn()} title="Approve" testID="s" fontScale={1}>
        <Text>body</Text>
      </Sheet>,
    );
    const normal = styleOf(screen.getByTestId('sheet-header')).minHeight as number;

    render(
      <Sheet visible onClose={jest.fn()} title="Approve" testID="s" fontScale={2}>
        <Text>body</Text>
      </Sheet>,
    );
    const large = styleOf(screen.getByTestId('sheet-header')).minHeight as number;

    expect(normal).toBeGreaterThanOrEqual(size.touchTarget);
    expect(large).toBeGreaterThan(normal);
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <Sheet visible onClose={jest.fn()} testID="s">
          <Text>body</Text>
        </Sheet>
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('s')).backgroundColor).toBe(lightColors.scrim);
    expect(styleOf(screen.getByTestId('sheet-panel')).backgroundColor).toBe(lightColors.surface);
  });

  describe('taller than the window', () => {
    it('caps the panel and scrolls the body under a fixed header', () => {
      // A phone held sideways is ~390 pt tall; ten two-line rows are not.
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 852, height: 393, scale: 3, fontScale: 1 });
      render(
        <Sheet visible onClose={jest.fn()} title="This chat" testID="s">
          <Text>row</Text>
        </Sheet>,
      );

      const panel = styleOf(screen.getByTestId('sheet-panel'));
      expect(panel.maxHeight).toBe(Math.floor(393 * SHEET_MAX_HEIGHT_RATIO));

      // The title is a sibling of the scrolling body, so it cannot scroll off.
      const body = screen.getByTestId('sheet-body');
      expect(screen.getByTestId('sheet-header')).toBeTruthy();
      expect(body.props.keyboardShouldPersistTaps).toBe('handled');
      expect(styleOf(body).flexShrink).toBe(1);
      expect(styleOf(body).flexGrow).toBe(0);
      jest.restoreAllMocks();
    });

    it('stays a card on a wide window instead of a full-width strip', () => {
      render(
        <Sheet visible onClose={jest.fn()} testID="s">
          <Text>row</Text>
        </Sheet>,
      );
      const panel = styleOf(screen.getByTestId('sheet-panel'));
      expect(panel.maxWidth).toBe(SHEET_MAX_WIDTH);
      expect(panel.alignSelf).toBe('center');
    });
  });
});
