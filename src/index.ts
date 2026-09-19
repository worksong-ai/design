/**
 * @worksong/design — tokens and control primitives shared by the Worksong app
 * and bot mobile.
 *
 * Tokens are pure TypeScript with no react-native import, so they are testable
 * in the repo's ordinary Vitest lane rather than only under jest-expo. Anything
 * that needs `Platform`, `PixelRatio` or a component belongs in the primitives
 * layer instead.
 */
export * from './tokens/index.js';
