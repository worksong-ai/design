import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { SchemeProvider } from '../primitives/useScheme.js';
import { darkColors, lightColors } from '../tokens/colors.js';
import { CHIP_LAYOUT } from '../tokens/layout.js';
import { space } from '../tokens/space.js';
import { FilterChips } from './FilterChips.js';

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, unknown>;

function chips(selected: 'a' | 'b', bLabel = 'Beta 3') {
  return [
    { id: 'a' as const, label: 'Alpha', selected: selected === 'a', testID: 'chip-a' },
    { id: 'b' as const, label: bLabel, selected: selected === 'b', accessibilityLabel: 'Beta, 3 things', testID: 'chip-b' },
  ];
}

describe('FilterChips', () => {
  it('reports the tapped chip and announces selection and labels', () => {
    const onSelect = jest.fn();
    render(<FilterChips chips={chips('a')} onSelect={onSelect} testID="chips" />);
    fireEvent.press(screen.getByTestId('chip-b'));
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(screen.getByTestId('chip-a').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('chip-b').props.accessibilityState).toEqual({ selected: false });
    expect(screen.getByTestId('chip-b').props.accessibilityLabel).toBe('Beta, 3 things');
    expect(screen.getByTestId('chip-a').props.accessibilityLabel).toBe('Alpha');
  });

  it('draws the shared chip metrics', () => {
    render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    const style = flat('chip-a');
    expect(style.paddingHorizontal).toBe(CHIP_LAYOUT.paddingHorizontal);
    expect(style.paddingVertical).toBe(CHIP_LAYOUT.paddingVertical);
    expect(style.borderRadius).toBe(CHIP_LAYOUT.radius);
  });

  it('gives every chip the outer width 2 * space[3] + text, border included', () => {
    render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    for (const id of ['chip-a', 'chip-b']) {
      const style = flat(id);
      expect((style.paddingHorizontal as number) + (style.borderWidth as number)).toBe(space[3]);
    }
  });

  it('keeps the geometry when the selection changes: only colour moves', () => {
    const { rerender } = render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    const geometry = (id: string) => {
      const { backgroundColor: _b, borderColor: _c, ...rest } = flat(id);
      return rest;
    };
    const before = { a: geometry('chip-a'), b: geometry('chip-b') };
    const colourBefore = flat('chip-b').borderColor;
    rerender(<FilterChips chips={chips('b')} onSelect={jest.fn()} testID="chips" />);
    expect(geometry('chip-a')).toEqual(before.a);
    expect(geometry('chip-b')).toEqual(before.b);
    expect(flat('chip-b').borderColor).not.toBe(colourBefore);
  });

  it('extends the hit target past the compact chip to the 44pt floor', () => {
    render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    const slop = screen.getByTestId('chip-a').props.hitSlop as { top: number; bottom: number };
    expect(slop).toEqual({ top: CHIP_LAYOUT.paddingVertical, bottom: CHIP_LAYOUT.paddingVertical });
    // 11pt type at its 1.4 line-height cap, plus padding, border and slop on both sides.
    const height = 11 * 1.4 + 2 * (CHIP_LAYOUT.paddingVertical + CHIP_LAYOUT.borderWidth) + slop.top + slop.bottom;
    expect(height).toBeGreaterThanOrEqual(44 - 4);
  });

  it('scrolls horizontally, never shrinks, and is a radio group on request', () => {
    const { rerender } = render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    expect(screen.getByTestId('chips').props.horizontal).toBe(true);
    expect(flat('chips').flexShrink).toBe(0);
    expect(screen.getByTestId('chips').props.accessibilityRole).toBeUndefined();
    rerender(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" radioGroup />);
    expect(screen.getByTestId('chips').props.accessibilityRole).toBe('radiogroup');
  });

  it('keeps a long label on one line inside its own chip', () => {
    render(<FilterChips chips={chips('a', 'A rather long filter label 128')} onSelect={jest.fn()} testID="chips" />);
    expect(screen.getByText('A rather long filter label 128')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('uses the %s scheme for selected and unselected chips', (preference, scheme) => {
    render(
      <SchemeProvider preference={preference}>
        <FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />
      </SchemeProvider>,
    );
    expect(flat('chip-a')).toMatchObject({ backgroundColor: scheme.surfaceElevated, borderColor: scheme.focus });
    expect(flat('chip-b')).toMatchObject({ backgroundColor: scheme.surface, borderColor: 'transparent' });
    expect(StyleSheet.flatten(screen.getByText('Alpha').props.style).color).toBe(scheme.textPrimary);
    expect(StyleSheet.flatten(screen.getByText('Beta 3').props.style).color).toBe(scheme.textSecondary);
  });

  it('caps label growth under a large OS font scale', () => {
    render(<FilterChips chips={chips('a')} onSelect={jest.fn()} testID="chips" />);
    expect(screen.getByText('Alpha').props.maxFontSizeMultiplier).toBeLessThanOrEqual(2);
  });
});
