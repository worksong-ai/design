/**
 * Text.
 *
 * Every string in the app goes through here rather than through RN's `Text`
 * directly, because three things have to be right on every one of them and are
 * easy to forget on any given one:
 *
 *   - a type token, so sizes and line heights come from the scale;
 *   - a font-scale cap, so Dynamic Type cannot stretch a label past the box
 *     that holds it (RN's `allowFontScaling` defaults to true and Worksong's
 *     fixed-height rows clip because of it);
 *   - direction, detected per string, because the product ships Hebrew and a
 *     Hebrew message inside an English conversation must align right on its own.
 */
import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import type { ColorScheme } from '../tokens/colors.js';
import { textDirection, directionStyle, type TextDirection } from '../tokens/text.js';
import { maxFontScale, typography, type TypeTokenName } from '../tokens/typography.js';
import { useResolvedScheme } from './useScheme.js';

export interface WSTextProps extends Omit<TextProps, 'style'> {
  /** Type scale token. Defaults to `body`. */
  variant?: TypeTokenName;
  /** Any `ColorScheme` key, or an explicit colour string. */
  color?: keyof ColorScheme | (string & {});
  scheme?: ColorScheme;
  /**
   * Text direction. Omit to detect it from the content, which is what a
   * transcript wants; pass a value to pin it, which is what a fixed label wants.
   */
  direction?: TextDirection | 'auto';
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

/** Resolve a `color` prop that may be a token name or a literal. */
function resolveColor(color: string | undefined, scheme: ColorScheme): string {
  if (color === undefined) return scheme.textPrimary;
  return color in scheme ? scheme[color as keyof ColorScheme] : color;
}

/** The string content of a node, for direction detection. */
function textOf(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  return '';
}

export function Text({
  variant = 'body',
  color,
  scheme: schemeOverride,
  direction = 'auto',
  style,
  children,
  ...rest
}: WSTextProps) {
  const scheme = useResolvedScheme(schemeOverride);
  const resolvedDirection =
    direction === 'auto' ? textDirection(textOf(children)) : direction;

  return (
    <RNText
      // Capped rather than disabled: turning scaling off would fail exactly the
      // users who need it, while leaving it unbounded clips the layout.
      maxFontSizeMultiplier={maxFontScale[variant]}
      style={[
        typography[variant],
        { color: resolveColor(color, scheme) },
        directionStyle(resolvedDirection),
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
