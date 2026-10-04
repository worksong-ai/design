import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText, useWindowDimensions } from 'react-native';

import { darkColors } from '../tokens/colors.js';
import { RAIL_WIDTH, listPaneWidth } from '../tokens/layout.js';
import { ShellFrame, type ShellFrameProps } from './ShellFrame.js';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 1100, height: 800, scale: 1, fontScale: 1 })),
}));
const mockDims = useWindowDimensions as unknown as jest.Mock;

const flat = (id: string) =>
  StyleSheet.flatten(screen.getByTestId(id, { includeHiddenElements: true }).props.style) as Record<string, unknown>;
const hidden = (id: string) => flat(id).display === 'none';

function setup(props: Partial<ShellFrameProps> = {}) {
  return render(
    <ShellFrame
      layout="desktop"
      rail={<RNText testID="rail">rail</RNText>}
      list={<RNText testID="list">list</RNText>}
      main={<RNText testID="main">main</RNText>}
      {...props}
    />,
  );
}

describe('ShellFrame', () => {
  beforeEach(() => mockDims.mockReturnValue({ width: 1100, height: 800, scale: 1, fontScale: 1 }));

  it('desktop: rail, list and main side by side, with a separator after the list', () => {
    setup();
    expect(flat('shell-frame').flexDirection).toBe('row');
    expect(hidden('shell-list-pane')).toBe(false);
    expect(hidden('shell-main-pane')).toBe(false);
    expect(flat('shell-list-pane')).toMatchObject({
      width: listPaneWidth(1100),
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: darkColors.separator,
    });
    expect(flat('shell-main-pane').flex).toBe(1);
  });

  it('desktop: a wide window gets the wider list pane, and listWidth overrides it', () => {
    mockDims.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    const { unmount } = setup();
    expect(flat('shell-list-pane').width).toBe(380);
    unmount();
    setup({ listWidth: 300 });
    expect(flat('shell-list-pane').width).toBe(300);
  });

  it('tablet: one pane beside the rail, the list by default', () => {
    const { rerender } = setup({ layout: 'tablet' });
    expect(hidden('shell-list-pane')).toBe(false);
    expect(hidden('shell-main-pane')).toBe(true);
    expect(flat('shell-list-pane').flex).toBe(1);
    expect(flat('shell-list-pane').width).toBeUndefined();
    rerender(
      <ShellFrame
        layout="tablet"
        tabletPane="main"
        rail={<RNText>rail</RNText>}
        list={<RNText testID="list">list</RNText>}
        main={<RNText testID="main">main</RNText>}
      />,
    );
    expect(hidden('shell-list-pane')).toBe(true);
    expect(hidden('shell-main-pane')).toBe(false);
  });

  it('tablet: the hidden pane stays mounted, so it keeps its state', () => {
    setup({ layout: 'tablet', tabletPane: 'main' });
    expect(screen.getByTestId('list', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('main')).toBeTruthy();
  });

  it('mobile: only the main slot; the product owns phone navigation inside it', () => {
    setup({ layout: 'mobile' });
    expect(screen.getByTestId('main')).toBeTruthy();
    expect(screen.queryByTestId('rail')).toBeNull();
    expect(screen.queryByTestId('list', { includeHiddenElements: true })).toBeNull();
  });

  it('draws the rail slot as given, and RAIL_WIDTH is what a rail uses', () => {
    setup();
    expect(screen.getByTestId('rail')).toBeTruthy();
    expect(RAIL_WIDTH).toBe(92);
  });

  it('paints the scheme background behind the panes', () => {
    setup();
    expect(flat('shell-frame').backgroundColor).toBe(darkColors.background);
  });
});
