import { fireEvent, render, screen } from '@testing-library/react-native';

import { contrastRatio, darkColors, lightColors } from '../tokens/colors.js';
import { radius, size } from '../tokens/space.js';
import { Avatar, initialsFrom } from './Avatar.js';
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

describe('initialsFrom', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['Ada', 'A'],
    ['Ada Byron Lovelace', 'AB'],
    ['', '?'],
    ['   \t  ', '?'],
    ['@ada lovelace', 'AL'],
    ['(Ada) Lovelace', 'AL'],
    ['שלום עולם', 'שע'],
  ])('derives %j into %j', (name, expected) => {
    expect(initialsFrom(name)).toBe(expected);
  });

  it('never returns an empty string, because a blank badge reads as a bug', () => {
    // Bot names are free text at the API boundary: `avatarColorSchema` pins the
    // colour format but nothing pins the name to letters.
    for (const name of ['', ' ', '...', '—', '!!! ???']) {
      expect(initialsFrom(name).length).toBeGreaterThan(0);
    }
  });
});

describe('Avatar', () => {
  it('renders the initials of the name', () => {
    render(<Avatar name="Ada Lovelace" testID="a" />);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('announces as an image named for the bot, not as two letters', () => {
    render(<Avatar name="Ada Lovelace" testID="a" />);

    const badge = screen.getByTestId('a');
    expect(badge.props.accessibilityRole).toBe('image');
    expect(badge.props.accessibilityLabel).toBe('Ada Lovelace');
  });

  it('fills with the scheme accent when the bot has no colour', () => {
    render(<Avatar name="Ada Lovelace" testID="a" />);
    expect(styleOf(screen.getByTestId('a')).backgroundColor).toBe(darkColors.accent);
  });

  it('honours an alternate scheme for the default fill', () => {
    render(<Avatar name="Ada Lovelace" scheme={lightColors} testID="a" />);
    expect(styleOf(screen.getByTestId('a')).backgroundColor).toBe(lightColors.accent);
  });

  it('fills with the API colour when there is one', () => {
    // `bot.avatarColor` is an explicit per-bot hex, so this one literal is the
    // runtime value, not a design decision escaping the token set.
    render(<Avatar name="Ada Lovelace" color="#4C6EF5" testID="a" />);
    expect(styleOf(screen.getByTestId('a')).backgroundColor).toBe('#4C6EF5');
  });

  it.each([
    ['circle', radius.full],
    ['squircle', radius.md],
    ['hexagon', radius.sm],
    ['shield', radius.sm],
    ['diamond', radius.sm],
  ] as const)('maps shape %s to its radius', (shape, expected) => {
    render(<Avatar name="Ada Lovelace" shape={shape} testID="a" />);
    expect(styleOf(screen.getByTestId('a')).borderRadius).toBe(expected);
  });

  it.each([
    ['small', size.avatarSmall],
    ['medium', size.avatar],
    ['large', size.avatarLarge],
  ] as const)('draws size %s square at its token diameter', (avatarSize, expected) => {
    render(<Avatar name="Ada Lovelace" size={avatarSize} testID="a" />);
    const style = styleOf(screen.getByTestId('a'));
    expect(style.width).toBe(expected);
    expect(style.height).toBe(expected);
  });

  it.each(['#FFFFF0', '#101010', '#FFFF00', '#4C6EF5', '#7F7F7F'])(
    'labels %s with whichever candidate contrasts better',
    (fill) => {
      // A fixed label colour is unreadable across half the range a bot owner can
      // type, and the API validates only the hex format.
      render(<Avatar name="Ada Lovelace" color={fill} testID="a" />);
      const chosen = styleOf(screen.getByText('AL')).color as string;

      const rejected =
        chosen === darkColors.textPrimary ? darkColors.onAccent : darkColors.textPrimary;
      expect([darkColors.onAccent, darkColors.textPrimary]).toContain(chosen);
      expect(contrastRatio(fill, chosen) ?? 0).toBeGreaterThanOrEqual(
        contrastRatio(fill, rejected) ?? 0,
      );
    },
  );

  it('flips the label between a light and a dark fill', () => {
    render(<Avatar name="Ada Lovelace" color="#FAFAFA" testID="light" />);
    expect(styleOf(screen.getByText('AL')).color).toBe(darkColors.onAccent);

    render(<Avatar name="Bea Nix" color="#101010" testID="dark" />);
    expect(styleOf(screen.getByText('BN')).color).toBe(darkColors.textPrimary);
  });

  it('keeps a label colour from the scheme it was given', () => {
    render(<Avatar name="Ada Lovelace" color="#101010" scheme={lightColors} testID="a" />);
    expect([lightColors.onAccent, lightColors.textPrimary]).toContain(
      styleOf(screen.getByText('AL')).color,
    );
  });

  it('pins the glyph against Dynamic Type, because the badge cannot grow', () => {
    // The badge is a fixed diameter, and the initials duplicate the label the
    // screen reader already gets — so this is the one place capping beats
    // scaling.
    render(<Avatar name="Ada Lovelace" testID="a" />);
    expect(screen.getByText('AL').props.maxFontSizeMultiplier).toBe(1);
  });

  it('renders a placeholder rather than an empty badge for a nameless bot', () => {
    render(<Avatar name="   " testID="a" />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  describe('uploaded image (#192)', () => {
    it('draws the picture in place of the initials, clipped to the shape', () => {
      render(<Avatar name="Ada Lovelace" imageUri="file:///cache/logo.img" shape="squircle" testID="a" />);
      const image = screen.getByTestId('a-image');
      expect(image.props.source).toEqual({ uri: 'file:///cache/logo.img' });
      expect(screen.queryByText('AL')).toBeNull();
      expect(styleOf(screen.getByTestId('a')).borderRadius).toBe(radius.md);
      // Still one element named for the bot.
      expect(screen.getByTestId('a').props.accessibilityLabel).toBe('Ada Lovelace');
    });

    it('falls back to the generated badge when the picture fails to load', () => {
      render(<Avatar name="Ada Lovelace" imageUri="file:///cache/broken.img" testID="a" />);
      fireEvent(screen.getByTestId('a-image'), 'error');
      expect(screen.queryByTestId('a-image')).toBeNull();
      expect(screen.getByText('AL')).toBeTruthy();
    });

    it('uses the generated badge when there is no picture', () => {
      render(<Avatar name="Ada Lovelace" imageUri={null} testID="a" />);
      expect(screen.queryByTestId('a-image')).toBeNull();
      expect(screen.getByText('AL')).toBeTruthy();
    });
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <Avatar name="Ada Lovelace" testID="a" />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('a')).backgroundColor).toBe(lightColors.accent);
  });
});
