import React, { useState } from 'react';
import { Button, InputGroup, FormGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './RegisterPage.module.css';
import logoImg from '../assets/logo.png';

/**
 * Interface to safely type the API error response without using 'any'.
 */
interface ApiError {
  response?: {
    data?: {
      error?: string | string[];
    };
    status?: number;
  };
}

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError(t('loginRequiredFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('registerPasswordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('registerPasswordsNoMatch'));
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      // AppRouter redirects to / once isAuthenticated becomes true
    } catch (err: unknown) {
      const serverError = err as ApiError;
      const status = serverError.response?.status;
      const serverMessage = serverError.response?.data?.error;

      // Logic to display specific Yup validation errors from the backend
      if (status === 400 && serverMessage) {
        if (Array.isArray(serverMessage)) {
          // If Yup returns multiple errors, show the first one
          setError(t(serverMessage[0]) || t('loginError'));
        } else {
          setError(t(serverMessage) || t('loginError'));
        }
      } else if (status === 409) {
        setError(t('registerEmailTaken'));
      } else {
        setError(t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const lockButton = (
    <Button
      icon={showPassword ? 'eye-open' : 'eye-off'}
      minimal
      onClick={() => setShowPassword(p => !p)}
      aria-label={t('togglePassword')}
    />
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <img src={logoImg} alt="logo" className={styles.logo} />
          <h1 className={styles.title}>{t('appName')}</h1>
          <p className={styles.subtitle}>{t('registerSubtitle')}</p>
        </div>

        {/* Error banner - Now displays dynamic server messages */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormGroup>
            <label className={styles.fieldLabel} htmlFor="name">
              {t('registerName')}
            </label>
            <InputGroup
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('registerNamePlaceholder')}
              leftIcon="person"
              large
              autoComplete="name"
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <label className={styles.fieldLabel} htmlFor="email">
              {t('loginEmail')}
            </label>
            <InputGroup
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('loginEmailPlaceholder')}
              leftIcon="envelope"
              large
              autoComplete="email"
            />
          </FormGroup>

          <FormGroup>
            <label className={styles.fieldLabel} htmlFor="password">
              {t('loginPassword')}
            </label>
            <InputGroup
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('loginPasswordPlaceholder')}
              leftIcon="lock"
              rightElement={lockButton}
              large
              autoComplete="new-password"
            />
          </FormGroup>

          <FormGroup>
            <label className={styles.fieldLabel} htmlFor="confirmPassword">
              {t('registerConfirmPassword')}
            </label>
            <InputGroup
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t('registerConfirmPasswordPlaceholder')}
              leftIcon="lock"
              large
              autoComplete="new-password"
            />
          </FormGroup>

          <Button
            type="submit"
            intent={Intent.PRIMARY}
            loading={isLoading}
            large
            className={styles.submitButton}
            text={t('registerButton')}
          />
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <Link to="/login" className={styles.switchLink}>
            {t('loginLink')}
          </Link>
          <Button minimal small onClick={toggleLanguage}>
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