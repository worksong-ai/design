import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  darkColors,
  lightColors,
  statusColor,
  changeColor,
  type ColorScheme,
} from './colors.js';
import { elevation, pressedOpacity, radius, size, space } from './space.js';
import {
  clampFontScale,
  maxFontScale,
  scaledMinHeight,
  typography,
  type TypeTokenName,
} from './typography.js';
import { alignFor, containsRtl, directionStyle, textDirection } from './text.js';

describe('colour schemes', () => {
  it('define exactly the same keys, so a screen cannot depend on a dark-only token', () => {
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
  });

  it('keeps Worksong NDColor values verbatim in the dark scheme', () => {
    // Ported screens must line up exactly; these are the converted TQColor values.
    expect(darkColors.background).toBe('#000000');
    expect(darkColors.surface).toBe('#1A1A1A');
    expect(darkColors.surfaceElevated).toBe('#242424');
    expect(darkColors.separator).toBe('#2E2E2E');
    expect(darkColors.textSecondary).toBe('rgba(255, 255, 255, 0.62)');
    expect(darkColors.textTertiary).toBe('rgba(255, 255, 255, 0.42)');
    expect(darkColors.green).toBe('#00C752');
    expect(darkColors.red).toBe('#FF5252');
    expect(darkColors.accent).toBe('#00C752');
  });

  it('gives onAccent a value of its own that actually contrasts with the accent', () => {
    // Worksong uses its background colour as the implicit on-accent, which only
    // works because that colour happens to be black. Naming it separately is
    // the point; the guarantee worth testing is the contrast, not the value.
    for (const scheme of [darkColors, lightColors]) {
      const ratio = contrastRatio(scheme.onAccent, scheme.accent);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(3);
    }
    // And it inverts with the scheme, which an alias of a fixed colour could not.
    expect(darkColors.onAccent).not.toBe(lightColors.onAccent);
  });

  it('keeps primary text readable on the background in both schemes', () => {
    for (const scheme of [darkColors, lightColors]) {
      expect(contrastRatio(scheme.textPrimary, scheme.background)!).toBeGreaterThanOrEqual(7);
    }
  });

  it('keeps every status colour distinguishable from the background', () => {
    for (const scheme of [darkColors, lightColors]) {
      for (const key of ['green', 'red', 'yellow', 'blue'] as const) {
        expect(contrastRatio(scheme[key], scheme.background)!).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('does not reuse the dark white-alpha text tokens in light', () => {
    // These are the tokens that make a naive light retrofit produce invisible text.
    expect(lightColors.textSecondary).not.toContain('255, 255, 255');
    expect(lightColors.textTertiary).not.toContain('255, 255, 255');
  });

  it('promotes the chat bubble to a named token in both schemes', () => {
    for (const scheme of [darkColors, lightColors]) {
      expect(scheme.bubbleOut).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(scheme.bubbleIn).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('statusColor', () => {
  const cases: Array<[string, keyof ColorScheme]> = [
    ['running', 'green'],
    ['completed', 'green'],
    ['approved', 'green'],
    ['queued', 'yellow'],
    ['pending', 'yellow'],
    ['paused', 'yellow'],
    ['failed', 'red'],
    // A run's `cancelled` also covers a policy block or an expired approval,
    // so the shared table keeps it red; Tasks, where it only ever means the
    // person pressed Stop, override it (#214).
    ['cancelled', 'red'],
    ['denied', 'red'],
  ];

  it.each(cases)('maps %s to %s', (status, expected) => {
    expect(statusColor(status)).toBe(darkColors[expected]);
  });

  it('is case-insensitive', () => {
    expect(statusColor('RUNNING')).toBe(darkColors.green);
    expect(statusColor('Failed')).toBe(darkColors.red);
  });

  it('falls back to blue for an unmapped status rather than inventing a problem', () => {
    expect(statusColor('archived')).toBe(darkColors.blue);
    expect(statusColor('')).toBe(darkColors.blue);
  });

  it('honours the scheme it is given', () => {
    expect(statusColor('running', lightColors)).toBe(lightColors.green);
  });

  it('covers every run and approval status the API can emit', () => {
    // If the API gains a status, this fails rather than silently colouring it blue.
    const runStatuses = ['queued', 'running', 'completed', 'failed', 'cancelled'];
    const approvalStatuses = ['pending', 'approved', 'denied'];
    for (const status of [...runStatuses, ...approvalStatuses]) {
      expect(statusColor(status)).not.toBe(darkColors.blue);
    }
  });
});

describe('changeColor', () => {
  it('treats zero as non-negative', () => {
    expect(changeColor(0)).toBe(darkColors.green);
    expect(changeColor(0.01)).toBe(darkColors.green);
    expect(changeColor(-0.01)).toBe(darkColors.red);
  });
});

describe('scales', () => {
  it('keeps the three Worksong values at their exact numbers', () => {
    expect(space[4]).toBe(16); // screenPadding
    expect(radius.lg).toBe(14); // cardRadius
    expect(size.row).toBe(56); // rowHeight
  });

  it('is a 4pt grid', () => {
    for (const value of Object.values(space)) expect(value % 4).toBe(0);
  });

  it('increases monotonically', () => {
    const values = Object.values(space);
    for (let i = 1; i < values.length; i += 1) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });

  it('meets the 44pt minimum touch target', () => {
    expect(size.touchTarget).toBeGreaterThanOrEqual(44);
    expect(size.rowCompact).toBeGreaterThanOrEqual(44);
  });

  it('has one pressed opacity, not four', () => {
    expect(pressedOpacity).toBe(0.7);
  });

  it('emits both iOS and Android shadow props at every level', () => {
    for (const level of Object.values(elevation)) {
      expect(level).toHaveProperty('shadowOpacity');
      expect(level).toHaveProperty('elevation');
    }
    expect(elevation.none.elevation).toBe(0);
    expect(elevation.high.elevation).toBeGreaterThan(elevation.low.elevation);
  });
});

describe('typography', () => {
  it('gives every token a line height and letter spacing', () => {
    // NDFont omits both, so RN falls back to a platform default that differs
    // between iOS and Android and sets identical styles to different heights.
    for (const token of Object.values(typography)) {
      expect(token.lineHeight).toBeGreaterThan(token.fontSize);
      expect(typeof token.letterSpacing).toBe('number');
    }
  });

  it('keeps Worksong NDFont sizes and weights', () => {
    expect(typography.body).toMatchObject({ fontSize: 16, fontWeight: '400' });
    expect(typography.screenTitle).toMatchObject({ fontSize: 28, fontWeight: '700' });
    expect(typography.tiny).toMatchObject({ fontSize: 11, fontWeight: '600' });
    expect(typography.largeNumber).toMatchObject({ fontSize: 40, fontWeight: '700' });
  });

  it('leads large text more tightly than small text', () => {
    const ratio = (name: TypeTokenName) =>
      typography[name].lineHeight / typography[name].fontSize;
    expect(ratio('caption')).toBeGreaterThan(ratio('largeNumber'));
  });

  it('declares a font-scale cap for every token', () => {
    expect(Object.keys(maxFontScale).sort()).toEqual(Object.keys(typography).sort());
  });

  it('lets body text scale furthest, because that is what people need to read', () => {
    expect(maxFontScale.body).toBeGreaterThan(maxFontScale.largeNumber);
    expect(maxFontScale.body).toBeGreaterThanOrEqual(2);
  });
});

describe('clampFontScale', () => {
  it('never returns below 1, even if the user shrank their system text', () => {
    expect(clampFontScale('body', 0.8)).toBe(1);
    expect(clampFontScale('body', 0)).toBe(1);
  });

  it('caps at the token ceiling', () => {
    expect(clampFontScale('largeNumber', 3)).toBe(maxFontScale.largeNumber);
    expect(clampFontScale('body', 3)).toBe(2);
  });

  it('passes through a value inside the range', () => {
    expect(clampFontScale('body', 1.5)).toBe(1.5);
  });

  it('survives a non-finite scale rather than poisoning a layout with NaN', () => {
    expect(clampFontScale('body', Number.NaN)).toBe(1);
    expect(clampFontScale('body', Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('scaledMinHeight', () => {
  it('returns the design height at normal scale', () => {
    expect(scaledMinHeight(size.row, 'body', 1)).toBe(size.row);
  });

  it('grows the row so large accessibility text does not clip', () => {
    // This is the Worksong failure: 56pt rows with text that scales past them.
    expect(scaledMinHeight(size.row, 'body', 2)).toBeGreaterThan(size.row);
  });

  it('never shrinks below the design height', () => {
    expect(scaledMinHeight(size.row, 'body', 0.5)).toBe(size.row);
  });

  it('respects the token cap, so display text does not explode a layout', () => {
    const atCap = scaledMinHeight(120, 'largeNumber', maxFontScale.largeNumber);
    expect(scaledMinHeight(120, 'largeNumber', 5)).toBe(atCap);
  });
});

describe('textDirection', () => {
  it('detects Hebrew', () => {
    expect(textDirection('שלום עולם')).toBe('rtl');
  });

  it('detects Arabic', () => {
    expect(textDirection('مرحبا بالعالم')).toBe('rtl');
  });

  it('returns ltr for Latin text', () => {
    expect(textDirection('hello world')).toBe('ltr');
  });

  it('uses first-strong, so one Hebrew word does not flip an English paragraph', () => {
    // This is where it deliberately differs from @bot/shared's speech detector,
    // where ANY Hebrew letter wins — right for picking a TTS voice, wrong for
    // aligning a bubble.
    expect(textDirection('The bot replied שלום to me')).toBe('ltr');
    expect(textDirection('שלום, the bot said')).toBe('rtl');
  });

  it('skips leading punctuation, digits and whitespace', () => {
    expect(textDirection('  — שלום')).toBe('rtl');
    expect(textDirection('1. שלום')).toBe('rtl');
    expect(textDirection('"hello"')).toBe('ltr');
  });

  it('falls back to ltr for text with no strong character at all', () => {
    expect(textDirection('')).toBe('ltr');
    expect(textDirection('123 !!! ...')).toBe('ltr');
    expect(textDirection('   ')).toBe('ltr');
  });
});

describe('containsRtl', () => {
  it('is true for any Hebrew anywhere, unlike textDirection', () => {
    expect(containsRtl('The bot replied שלום to me')).toBe(true);
    expect(textDirection('The bot replied שלום to me')).toBe('ltr');
  });

  it('is false for pure Latin', () => {
    expect(containsRtl('hello')).toBe(false);
  });
});

describe('directionStyle', () => {
  it('sets both textAlign and writingDirection', () => {
    // Android honours textAlign, iOS honours writingDirection. Omitting either
    // lays out backwards on one platform.
    expect(directionStyle('rtl')).toEqual({ textAlign: 'right', writingDirection: 'rtl' });
    expect(directionStyle('ltr')).toEqual({ textAlign: 'left', writingDirection: 'ltr' });
  });

  it('agrees with alignFor', () => {
    expect(directionStyle('rtl').textAlign).toBe(alignFor('rtl'));
    expect(directionStyle('ltr').textAlign).toBe(alignFor('ltr'));
  });
});
