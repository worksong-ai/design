# @worksong/design

Worksong's shared design system — design tokens and cross-platform (React
Native / `react-native-web`) control primitives. Extracted from
[`worksong-ai/bot`](https://github.com/worksong-ai/bot)'s `packages/design`
(with its original commit history) so every Worksong product depends on one
canonical package instead of a hand-copied set of the same values.

## What's here

```
src/tokens/       colors, brand, space, text, typography, layout
src/primitives/   Avatar, AppleSignInButton, Badge, Button, Card, IconButton,
                   ListRow, Sheet, Text, TextInput, useFontScale, useScheme
src/patterns/     ScreenHeader, SearchHeader, FilterChips, NavRail, ShellFrame, formatBadgeCount
src/index.ts       re-exports all three
```

### Patterns (v0.3.0)

Higher-level presentation extracted from Bot's Expo UI, which is the reference
for how a Worksong root screen looks. They take generic props and callbacks and
know nothing about a product's routes, data or icons; the app owns those.

- `ScreenHeader` — large root title, optional inline badge, icon-button actions
  on the right. `accessibilityLabel` is required on every action. The badge
  and the number of actions cannot move the title. `screenHeaderStyles.frame`
  is the same row frame for a screen's own variant.
  Since v0.3.0 it also draws a pushed screen: `back` (a chevron before the title)
  and `subtitle`. **Every screen's title comes from here** -- a screen never
  draws its own `screenTitle` row.
- `SearchHeader` — the header's search state: a pill input and a close button in
  `ScreenHeader`'s frame, replacing the title row while a search is open.
- `FilterChips` — horizontally scrolling chips; selecting changes colour, never
  geometry; a 44pt effective hit target; counts ride in the labels the app passes.
- `NavRail` — vertical rail: icon over a short label, leading active bar, an
  optional badge string. Items are `{ key, label, icon(state), badge?,
  accessibilityLabel?, testID }`; the app supplies them and the `onSelect`.
- `ShellFrame` — `layout`, `rail`, `list`, `main` slots (and which pane a
  tablet shows). No navigation state: the app decides the section, the open
  item and what `mobile` means (there it renders only `main`).
- Layout tokens (`tokens/layout.ts`): `SCREEN_GUTTER`, `HEADER_LAYOUT`,
  `CHIP_LAYOUT`, `LIST_TOP`, `CONTENT_LAYOUT`, `ROW_LAYOUT`, `SECTION_LAYOUT`,
  and the shell's `shellLayoutFor`, `TABLET_MIN_WIDTH` (640),
  `DESKTOP_MIN_WIDTH` (960), `RAIL_WIDTH`, `listPaneWidth`, `RAIL_LAYOUT`.

The patterns import only `react`, `react-native` and this package: no
`expo-router`, DOM, CSS or product state (`patterns/boundaries.test.ts` fails
on a stray import). On web, selected/hidden state is also set as `aria-*`,
because `react-native-web` ignores `accessibilityState`.

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
    "@worksong/design": "github:worksong-ai/design#v0.3.0"
  }
}
```

Bump the pinned tag deliberately when you want a new release. New releases
are tagged `vX.Y.Z` off `main` once CI is green: bump `version` in
`package.json`, merge, then run Actions -> Release (it re-runs the checks, tags
main at that version and cuts the GitHub release; it refuses a version that is
already tagged).

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
