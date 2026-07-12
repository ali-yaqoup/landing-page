import { createContext, useContext, useEffect, useState } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const LanguageContext = createContext(null);

const translations = { en, ar };

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem('stockflow-language');
    if (stored === 'en' || stored === 'ar') return stored;
    // Default to 'ar' since WAY TECH is focused on Arabic & English, with Arabic being the primary user context
    return 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // Dynamically update document properties for absolute consistency across HTML element behaviors
    const root = document.documentElement;
    root.setAttribute('dir', dir);
    root.setAttribute('lang', language);
    localStorage.setItem('stockflow-language', language);

    // Apply font-family and direction styling globally
    if (language === 'ar') {
      root.style.fontFamily = '"Tajawal", "Cairo", system-ui, -apple-system, sans-serif';
    } else {
      root.style.fontFamily = '"Inter", system-ui, -apple-system, sans-serif';
    }
  }, [language, dir]);

  // Nested translation resolver (e.g., t('dashboard.kpis.revenue'))
  const t = (key, variables = {}) => {
    if (!key) return '';
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English if key is not found in the target language
    if (value === undefined && language !== 'en') {
      let fallbackValue = translations['en'];
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object') {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      value = fallbackValue;
    }

    if (value === undefined) {
      return key; // return key as final fallback
    }

    if (typeof value === 'string') {
      let result = value;
      Object.keys(variables).forEach((varKey) => {
        result = result.replace(new RegExp(`{${varKey}}`, 'g'), variables[varKey]);
      });
      return result;
    }

    return typeof value === 'object' ? key : String(value);
  };

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'ar') {
      setLanguageState(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div style={{ direction: dir }} className={language === 'ar' ? 'rtl-context' : 'ltr-context'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
