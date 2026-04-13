import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm'; // New modular component
import styles from './RegisterPage.module.css';
import logoImg from '../assets/Logo.png';

interface ApiError {
  response?: { data?: { error?: string | string[] }; status?: number; };
}

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (data: { email: string; password: string; name?: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      await register(data.email.trim(), data.password, data.name?.trim());
    } catch (err: unknown) {
      const serverError = err as ApiError;
      const status = serverError.response?.status;
      const serverMessage = serverError.response?.data?.error;

      // Handle Yup validation errors from server
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
        <div className={styles.header}>
          <img src={logoImg} alt="logo" className={styles.logo} />
          <h1 className={styles.title}>{t('appName')}</h1>
          <p className={styles.subtitle}>{t('registerSubtitle')}</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Modular form component to keep the page clean */}
        <AuthForm mode="register" onSubmit={handleRegister} isLoading={isLoading} />

        <div className={styles.footer}>
          <Link to="/login" className={styles.switchLink}>{t('loginLink')}</Link>
          <Button minimal small onClick={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}>
            {i18n.language.startsWith('es')
              ? <><span className="fi fi-es" style={{ marginRight: 5 }} />Español</>
              : <><span className="fi fi-gb" style={{ marginRight: 5 }} />English</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;