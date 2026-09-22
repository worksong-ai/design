import { render, screen } from '@testing-library/react-native';

import { darkColors, lightColors, statusColor } from '../tokens/colors.js';
import { radius } from '../tokens/space.js';
import { Badge, type BadgeTone } from './Badge.js';
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

const TONES: Array<[BadgeTone, string]> = [
  ['neutral', darkColors.textSecondary],
  ['success', darkColors.green],
  ['warning', darkColors.yellow],
  ['danger', darkColors.red],
  ['info', darkColors.blue],
];

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge label="Running" />);
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it.each(TONES)('paints tone %s from the scheme, border and label alike', (tone, expected) => {
    render(<Badge label="Status" tone={tone} testID="b" />);

    expect(styleOf(screen.getByTestId('b')).borderColor).toBe(expected);
    expect(styleOf(screen.getByText('Status')).color).toBe(expected);
  });

  it('defaults to neutral', () => {
    render(<Badge label="Draft" testID="b" />);
    expect(styleOf(screen.getByTestId('b')).borderColor).toBe(darkColors.textSecondary);
  });

  it('fills from the surface token rather than an alpha of the tone', () => {
    // An alpha fill would have to be written as a literal, which is the one
    // thing this package does not allow.
    render(<Badge label="Failed" tone="danger" testID="b" />);
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(darkColors.surface);
  });

  it('honours an alternate scheme', () => {
    render(<Badge label="Live" tone="success" scheme={lightColors} testID="b" />);

    expect(styleOf(screen.getByTestId('b')).borderColor).toBe(lightColors.green);
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(lightColors.surface);
  });

  it('lets status win over tone, so a badge and a status dot cannot disagree', () => {
    render(<Badge label="Failed" tone="success" status="failed" testID="b" />);

    const { borderColor } = styleOf(screen.getByTestId('b'));
    expect(borderColor).toBe(statusColor('failed'));
    expect(borderColor).toBe(darkColors.red);
  });

  it.each([
    ['running', darkColors.green],
    ['queued', darkColors.yellow],
    ['cancelled', darkColors.red],
  ])('resolves %s through the same table as statusColor', (status, expected) => {
    render(<Badge label={status} status={status} testID="b" />);
    expect(styleOf(screen.getByTestId('b')).borderColor).toBe(expected);
  });

  it('falls back to the info colour for a status nobody has mapped', () => {
    // Deliberate: an unclassified status is informational, and colouring it red
    // would invent a failure the API never reported.
    render(<Badge label="Frobnicating" status="frobnicating" testID="b" />);
    expect(styleOf(screen.getByTestId('b')).borderColor).toBe(darkColors.blue);
  });

  it('says what the tone means, not just the word', () => {
    render(<Badge label="Queued" status="queued" testID="b" />);

    const badge = screen.getByTestId('b');
    expect(badge.props.accessibilityRole).toBe('text');
    expect(badge.props.accessibilityLabel).toBe('Queued, warning');
  });

  it('describes a tone-only badge too', () => {
    render(<Badge label="Stopped" tone="danger" testID="b" />);
    expect(screen.getByTestId('b').props.accessibilityLabel).toBe('Stopped, error');
  });

  it('is a pill', () => {
    render(<Badge label="Live" testID="b" />);
    expect(styleOf(screen.getByTestId('b')).borderRadius).toBe(radius.full);
  });

  it('grows its minimum height with the OS font scale', () => {
    render(<Badge label="Live" testID="normal" fontScale={1} />);
    const normal = styleOf(screen.getByTestId('normal')).minHeight as number;

    render(<Badge label="Live" testID="large" fontScale={2} />);
    const large = styleOf(screen.getByTestId('large')).minHeight as number;

    expect(large).toBeGreaterThan(normal);
  });

  it('detects direction from the label, because statuses arrive translated', () => {
    render(<Badge label="ממתין" tone="warning" />);
    expect(styleOf(screen.getByText('ממתין')).textAlign).toBe('right');
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <Badge label="Live" testID="b" />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(lightColors.surface);
  });
});
