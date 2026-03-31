import React, { useState } from 'react';
import { Button, InputGroup, FormGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';
import logoImg from '../assets/logo.png';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(t('loginRequiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // AppRouter will automatically redirect to / once isAuthenticated becomes true
    } catch {
      setError(t('loginError'));
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
          <p className={styles.subtitle}>{t('loginSubtitle')}</p>
        </div>

        {/* Error banner */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
              autoFocus
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
              autoComplete="current-password"
            />
          </FormGroup>

          <Button
            type="submit"
            intent={Intent.PRIMARY}
            loading={isLoading}
            large
            className={styles.submitButton}
            text={t('loginButton')}
          />
        </form>

        {/* Footer / language switcher */}
        <div className={styles.footer}>
          <Link to="/register" className={styles.switchLink}>
            {t('registerLink')}
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

export default LoginPage;
