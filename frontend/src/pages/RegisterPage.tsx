import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { useLanguageToggle } from '../hooks/useLanguageToggle';
import AuthForm from '../components/AuthForm';
import styles from './LoginRegisterPage.module.css'; // Using the unified styles
import logoImg from '../assets/Logo.png';

interface ApiError {
  response?: { data?: { error?: string | string[] }; status?: number };
}

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { toggleLanguage, isSpanish } = useLanguageToggle();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (data: { email: string; password: string; name?: string }): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await register(data.email.trim(), data.password, data.name?.trim());
    } catch (err: unknown) {
      const serverError = err as ApiError;
      const status = serverError.response?.status;
      const serverMessage = serverError.response?.data?.error;

      if (status === 400 && serverMessage) {
        setError(Array.isArray(serverMessage) ? t(serverMessage[0]) : t(serverMessage));
      } else if (status === 409) {
        setError(t('registerEmailTaken'));
      } else {
        setError(t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <header className={styles.header}>
          <img src={logoImg} alt="logo" className={styles.logo} />
          <h1 className={styles.title}>{t('appName')}</h1>
          <p className={styles.subtitle}>{t('registerSubtitle')}</p>
        </header>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Reusable AuthForm for Registration mode */}
        <AuthForm mode="register" onSubmit={handleRegister} isLoading={isLoading} />

        <footer className={styles.footer}>
          <Link to="/login" className={styles.switchLink}>
            {t('loginLink')}
          </Link>
          <Button variant="minimal" size="small" onClick={toggleLanguage}>
            {isSpanish ? (
              <>
                <span className={`fi fi-es ${styles.flagIcon}`} />{' '}Español
              </>
            ) : (
              <>
                <span className={`fi fi-gb ${styles.flagIcon}`} />{' '}English
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default RegisterPage;
