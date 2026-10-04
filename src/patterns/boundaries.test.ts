import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The patterns are shared by apps that run on iOS, Android and the web via
 * react-native-web, and they know nothing about any one product. This reads
 * their source, so a stray import fails here, in the cheap lane, rather than
 * in a consumer's bundler.
 */
const dir = dirname(fileURLToPath(import.meta.url));
const sources = readdirSync(dir)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
  .map((f) => ({ f, text: readFileSync(join(dir, f), 'utf8') }));

/** Only the import lines, so a comment that names a forbidden thing is allowed. */
const importsOf = (text: string) => text.split('\n').filter((l) => /^\s*(import|export)\b.*\bfrom\b/.test(l));

describe('patterns boundaries', () => {
  it('finds the pattern sources it is meant to guard', () => {
    expect(sources.map((s) => s.f)).toEqual(
      expect.arrayContaining(['ScreenHeader.tsx', 'FilterChips.tsx', 'NavRail.tsx', 'ShellFrame.tsx', 'SearchHeader.tsx']),
    );
  });

  it.each(sources)('$f imports only react, react-native and this package', ({ text }) => {
    for (const line of importsOf(text)) {
      const spec = /from\s+['"]([^'"]+)['"]/.exec(line)?.[1] ?? '';
      expect(spec === 'react' || spec === 'react-native' || spec.startsWith('.')).toBe(true);
    }
  });

  it.each(sources)('$f uses no DOM globals, CSS or router', ({ text }) => {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/\b(window|document|localStorage|navigator)\./);
    expect(code).not.toMatch(/expo-router|className|dangerouslySetInnerHTML|\.css['"]/);
  });
});
