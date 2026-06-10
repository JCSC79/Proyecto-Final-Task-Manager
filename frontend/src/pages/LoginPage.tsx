import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { useLanguageToggle } from '../hooks/useLanguageToggle';
import AuthForm from '../components/AuthForm';
import styles from './LoginRegisterPage.module.css';
import logoImg from '../assets/Logo.png';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { toggleLanguage, isSpanish } = useLanguageToggle();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; password: string }): Promise<void> => {
    setError(null);

    if (!data.email.trim() || !data.password.trim()) {
      setError(t('loginRequiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      await login(data.email.trim(), data.password);
    } catch {
      setError(t('loginError'));
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
          <p className={styles.subtitle}>{t('loginSubtitle')}</p>
        </header>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoading} />

        <footer className={styles.footer}>
          <Link to="/register" className={styles.switchLink}>
            {t('registerLink')}
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

export default LoginPage;
