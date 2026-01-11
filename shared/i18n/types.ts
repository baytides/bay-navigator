/**
 * TypeScript types for Bay Navigator i18n
 * Auto-generated - DO NOT EDIT MANUALLY
 */

export interface TranslationData {
  common: {
    siteName: string;
    siteTagline: string;
    search: string;
    searchPlaceholder: string;
    loading: string;
    error: string;
    close: string;
    learnMore: string;
    viewAll: string;
    back: string;
    next: string;
    previous: string;
    save: string;
    cancel: string;
    apply: string;
    clear: string;
    filter: string;
    sort: string;
    share: string;
    print: string;
    download: string;
  };
  nav: {
    home: string;
    directory: string;
    map: string;
    eligibility: string;
    about: string;
    favorites: string;
    settings: string;
    accessibility: string;
    privacy: string;
    terms: string;
  };
  search: {
    smartSearch: string;
    smartSearchTooltip: string;
    noResults: string;
    browseAll: string;
    trySearching: string;
    orAskQuestion: string;
    resultsCount: string;
    aiPowered: string;
  };
  fallback: {
    cantFind: string;
    call211: string;
    call211Desc: string;
    legalAid: string;
    legalAidDesc: string;
    calfresh: string;
    calfreshDesc: string;
    benefitsCal: string;
    benefitsCalDesc: string;
  };
  categories: {
    all: string;
    food: string;
    health: string;
    housing: string;
    utilities: string;
    transportation: string;
    education: string;
    legal: string;
    finance: string;
    technology: string;
    recreation: string;
    community: string;
  };
  groups: {
    seniors: string;
    veterans: string;
    families: string;
    youth: string;
    disabled: string;
    lowIncome: string;
    students: string;
    immigrants: string;
    lgbtq: string;
  };
  program: {
    eligibility: string;
    howToApply: string;
    whatTheyOffer: string;
    website: string;
    phone: string;
    address: string;
    hours: string;
    verified: string;
    lastUpdated: string;
    directions: string;
    addToFavorites: string;
    removeFromFavorites: string;
  };
  safety: {
    quickExit: string;
    quickExitTooltip: string;
    needHelp: string;
    call911: string;
    call988: string;
    chatOnline: string;
    youreNotAlone: string;
    crisisSupport: string;
  };
  accessibility: {
    skipToContent: string;
    skipToNav: string;
    textSize: string;
    contrast: string;
    colorblindMode: string;
    reducedMotion: string;
  };
  offline: {
    youreOffline: string;
    offlineMessage: string;
    smartSearchDisabled: string;
  };
  print: {
    scanQR: string;
  };
  footer: {
    madeWith: string;
    forBayArea: string;
    dataFrom: string;
    copyright: string;
  };
}

export interface ProgramTranslation {
  name?: string;
  description?: string;
  what_they_offer?: string;
  how_to_get_it?: string;
  eligibility?: string;
  timeframe?: string;
  link_text?: string;
}

export type ProgramTranslations = Record<string, ProgramTranslation>;

export type Locale = 'en' | 'es' | 'zh-Hans' | 'zh-Hant' | 'vi' | 'fil' | 'ko' | 'ru' | 'fr' | 'ar';

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
}

export const locales: Record<Locale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  'zh-Hans': { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'zh-Hant': { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  fil: { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
};
