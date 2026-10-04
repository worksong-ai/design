import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { screenHeaderStyles } from './ScreenHeader.js';
import { SearchHeader } from './SearchHeader.js';

describe('SearchHeader', () => {
  const props = {
    placeholder: 'Search Things',
    closeIcon: <RNText>x</RNText>,
    testID: 'sh',
    inputTestID: 'sh-input',
    closeTestID: 'sh-close',
  };

  it('sits in the same frame as ScreenHeader, so opening search moves nothing', () => {
    render(<SearchHeader {...props} value="" onChangeText={jest.fn()} onClose={jest.fn()} />);
    expect(StyleSheet.flatten(screen.getByTestId('sh').props.style)).toEqual(
      StyleSheet.flatten(screenHeaderStyles.frame),
    );
  });

  it('reports typing and close', () => {
    const onChangeText = jest.fn();
    const onClose = jest.fn();
    render(<SearchHeader {...props} value="" onChangeText={onChangeText} onClose={onClose} />);
    fireEvent.changeText(screen.getByTestId('sh-input'), 'ada');
    expect(onChangeText).toHaveBeenCalledWith('ada');
    fireEvent.press(screen.getByTestId('sh-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Close search')).toBeTruthy();
  });
});
