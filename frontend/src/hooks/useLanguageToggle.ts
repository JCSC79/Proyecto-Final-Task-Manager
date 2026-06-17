import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { updateMeRequest } from '../api/auth.api';

/**
 * Toggles the app language between Spanish and English.
 * When the user is authenticated, persists the preference to the backend.
 * Returns the toggle function and the current language code.
 *
 * Used by: LoginPage, RegisterPage, Header
 */
export const useLanguageToggle = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const toggleLanguage = (): void => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    void i18n.changeLanguage(newLang);
    if (user) {
      void updateMeRequest('', newLang);
    }
  };

  const isSpanish = i18n.language.startsWith('es');

  return { toggleLanguage, isSpanish };
};
