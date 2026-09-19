import { en } from './en';
import type { Translations } from './en';

const locale = 'en' as const;
const strings: Record<string, Translations> = { en };

/** Dot-path keys like 'home.startGame' or 'play.cardOf' */
type NestedKeys<T, Prefix extends string = ''> = T extends Record<
  string,
  unknown
>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? NestedKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeys<Translations>;

/**
 * Look up a translated string by dot-path key and interpolate parameters.
 *
 * @example
 *   t('play.cardOf', { current: 2, total: 6 })
 *   // => "Card 2 of 6"
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const parts = key.split('.');
  let value: unknown = strings[locale];

  for (const part of parts) {
    if (value == null || typeof value !== 'object') {
      return key; // fallback: return the key itself
    }
    value = (value as Record<string, unknown>)[part];
  }

  if (typeof value !== 'string') {
    return key; // fallback: return the key itself
  }

  if (!params) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
