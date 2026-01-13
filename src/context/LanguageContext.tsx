import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Language, languageLabels, translations } from '../i18n/translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageLabels: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'dailydrive.language';

const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

const isLanguage = (value: unknown): value is Language =>
  value === 'en' || value === 'it' || value === 'sq' || value === 'el';

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('it')) return 'it';
    if (nav.startsWith('sq')) return 'sq';
    if (nav.startsWith('el')) return 'el';
    return 'en';
  });

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[language];
      const fallback = translations.en;
      const value = dict[key] ?? fallback[key] ?? key;
      return interpolate(value, vars);
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, languageLabels }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

