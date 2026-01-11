import type { Locale, TranslationData, ProgramTranslations, ProgramTranslation } from './types';
export type { Locale, TranslationData, ProgramTranslations, ProgramTranslation } from './types';
export { locales } from './types';

// Static imports for English (always loaded)
import en from './en';

// Lazy loaders for other languages
const loades = () => import('./es');
const loadzhHans = () => import('./zh-Hans');
const loadzhHant = () => import('./zh-Hant');
const loadvi = () => import('./vi');
const loadfil = () => import('./fil');
const loadko = () => import('./ko');
const loadru = () => import('./ru');
const loadfr = () => import('./fr');
const loadar = () => import('./ar');

// Translation cache
const cache: Partial<Record<Locale, { ui: TranslationData; programs: ProgramTranslations }>> = {
  en,
};

/**
 * Load translations for a locale
 */
export async function loadTranslations(locale: Locale): Promise<{ ui: TranslationData; programs: ProgramTranslations }> {
  if (cache[locale]) {
    return cache[locale]!;
  }

  let data: { ui: TranslationData; programs: ProgramTranslations };

  switch (locale) {
    case 'es':
      data = (await loades()).default;
      break;
    case 'zh-Hans':
      data = (await loadzhHans()).default;
      break;
    case 'zh-Hant':
      data = (await loadzhHant()).default;
      break;
    case 'vi':
      data = (await loadvi()).default;
      break;
    case 'fil':
      data = (await loadfil()).default;
      break;
    case 'ko':
      data = (await loadko()).default;
      break;
    case 'ru':
      data = (await loadru()).default;
      break;
    case 'fr':
      data = (await loadfr()).default;
      break;
    case 'ar':
      data = (await loadar()).default;
      break;
    default:
      return en;
  }

  cache[locale] = data;
  return data;
}

/**
 * Get UI translation
 */
export function t(
  key: string,
  translations: TranslationData,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = translations;

  for (const k of keys) {
    if (typeof value !== 'object' || value === null) {
      return key; // Key not found, return key itself
    }
    value = (value as Record<string, unknown>)[k];
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Interpolate parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }

  return value;
}

/**
 * Get program translation with fallback to English
 */
export function getProgramTranslation(
  programId: string,
  field: keyof ProgramTranslation,
  translations: ProgramTranslations,
  fallback: string
): string {
  const program = translations[programId];
  if (program && program[field]) {
    return program[field]!;
  }
  return fallback;
}

// Re-export English as default
export default en;
