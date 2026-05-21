import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

/** * 1. i18next Mock
 * We maintain the same logic: returning the key name as the text.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

/** * 2. Auth Context Mock
 */
const mockAuthContext: AuthContextType = {
  login: vi.fn() as AuthContextType['login'],
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  logout: vi.fn() as AuthContextType['logout'],
  register: vi.fn() as AuthContextType['register'],
  updateName: vi.fn() as AuthContextType['updateName'],
};

describe('RegisterPage', () => {
  it('should render registration fields and the switch to login link', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <RegisterPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    /** * In your RegisterPage/AuthForm, you likely use these translation keys.
     * We check for Email, Password, and Name (since it's a registration)
     */
    const emailInput = screen.getByLabelText(/loginEmail/i);
    const passwordInput = screen.getByLabelText(/loginPassword/i);
    const nameInput = screen.getByLabelText(/registerName/i);
    
    // Check for the link to go back to login
    const loginLink = screen.getByRole('link', { name: /loginLink/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});