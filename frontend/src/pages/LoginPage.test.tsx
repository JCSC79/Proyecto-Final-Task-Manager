import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

/** * 1. Improved i18next Mock
 * Since we mock 't' to return the key name, screen will look for "loginEmail", etc.
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

describe('LoginPage', () => {
  it('should render email, password fields and the login button', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    /** * We search for the exact translation keys used in LoginPage.tsx
     * because our mock returns the key itself.
     */
    const emailInput = screen.getByLabelText(/loginEmail/i);
    const passwordInput = screen.getByLabelText(/loginPassword/i);
    
    // In BlueprintJS, buttons with the 'text' prop render that text inside
    const loginButton = screen.getByRole('button', { name: /loginButton/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });
});