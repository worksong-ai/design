import { render } from '@testing-library/react';

import {
  AppleSignInButton,
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  ListRow,
  Sheet,
  Text,
  TextInput,
} from '../primitives/index.js';

/**
 * Proof this package survives `react-native-web`, not a full test harness:
 * bot's app is native-only today, so nothing previously exercised these
 * primitives through the web renderer. jest.web.config.cjs aliases
 * `react-native` to `react-native-web` and runs this file under jsdom with
 * `@testing-library/react` (DOM), instead of the native-only
 * `@testing-library/react-native` renderer the other *.test.tsx files use.
 */
describe('primitives render through react-native-web', () => {
  it('Button', () => {
    render(<Button label="Continue" onPress={() => {}} />);
  });

  it('IconButton', () => {
    render(<IconButton icon={<Text>i</Text>} accessibilityLabel="Info" onPress={() => {}} />);
  });

  it('Badge', () => {
    render(<Badge label="New" />);
  });

  it('Avatar', () => {
    render(<Avatar name="Ada Lovelace" />);
  });

  it('Card', () => {
    render(
      <Card>
        <Text>Card content</Text>
      </Card>,
    );
  });

  it('Sheet', () => {
    render(
      <Sheet visible onClose={() => {}} title="Sheet">
        <Text>Sheet content</Text>
      </Sheet>,
    );
  });

  it('TextInput', () => {
    render(<TextInput value="" onChangeText={() => {}} label="Name" />);
  });

  it('ListRow', () => {
    render(<ListRow title="Row" subtitle="Subtitle" />);
  });

  it('Text', () => {
    render(<Text>Hello</Text>);
  });

  it('AppleSignInButton', () => {
    render(<AppleSignInButton onPress={() => {}} />);
  });
});
