# @worksong/design

Worksong's shared design system — design tokens and cross-platform (React
Native / `react-native-web`) control primitives. Extracted from
[`worksong-ai/bot`](https://github.com/worksong-ai/bot)'s `packages/design`
(with its original commit history) so every Worksong product depends on one
canonical package instead of a hand-copied set of the same values.

## What's here

```
src/tokens/       colors, brand, space, text, typography
src/primitives/   Avatar, AppleSignInButton, Badge, Button, Card, IconButton,
                   ListRow, Sheet, Text, TextInput, useFontScale, useScheme
src/index.ts       re-exports both
```

Same shape as it had inside `bot`. `AppleSignInButton` aside, the primitives
only use core `react-native` components (`View`, `Pressable`, `Text`,
`TextInput`, `Image`, `Modal`, `ActivityIndicator`, `StyleSheet`) — no Expo
or native-module APIs.

## Who consumes this

- **`worksong-ai/bot`** — today, via a local `packages/design` copy. A
  follow-up PR in that repo will remove the local copy and add this package
  as a git dependency (a no-op rename since the package name is unchanged).
- **`worksong-ai/Boardy`** — `mobile/` will depend on this directly instead
  of the hand-copied `mobile/src/design/tokens.ts`, once
  [Boardy#690](https://github.com/worksong-ai/Boardy/issues/690)'s restyle
  work lands.

## Installing

There's no npm registry for this org yet, so consumers install a git
dependency pinned to a tag — never a floating branch:

```json
{
  "dependencies": {
    "@worksong/design": "github:worksong-ai/design#v0.1.0"
  }
}
```

Bump the pinned tag deliberately when you want a new release. New releases
are tagged `vX.Y.Z` off `main` once CI is green.

## Developing

```
npm install
npm run typecheck
npm run test       # tokens (Vitest) + primitives (Jest, native RN)
npm run test:web   # primitives through react-native-web (see below)
npm run build      # tsc -> dist/
```

Peer dependencies: `react >=18`, and `react-native >=0.76` if you use the
primitives (optional — the tokens have no RN dependency).

### Test lanes

Three separate configs, split by what they need to run:

- `vitest.config.ts` — `src/**/*.test.ts`, the pure-TS token tests.
- `jest.config.cjs` — `src/**/*.test.tsx`, the primitives under
  `@react-native/jest-preset` + `@testing-library/react-native` (native RN
  renderer, `react-test-renderer`).
- `jest.web.config.cjs` — `src/__rnw__/*.test.tsx`, the same primitives
  rendered through `react-native-web` under jsdom with
  `@testing-library/react` (DOM renderer).

### `react-native-web` compatibility

`bot`'s app is native-only today, so nothing had exercised this package
through `react-native-web` before. `npm run test:web` aliases `react-native`
to `react-native-web` and renders every primitive (`Button`, `IconButton`,
`Badge`, `Avatar`, `Card`, `Sheet`, `TextInput`, `ListRow`, `Text`,
`AppleSignInButton`) under jsdom via `@testing-library/react`.

**Result: all ten render cleanly.** The only output is one benign
`console.warn` from `react-native-web` about `Card`'s `shadow*` style props
being deprecated in favor of `boxShadow` — a heads-up for a future style
update, not a failure. This is a smoke check proving the package survives
`react-native-web`, not a full visual regression harness.

## CI

`.github/workflows/ci.yml` runs `typecheck`, `test`, `test:web`, and `build`
on every push to `main` and every pull request.
