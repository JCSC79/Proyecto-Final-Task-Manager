import React, { useState } from 'react';
import { Button, InputGroup, FormGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import styles from '../pages/RegisterPage.module.css'; // We reuse the styles for consistency

/**
 * Interface defining the Props for our universal AuthForm.
 */
interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  isLoading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  
  // Local UI state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    // Only send what's needed based on mode
    onSubmit({ 
      email, 
      password, 
      name: mode === 'register' ? name : undefined 
    });
  };

  const lockButton = (
    <Button
      icon={showPassword ? 'eye-open' : 'eye-off'}
      variant="minimal"
      onClick={() => setShowPassword(p => !p)}
      aria-label={t('togglePassword')}
    />
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {mode === 'register' && (
        <FormGroup>
          <label className={styles.fieldLabel} htmlFor="name">{t('registerName')}</label>
          <InputGroup
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('registerNamePlaceholder')}
            leftIcon="person"
            size="large"
            autoFocus // Ensures the user can start typing immediately in register mode
          />
        </FormGroup>
      )}

      <FormGroup>
        <label className={styles.fieldLabel} htmlFor="email">{t('loginEmail')}</label>
        <InputGroup
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('loginEmailPlaceholder')}
          leftIcon="envelope"
          size="large"
          autoComplete="email"
          autoFocus={mode === 'login'} // Focus email if we are just logging in
        />
      </FormGroup>

      <FormGroup>
        <label className={styles.fieldLabel} htmlFor="password">{t('loginPassword')}</label>
        <InputGroup
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('loginPasswordPlaceholder')}
          leftIcon="lock"
          rightElement={lockButton}
          size="large"
        />
      </FormGroup>

      {mode === 'register' && (
        <FormGroup>
          <label className={styles.fieldLabel} htmlFor="confirmPassword">{t('registerConfirmPassword')}</label>
          <InputGroup
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t('registerConfirmPasswordPlaceholder')}
            leftIcon="lock"
            size="large"
          />
        </FormGroup>
      )}

      <Button
        type="submit"
        intent={Intent.PRIMARY}
        loading={isLoading}
        size="large"
        className={styles.submitButton}
        text={mode === 'register' ? t('registerButton') : t('loginButton')}
      />
    </form>
  );
};

export default AuthForm;