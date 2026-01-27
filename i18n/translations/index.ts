import { fr } from './fr';
import { ar } from './ar';
import { tn } from './tn';

export type Language = 'fr' | 'ar' | 'tn';

export type TranslationKeys = typeof fr;

export const translations: Record<Language, TranslationKeys> = {
  fr,
  ar,
  tn,
};

export const languageNames: Record<Language, string> = {
  fr: 'Français',
  ar: 'العربية',
  tn: 'تونسي',
};

export const isRTL = (lang: Language): boolean => {
  return lang === 'ar' || lang === 'tn';
};

export { fr, ar, tn };
