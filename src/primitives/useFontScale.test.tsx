import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { size } from '../tokens/space.js';
import { ListRow } from './ListRow.js';
import { useFontScale, useResolvedFontScale } from './useFontScale.js';

function Probe({ override }: { override?: number }) {
  const resolved = useResolvedFontScale(override);
  const os = useFontScale();
  return <RNText testID="probe">{`${resolved}|${os}`}</RNText>;
}

function readProbe(): { resolved: number; os: number } {
  const [resolved, os] = String(screen.getByTestId('probe').props.children).split('|');
  return { resolved: Number(resolved), os: Number(os) };
}

function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('useFontScale', () => {
  it('reads the scale from the window rather than assuming 1', () => {
    // jest-expo's mocked window reports fontScale = 2. That the probe sees 2 is
    // the whole point: before this hook existed every primitive defaulted to 1,
    // so the grown heights were reachable only from a test that passed a scale
    // by hand, and the accessibility guarantee was dead in the running app.
    render(<Probe />);
    expect(readProbe().os).toBe(2);
  });

  it('lets an explicit override win, which is what lets a test pin a scale', () => {
    render(<Probe override={1} />);
    expect(readProbe().resolved).toBe(1);
  });

  it('falls back to the OS value when no override is given', () => {
    render(<Probe />);
    const { resolved, os } = readProbe();
    expect(resolved).toBe(os);
  });

  it('treats an override of 0 as an override, not as absent', () => {
    // `??` rather than `||` — a caller asking for 0 gets a clamped value from
    // scaledMinHeight, not a silent fall-through to the device scale.
    render(<Probe override={0} />);
    expect(readProbe().resolved).toBe(0);
  });
});

describe('primitives read the device scale by default', () => {
  it('ListRow grows without being told, because the hook supplies the scale', () => {
    // The regression this guards: someone reintroduces `fontScale = 1` as a
    // parameter default, the prop stops reaching the device, and rows silently
    // clip again at large Dynamic Type.
    render(<ListRow title="A" testID="auto" />);
    render(<ListRow title="A" testID="pinned" fontScale={1} />);

    expect(styleOf(screen.getByTestId('pinned')).minHeight).toBe(size.row);
  });

  it('measures taller at the mocked device scale than at scale 1', () => {
    render(<ListRow title="A" testID="auto" />);
    const auto = styleOf(screen.getByTestId('auto')).minHeight as number;

    render(<ListRow title="A" testID="pinned" fontScale={1} />);
    const pinned = styleOf(screen.getByTestId('pinned')).minHeight as number;

    expect(auto).toBeGreaterThan(pinned);
  });
});
