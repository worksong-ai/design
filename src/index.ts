/**
 * @worksong/design — tokens and control primitives shared by the Worksong app
 * and bot mobile.
 *
 * Tokens are pure TypeScript with no react-native import, so they are testable
 * in the repo's ordinary Vitest lane rather than only under jest-expo. Anything
 * that needs `Platform`, `PixelRatio` or a component belongs in the primitives
 * layer instead.
 *
 * CI: a change here affects Mobile/iOS only (the mobile lane and the Mac iOS
 * lane); no server image is built or rolled out (ADR-0007).
 */
export * from './tokens/index.js';
export * from './primitives/index.js';
