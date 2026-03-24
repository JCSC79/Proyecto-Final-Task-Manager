import React, { useState } from 'react';
import { Card, Elevation, FormGroup, InputGroup, Button, Intent, H3, Icon, Divider } from "@blueprintjs/core";
import api from '../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../utils/toaster';

/**
 * Interface for API Error responses (Strict Typing)
 */
interface AuthError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface LoginViewProps {
  onLoginSuccess: (token: string) => void;
}

/**
 * LoginView Component
 * Phase 4: Manages Login and Registration with password confirmation.
 */
export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  
  // States
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Validation logic
  const passwordsMatch = !isRegistering || (password === confirmPassword && password !== '');

  /**
   * Main authentication handler
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering && !passwordsMatch) {
      AppToaster.show({ message: t('passwordsDontMatch'), intent: Intent.DANGER });
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        await api.post('/auth/register', { email, password });
        AppToaster.show({ message: t('registerSuccess'), intent: Intent.SUCCESS, icon: "user" });
        setIsRegistering(false);
        setConfirmPassword('');
      } else {
        const response = await api.post('/auth/login', { email, password });
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email); 
        onLoginSuccess(token);
        
        AppToaster.show({ message: "Welcome back!", intent: Intent.SUCCESS, icon: "log-in" });
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      const errorMessage = error.response?.data?.error || t('authError');
      AppToaster.show({ message: errorMessage, intent: Intent.DANGER, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={Elevation.FOUR} style={{ width: '400px', padding: '30px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Icon icon={isRegistering ? "user" : "shield"} size={40} intent={Intent.PRIMARY} />
        <H3 style={{ marginTop: '10px' }}>{isRegistering ? t('register') : t('appName')}</H3>
      </div>

      <form onSubmit={handleAuth}>
        <FormGroup label={t('email')} labelFor="email">
          <InputGroup id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required large leftIcon="envelope" />
        </FormGroup>
        
        <FormGroup label={t('password')} labelFor="password">
          <InputGroup id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required large leftIcon="lock" />
        </FormGroup>

        {isRegistering && (
          <FormGroup 
            label={t('confirmPassword')} 
            intent={!passwordsMatch && confirmPassword !== '' ? Intent.DANGER : Intent.NONE}
            helperText={!passwordsMatch && confirmPassword !== '' ? t('passwordsDontMatch') : ""}
          >
            <InputGroup 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              large 
              leftIcon="lock"
              intent={!passwordsMatch && confirmPassword !== '' ? Intent.DANGER : Intent.NONE}
            />
          </FormGroup>
        )}
        
        <Button 
          intent={Intent.PRIMARY} fill large type="submit" loading={loading} 
          disabled={isRegistering && !passwordsMatch}
          text={isRegistering ? t('register') : t('login')} 
        />
      </form>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ textAlign: 'center' }}>
        <Button 
          minimal 
          onClick={() => { setIsRegistering(!isRegistering); setConfirmPassword(''); }}
          text={isRegistering ? t('alreadyHaveAccount') : t('noAccount')}
        />
      </div>
    </Card>
  );
};