import { fireEvent, render, screen } from '@testing-library/react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { size } from '../tokens/space.js';
import { maxFontScale } from '../tokens/typography.js';
import { TextInput } from './TextInput.js';

/** Flatten RN's array-of-styles into one object. */
function styleOf(element: { props: { style?: unknown } }): Record<string, unknown> {
  const flatten = (value: unknown): Record<string, unknown> => {
    if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return {};
  };
  return flatten(element.props.style);
}

describe('TextInput', () => {
  it('reports what the user typed', () => {
    const onChangeText = jest.fn();
    render(<TextInput value="" onChangeText={onChangeText} testID="i" />);

    fireEvent.changeText(screen.getByTestId('i'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('renders the label and the error around the field', () => {
    render(
      <TextInput value="" onChangeText={jest.fn()} label="Bot name" error="Required" testID="i" />,
    );

    expect(screen.getByText('Bot name')).toBeTruthy();
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('renders neither line when neither is given', () => {
    render(<TextInput value="x" onChangeText={jest.fn()} testID="i" />);
    expect(screen.queryByText('Required')).toBeNull();
  });

  it('paints the border red while in error, separator otherwise', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="ok" />);
    expect(styleOf(screen.getByTestId('ok')).borderColor).toBe(darkColors.separator);

    render(<TextInput value="" onChangeText={jest.fn()} error="Required" testID="bad" />);
    expect(styleOf(screen.getByTestId('bad')).borderColor).toBe(darkColors.red);
  });

  it('honours an alternate scheme', () => {
    render(
      <TextInput value="" onChangeText={jest.fn()} error="Required" scheme={lightColors} testID="i" />,
    );
    expect(styleOf(screen.getByTestId('i')).borderColor).toBe(lightColors.red);
  });

  it('outlines on focus, and lets the error colour win over the outline', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="i" />);
    fireEvent(screen.getByTestId('i'), 'focus');
    expect(styleOf(screen.getByTestId('i')).borderColor).toBe(darkColors.focus);

    render(<TextInput value="" onChangeText={jest.fn()} error="Required" testID="e" />);
    fireEvent(screen.getByTestId('e'), 'focus');
    expect(styleOf(screen.getByTestId('e')).borderColor).toBe(darkColors.red);
  });

  it('aligns a Hebrew value right as it is typed', () => {
    // The field cannot be annotated per screen: one form takes both languages,
    // so direction has to come off the content.
    render(<TextInput value="שלום עולם" onChangeText={jest.fn()} testID="i" />);

    expect(styleOf(screen.getByTestId('i'))).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
  });

  it('leaves an English value left', () => {
    render(<TextInput value="hello world" onChangeText={jest.fn()} testID="i" />);

    expect(styleOf(screen.getByTestId('i'))).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
    });
  });

  it('borrows the placeholder direction while the field is empty', () => {
    // Otherwise a Hebrew-prompted field sits left-aligned until the first
    // keystroke, which reads as broken before the user has done anything.
    render(<TextInput value="" onChangeText={jest.fn()} placeholder="כתוב הודעה" testID="he" />);
    expect(styleOf(screen.getByTestId('he')).textAlign).toBe('right');

    render(<TextInput value="" onChangeText={jest.fn()} placeholder="Message" testID="en" />);
    expect(styleOf(screen.getByTestId('en')).textAlign).toBe('left');
  });

  it('lets the value outvote the placeholder once there is one', () => {
    render(
      <TextInput value="שלום" onChangeText={jest.fn()} placeholder="Message" testID="i" />,
    );
    expect(styleOf(screen.getByTestId('i')).textAlign).toBe('right');
  });

  it('takes the placeholder colour from the scheme', () => {
    render(<TextInput value="" onChangeText={jest.fn()} placeholder="Message" testID="i" />);
    expect(screen.getByTestId('i').props.placeholderTextColor).toBe(darkColors.textTertiary);
  });

  it('blocks editing when not editable, and says so to assistive technology', () => {
    const onChangeText = jest.fn();
    render(<TextInput value="locked" onChangeText={onChangeText} editable={false} testID="i" />);

    const input = screen.getByTestId('i');
    fireEvent.changeText(input, 'nope');
    expect(onChangeText).not.toHaveBeenCalled();
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('announces the error rather than leaving it to the border colour', () => {
    // The field also sets `accessibilityState.invalid`, but RN rebuilds a
    // TextInput's state from five known keys and drops it before the host, so
    // the alert role is the only part a screen reader gets. Asserting the
    // stripped flag would test React Native, not this component.
    render(<TextInput value="" onChangeText={jest.fn()} error="Required" testID="i" />);

    expect(screen.getByText('Required').props.accessibilityRole).toBe('alert');
  });

  it('passes secureTextEntry through', () => {
    render(<TextInput value="hunter2" onChangeText={jest.fn()} secureTextEntry testID="i" />);
    expect(screen.getByTestId('i').props.secureTextEntry).toBe(true);

    render(<TextInput value="hunter2" onChangeText={jest.fn()} testID="plain" />);
    expect(screen.getByTestId('plain').props.secureTextEntry).toBe(false);
  });

  it('passes maxLength and onSubmitEditing through', () => {
    const onSubmitEditing = jest.fn();
    render(
      <TextInput
        value="hi"
        onChangeText={jest.fn()}
        maxLength={40}
        onSubmitEditing={onSubmitEditing}
        testID="i"
      />,
    );

    expect(screen.getByTestId('i').props.maxLength).toBe(40);
    fireEvent(screen.getByTestId('i'), 'submitEditing');
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });

  it('labels itself from the label, then the placeholder', () => {
    render(
      <TextInput value="" onChangeText={jest.fn()} label="Bot name" placeholder="e.g. Ada" testID="both" />,
    );
    expect(screen.getByTestId('both').props.accessibilityLabel).toBe('Bot name');

    render(<TextInput value="" onChangeText={jest.fn()} placeholder="e.g. Ada" testID="ph" />);
    expect(screen.getByTestId('ph').props.accessibilityLabel).toBe('e.g. Ada');
  });

  it('meets the 44pt minimum hit area', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="i" />);
    expect(styleOf(screen.getByTestId('i')).minHeight as number).toBeGreaterThanOrEqual(
      size.touchTarget,
    );
  });

  it('grows its minimum height with the OS font scale', () => {
    // Worksong's fixed-height rows clip at large Dynamic Type sizes. The box has
    // to grow by the same clamped factor the glyphs do.
    render(<TextInput value="" onChangeText={jest.fn()} testID="normal" fontScale={1} />);
    const normal = styleOf(screen.getByTestId('normal')).minHeight as number;

    render(<TextInput value="" onChangeText={jest.fn()} testID="large" fontScale={2} />);
    const large = styleOf(screen.getByTestId('large')).minHeight as number;

    expect(large).toBeGreaterThan(normal);
  });

  it('caps its own font scaling to the body token', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="i" />);
    expect(screen.getByTestId('i').props.maxFontSizeMultiplier).toBe(maxFontScale.body);
  });

  it('gives multiline a taller box with top-aligned text', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="single" />);
    const single = styleOf(screen.getByTestId('single')).minHeight as number;

    render(<TextInput value="" onChangeText={jest.fn()} multiline testID="multi" />);
    const multi = styleOf(screen.getByTestId('multi'));

    expect(multi.minHeight as number).toBeGreaterThan(single);
    expect(multi.textAlignVertical).toBe('top');
    expect(screen.getByTestId('multi').props.multiline).toBe(true);
  });

  it('dims the text rather than the whole field when read-only', () => {
    render(<TextInput value="locked" onChangeText={jest.fn()} testID="on" />);
    expect(styleOf(screen.getByTestId('on')).color).toBe(darkColors.textPrimary);

    render(<TextInput value="locked" onChangeText={jest.fn()} editable={false} testID="off" />);
    expect(styleOf(screen.getByTestId('off')).color).toBe(darkColors.textSecondary);
  });
});
