import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';
import { BrowserRouter } from 'react-router-dom';

/**
 * 1. Mocks for Hooks and Utils
 */
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

const mockLogout = vi.fn();
const mockUpdateName = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', name: 'Test User', role: 'USER' },
    isAdmin: false,
    logout: mockLogout,
    updateName: mockUpdateName,
  }),
}));

vi.mock('../../utils/gravatar', () => ({
  gravatarUrl: vi.fn(() => Promise.resolve('https://gravatar.com/avatar/mock')),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('Header Component', () => {
  const mockSetActiveView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to wrap render in act and Router
  const renderHeader = async (props = {}) => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Header 
            progress={0.5} 
            activeView="home" 
            setActiveView={mockSetActiveView} 
            {...props} 
          />
        </BrowserRouter>
      );
    });
  };

  it('should render the app name and user info without act warnings', async () => {
    await renderHeader();

    expect(screen.getByText('appName')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show the progress percentage correctly', async () => {
    await renderHeader({ progress: 0.75 });

    // 0.75 * 100 = 75% — verify via the progressbar's aria-valuenow attribute
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('should call setActiveView when clicking navigation buttons', async () => {
    await renderHeader();

    const dashboardBtn = screen.getByText('dashboard');
    fireEvent.click(dashboardBtn);

    expect(mockSetActiveView).toHaveBeenCalledWith('dashboard');
  });

  it('should open the edit profile dialog when clicking the avatar button', async () => {
    await renderHeader();

    // The header renders two avatar buttons (desktop + mobile).
    // We target the first one (desktop) to open the edit profile dialog.
    const avatarBtns = screen.getAllByLabelText('editProfileTitle');
    const avatarBtn = avatarBtns[0];
    
    await act(async () => {
      fireEvent.click(avatarBtn);
    });

    // Check if dialog title appears (it's a portal, so we wait)
    expect(await screen.findByText('editProfileName')).toBeInTheDocument();
  });

  it('should call logout when clicking the logout button', async () => {
    await renderHeader();

    // Use CSS selector to find the logout button via Blueprint icon class
    const logoutBtn = document.querySelector('.bp6-icon-log-out')?.closest('button');
    
    if (logoutBtn) {
      fireEvent.click(logoutBtn);
    }
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
