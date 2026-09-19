import { render, screen } from '@testing-library/react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { maxFontScale, typography } from '../tokens/typography.js';
import { Text } from './Text.js';

function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('Text', () => {
  it('renders its children', () => {
    render(<Text>hello</Text>);
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('applies the type token, line height included', () => {
    render(<Text variant="headline">hi</Text>);
    expect(styleOf(screen.getByText('hi'))).toMatchObject({
      fontSize: typography.headline.fontSize,
      fontWeight: typography.headline.fontWeight,
      lineHeight: typography.headline.lineHeight,
    });
  });

  it('defaults to body', () => {
    render(<Text>hi</Text>);
    expect(styleOf(screen.getByText('hi')).fontSize).toBe(typography.body.fontSize);
  });

  it('caps the font scale per token rather than disabling scaling', () => {
    // Disabling scaling fails the users who need it; leaving it unbounded clips
    // the layout. The cap is the compromise, and it differs per token.
    render(<Text variant="largeNumber">42</Text>);
    expect(screen.getByText('42').props.maxFontSizeMultiplier).toBe(maxFontScale.largeNumber);

    render(<Text variant="body">prose</Text>);
    expect(screen.getByText('prose').props.maxFontSizeMultiplier).toBe(maxFontScale.body);
  });

  it('resolves a colour token name', () => {
    render(<Text color="textSecondary">hi</Text>);
    expect(styleOf(screen.getByText('hi')).color).toBe(darkColors.textSecondary);
  });

  it('passes a literal colour through untouched', () => {
    render(<Text color="#ABCDEF">hi</Text>);
    expect(styleOf(screen.getByText('hi')).color).toBe('#ABCDEF');
  });

  it('defaults to primary text in the given scheme', () => {
    render(<Text scheme={lightColors}>hi</Text>);
    expect(styleOf(screen.getByText('hi')).color).toBe(lightColors.textPrimary);
  });

  it('aligns Hebrew right without being told', () => {
    // The transcript cannot annotate direction per message, so it has to be
    // detected from the content.
    render(<Text>שלום עולם</Text>);
    expect(styleOf(screen.getByText('שלום עולם'))).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
  });

  it('leaves an English message with a Hebrew word alone', () => {
    const content = 'The bot replied שלום to me';
    render(<Text>{content}</Text>);
    expect(styleOf(screen.getByText(content)).textAlign).toBe('left');
  });

  it('sets both alignment properties, because the platforms read different ones', () => {
    render(<Text>hello</Text>);
    const style = styleOf(screen.getByText('hello'));
    expect(style.textAlign).toBe('left');
    expect(style.writingDirection).toBe('ltr');
  });

  it('lets a caller pin direction for a fixed label', () => {
    render(<Text direction="rtl">Send</Text>);
    expect(styleOf(screen.getByText('Send')).textAlign).toBe('right');
  });

  it('detects direction through nested children', () => {
    render(
      <Text testID="t">
        {'שלום'}
        {' world'}
      </Text>,
    );
    // Queried by testID rather than text: RN joins the fragments, so matching
    // on content here tests the query API rather than the component.
    expect(styleOf(screen.getByTestId('t')).textAlign).toBe('right');
  });

  it('lets a style prop win over the token', () => {
    render(<Text style={{ fontSize: 99 }}>hi</Text>);
    expect(styleOf(screen.getByText('hi')).fontSize).toBe(99);
  });

  it('forwards arbitrary Text props', () => {
    render(<Text numberOfLines={2} testID="t">hi</Text>);
    expect(screen.getByTestId('t').props.numberOfLines).toBe(2);
  });
});
