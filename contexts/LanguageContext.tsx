import { useEffect, useState, useCallback, useMemo } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { translations, Language, TranslationKeys, isRTL, languageNames } from '@/i18n/translations';

const LANGUAGE_STORAGE_KEY = '@ideal_cuisine_language';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string 
      ? T[K] extends object 
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K 
      : never 
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<TranslationKeys>;

interface LanguageContextValue {
  language: Language;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => Promise<void>;
  languages: { code: Language; name: string }[];
  isLoading: boolean;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`[Language] Translation key not found: ${path}`);
      return path;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export const [LanguageProvider, useLanguage] = createContextHook<LanguageContextValue>(() => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      console.log('[Language] Loading saved language preference');
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'ar' || savedLanguage === 'tn')) {
          console.log('[Language] Found saved language:', savedLanguage);
          setLanguageState(savedLanguage as Language);
          
          const rtl = isRTL(savedLanguage as Language);
          if (I18nManager.isRTL !== rtl) {
            I18nManager.allowRTL(rtl);
            I18nManager.forceRTL(rtl);
          }
        }
      } catch (error) {
        console.error('[Language] Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    console.log('[Language] Setting language to:', lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      
      const rtl = isRTL(lang);
      const needsRTLChange = I18nManager.isRTL !== rtl;
      
      if (needsRTLChange) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        
        if (Platform.OS !== 'web') {
          console.log('[Language] RTL change requires app restart on native');
        }
      }
      
      console.log('[Language] Language set successfully');
    } catch (error) {
      console.error('[Language] Error setting language:', error);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const currentTranslations = translations[language];
    let text = getNestedValue(currentTranslations as unknown as Record<string, unknown>, key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }
    
    return text;
  }, [language]);

  const languages = useMemo(() => [
    { code: 'fr' as Language, name: languageNames.fr },
    { code: 'ar' as Language, name: languageNames.ar },
    { code: 'tn' as Language, name: languageNames.tn },
  ], []);

  const currentIsRTL = useMemo(() => isRTL(language), [language]);

  return {
    language,
    isRTL: currentIsRTL,
    t,
    setLanguage,
    languages,
    isLoading,
  };
});

export function useTranslation() {
  const { t, language, isRTL } = useLanguage();
  return { t, language, isRTL };
}
