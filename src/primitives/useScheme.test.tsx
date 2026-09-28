import { render, screen } from '@testing-library/react-native';
import { Text as RNText, useColorScheme } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { SchemeProvider, schemeFor, useScheme } from './useScheme.js';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

const mockOs = useColorScheme as unknown as jest.Mock;

function Probe() {
  const scheme = useScheme();
  return <RNText testID="probe">{scheme.background}</RNText>;
}

describe('schemeFor', () => {
  it('follows the OS under `system`', () => {
    expect(schemeFor('system', 'light')).toBe(lightColors);
    expect(schemeFor('system', 'dark')).toBe(darkColors);
  });

  it('answers dark when the platform has no opinion', () => {
    // `useColorScheme()` is null on platforms that do not report one. Dark is
    // the honest answer there, because it is what this product is.
    expect(schemeFor('system', null)).toBe(darkColors);
    expect(schemeFor('system', undefined)).toBe(darkColors);
  });

  it('ignores the OS when pinned', () => {
    expect(schemeFor('light', 'dark')).toBe(lightColors);
    expect(schemeFor('dark', 'light')).toBe(darkColors);
  });
});

describe('useScheme', () => {
  it('is dark with no provider, which is what the app did before', () => {
    // Every existing primitive defaulted to `darkColors`. A context default of
    // anything else would repaint 45 files the moment this landed.
    render(<Probe />);
    expect(screen.getByTestId('probe').props.children).toBe(darkColors.background);
  });

  it('follows the OS under a system provider', () => {
    mockOs.mockReturnValue('light');
    render(
      <SchemeProvider>
        <Probe />
      </SchemeProvider>,
    );
    expect(screen.getByTestId('probe').props.children).toBe(lightColors.background);
  });

  it('is pinned by an explicit preference', () => {
    mockOs.mockReturnValue('light');
    render(
      <SchemeProvider preference="dark">
        <Probe />
      </SchemeProvider>,
    );
    expect(screen.getByTestId('probe').props.children).toBe(darkColors.background);
  });
});
