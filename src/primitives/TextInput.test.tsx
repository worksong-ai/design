import { fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { darkColors, lightColors } from '../tokens/colors.js';
import { radius, size } from '../tokens/space.js';
import { maxFontScale, scaledMinHeight } from '../tokens/typography.js';
import { TextInput } from './TextInput.js';
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

  it('reports focus, so a screen can scroll the field and its action above the keyboard', () => {
    const onFocus = jest.fn();
    render(<TextInput value="" onChangeText={jest.fn()} onFocus={onFocus} testID="i" />);
    fireEvent(screen.getByTestId('i'), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('reports blur, so a composer can close its inline suggestions (#380)', () => {
    const onBlur = jest.fn();
    render(<TextInput value="" onChangeText={jest.fn()} onBlur={onBlur} testID="i" />);
    fireEvent(screen.getByTestId('i'), 'focus');
    fireEvent(screen.getByTestId('i'), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
    // The focus ring still clears: the callback is in addition to it.
    expect(styleOf(screen.getByTestId('i')).borderColor).toBe(darkColors.separator);
  });

  it('reports where the caret moved, without controlling it (#380)', () => {
    const onSelectionChange = jest.fn();
    render(
      <TextInput value="hi @ad" onChangeText={jest.fn()} onSelectionChange={onSelectionChange} testID="i" />,
    );
    fireEvent(screen.getByTestId('i'), 'selectionChange', {
      nativeEvent: { selection: { start: 3, end: 3 } },
    });
    expect(onSelectionChange).toHaveBeenCalledWith({ start: 3, end: 3 });
    expect(screen.getByTestId('i').props.selection).toBeUndefined();
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

  it('keeps the pill a fixed-radius rounded rectangle as it grows (#407)', () => {
    // The bug: `pill` used to set `borderRadius: radius.full` (999) outright,
    // relying on RN clipping it to half the box's smaller dimension. That
    // clip tracks *height* once a multiline pill grows past one row, so the
    // radius grew with every wrapped line — an oval that ballooned, clipping
    // the last line near the bottom corner. The fix is a radius computed once
    // from the single-row height, independent of how much text is typed.
    //
    // RNTL renders styles, not native layout, so it cannot reproduce the
    // clip itself -- the component never varied `borderRadius` by `value`
    // either before or after the fix, so `grown === empty` alone would also
    // have held on the old code. The assertion that actually distinguishes
    // the two is `empty` being the *exact* single-row value, not the raw
    // `radius.full` token: that equality is what used to be true only for a
    // one-row box, and is now true unconditionally.
    // Pinned to `fontScale={1}` (as the other minHeight tests in this file
    // do): the test host's own default `useWindowDimensions().fontScale` is
    // not 1, so leaving it implicit would make the exact-value assertion
    // below depend on wherever jest-expo's mock happens to sit.
    render(<TextInput value="" onChangeText={jest.fn()} multiline pill fontScale={1} testID="empty" />);
    const empty = styleOf(screen.getByTestId('empty')).borderRadius as number;

    const fiveLines = 'one\ntwo\nthree\nfour\nfive and a much longer line that would wrap further still';
    render(
      <TextInput value={fiveLines} onChangeText={jest.fn()} multiline pill fontScale={1} testID="grown" />,
    );
    const grown = styleOf(screen.getByTestId('grown')).borderRadius as number;

    expect(grown).toBe(empty);
    // Pinned to the exact figure a one-row pill used to get clipped down to
    // (half the single-row minimum height), not just "some smaller number".
    expect(empty).toBe(scaledMinHeight(size.touchTarget, 'body', 1) / 2);
    expect(empty).toBeLessThan(radius.full);
  });

  it('keeps the pill radius fixed for a Hebrew value too', () => {
    // Direction is content-driven for this field (see the RTL tests above);
    // confirm the radius fix does not accidentally key off direction as a
    // proxy for length.
    const hebrewLines = 'שלום\nעולם\nשורה שלישית ארוכה יותר שתעטוף';
    render(
      <TextInput value={hebrewLines} onChangeText={jest.fn()} multiline pill fontScale={1} testID="he" />,
    );
    const he = styleOf(screen.getByTestId('he')).borderRadius as number;

    render(<TextInput value="" onChangeText={jest.fn()} multiline pill fontScale={1} testID="empty" />);
    const empty = styleOf(screen.getByTestId('empty')).borderRadius as number;

    expect(he).toBe(empty);
  });

  it('keeps the same pill radius across font scales as it was designed to clip to', () => {
    // At one row, `pillRadius` must equal what `radius.full` used to get
    // clipped down to (half the single-row height) so the pill's rest shape
    // does not change — only its behaviour as it grows.
    render(<TextInput value="" onChangeText={jest.fn()} multiline pill fontScale={2} testID="scaled" />);
    const scaled = styleOf(screen.getByTestId('scaled')).borderRadius as number;

    render(<TextInput value="" onChangeText={jest.fn()} multiline pill fontScale={1} testID="normal" />);
    const normal = styleOf(screen.getByTestId('normal')).borderRadius as number;

    expect(scaled).toBeGreaterThan(normal);
  });

  it('dims the text rather than the whole field when read-only', () => {
    render(<TextInput value="locked" onChangeText={jest.fn()} testID="on" />);
    expect(styleOf(screen.getByTestId('on')).color).toBe(darkColors.textPrimary);

    render(<TextInput value="locked" onChangeText={jest.fn()} editable={false} testID="off" />);
    expect(styleOf(screen.getByTestId('off')).color).toBe(darkColors.textSecondary);
  });
});

describe('field kind', () => {
  it('defaults to a plain text field that changes nothing', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="f" />);
    const field = screen.getByTestId('f');
    expect(field.props.keyboardType).toBe('default');
    expect(field.props.autoCapitalize).toBe('sentences');
  });

  it('sets all four email props together, not just the keyboard', () => {
    // A field that only sets `keyboardType` still autocapitalises, so the
    // first character of an address is a capital the user deletes by hand.
    render(<TextInput value="" onChangeText={jest.fn()} kind="email" testID="f" />);
    const field = screen.getByTestId('f');
    expect(field.props.keyboardType).toBe('email-address');
    expect(field.props.autoCapitalize).toBe('none');
    expect(field.props.autoCorrect).toBe(false);
    expect(field.props.textContentType).toBe('emailAddress');
    expect(field.props.autoComplete).toBe('email');
  });

  it('marks a password field so the keychain offers to fill it', () => {
    render(<TextInput value="" onChangeText={jest.fn()} kind="password" secureTextEntry testID="f" />);
    const field = screen.getByTestId('f');
    expect(field.props.textContentType).toBe('password');
    expect(field.props.autoComplete).toBe('current-password');
    expect(field.props.secureTextEntry).toBe(true);
  });

  it('distinguishes a new password, so the keychain offers to generate one', () => {
    render(<TextInput value="" onChangeText={jest.fn()} kind="newPassword" secureTextEntry testID="f" />);
    const field = screen.getByTestId('f');
    expect(field.props.textContentType).toBe('newPassword');
    expect(field.props.autoComplete).toBe('new-password');
  });

  it('marks an emailed code as a one-time code, so iOS offers it from Mail', () => {
    render(<TextInput value="" onChangeText={jest.fn()} kind="oneTimeCode" testID="f" />);
    const field = screen.getByTestId('f');
    expect(field.props.keyboardType).toBe('number-pad');
    expect(field.props.textContentType).toBe('oneTimeCode');
    expect(field.props.autoComplete).toBe('one-time-code');
    expect(field.props.autoCorrect).toBe(false);
  });

  it('follows the scheme in force rather than always painting dark', () => {
    render(
      <SchemeProvider preference="light">
        <TextInput value="" onChangeText={jest.fn()} testID="i" />
      </SchemeProvider>,
    );
    expect(styleOf(screen.getByTestId('i')).borderColor).toBe(lightColors.separator);
  });
});

describe('Return moves to the next field', () => {
  it('labels Return with the given returnKeyType and keeps the keyboard up for "next"', () => {
    render(<TextInput value="" onChangeText={jest.fn()} returnKeyType="next" testID="i" />);
    const field = screen.getByTestId('i');
    expect(field.props.returnKeyType).toBe('next');
    // Blurring on submit would drop the keyboard and bring it back as the
    // next field takes focus: a flicker, and a layout jump on every field.
    expect(field.props.submitBehavior).toBe('submit');
  });

  it('leaves Return alone when none is given', () => {
    render(<TextInput value="" onChangeText={jest.fn()} testID="i" />);
    expect(screen.getByTestId('i').props.returnKeyType).toBeUndefined();
    expect(screen.getByTestId('i').props.submitBehavior).toBeUndefined();
  });

  it('hands the native field to inputRef, so a screen can focus it', () => {
    const inputRef = createRef<RNTextInput>();
    render(<TextInput value="" onChangeText={jest.fn()} inputRef={inputRef} testID="i" />);
    expect(typeof inputRef.current?.focus).toBe('function');
  });
});
