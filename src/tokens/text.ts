/**
 * Text direction.
 *
 * The bot ships first-class Hebrew: `@bot/shared`'s `detectSpeechLanguage`
 * exists precisely because model output and user input can be Hebrew, and there
 * is a dedicated `he-IL` voice. So the transcript renderer has to get direction
 * right per message, not per app.
 *
 * Worksong offers nothing to inherit here — one hand-rolled `rtlText` style in
 * one screen, and no `I18nManager` anywhere in the tree. Retrofitting direction
 * after the transcript renderer exists is expensive, so it goes in at the token
 * layer and every text primitive reads it.
 *
 * Deliberately per-string rather than per-app: a Hebrew reply inside an English
 * conversation must align right while the surrounding chrome stays left. Flipping
 * the whole layout with `I18nManager.forceRTL` would be wrong for exactly the
 * case the product actually has.
 */

/** Hebrew block. Same range `@bot/shared`'s speech detector uses. */
const HEBREW = /[֐-׿]/;
/** Arabic, plus supplements and presentation forms. */
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/** Characters that carry no direction of their own. */
const NEUTRAL_PREFIX = /^[\s\p{P}\p{S}\p{N}]*/u;

export type TextDirection = 'ltr' | 'rtl';

/**
 * Direction for a piece of text.
 *
 * Uses first-strong detection — the direction of the first character that has
 * one — which is the Unicode rule and what a reader expects: a message that
 * opens in Hebrew reads right-to-left even if it quotes an English product name
 * later on. Leading punctuation, digits and whitespace are skipped, so `"שלום"`
 * and `— שלום` agree.
 *
 * Note this differs from `@bot/shared`'s `detectSpeechLanguage`, where *any*
 * Hebrew letter wins. That is the right rule for choosing a TTS voice and the
 * wrong one for aligning a bubble: one Hebrew word in an English paragraph
 * should not flip the paragraph.
 */
export function textDirection(text: string): TextDirection {
  const stripped = text.replace(NEUTRAL_PREFIX, '');
  if (stripped.length === 0) return 'ltr';

  for (const character of stripped) {
    if (HEBREW.test(character) || ARABIC.test(character)) return 'rtl';
    // Any strong Latin/Cyrillic/Greek letter settles it the other way.
    if (/\p{L}/u.test(character)) return 'ltr';
  }
  return 'ltr';
}

/** Whether the text contains any right-to-left script at all. */
export function containsRtl(text: string): boolean {
  return HEBREW.test(text) || ARABIC.test(text);
}

/** `textAlign` for a direction. */
export function alignFor(direction: TextDirection): 'left' | 'right' {
  return direction === 'rtl' ? 'right' : 'left';
}

/**
 * The style pair a text node needs to render in `direction`.
 *
 * `writingDirection` is iOS-only and `textAlign` is what Android honours, so
 * both are set — omitting either leaves one platform laying out backwards.
 */
export function directionStyle(direction: TextDirection): {
  textAlign: 'left' | 'right';
  writingDirection: TextDirection;
} {
  return { textAlign: alignFor(direction), writingDirection: direction };
}
