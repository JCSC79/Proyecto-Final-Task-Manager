import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthForm from './AuthForm';

/**
 * 1. Mocks setup
 * We mock translation to use keys as identifiers.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AuthForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login mode correctly', () => {
    render(<AuthForm mode="login" onSubmit={mockOnSubmit} isLoading={false} />);

    // In login mode, name and confirm password should NOT exist
    expect(screen.queryByLabelText(/registerName/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/registerConfirmPassword/i)).not.toBeInTheDocument();
    
    // Email and password must be present
    expect(screen.getByLabelText(/loginEmail/i)).toBeInTheDocument();
    expect(screen.getByText('loginButton')).toBeInTheDocument();
  });

  it('should render register mode correctly', () => {
    render(<AuthForm mode="register" onSubmit={mockOnSubmit} isLoading={false} />);

    // In register mode, all fields must exist
    expect(screen.getByLabelText(/registerName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loginEmail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registerConfirmPassword/i)).toBeInTheDocument();
    expect(screen.getByText('registerButton')).toBeInTheDocument();
  });

  it('should toggle password visibility when clicking the eye button', () => {
    render(<AuthForm mode="login" onSubmit={mockOnSubmit} isLoading={false} />);
    
    const passwordInput = screen.getByLabelText(/loginPassword/i);
    // Blueprint uses aria-label for the button via our lockButton const
    const toggleBtn = screen.getByLabelText('togglePassword');

    // Initial state: hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide again
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSubmit with correct data in login mode', () => {
    render(<AuthForm mode="login" onSubmit={mockOnSubmit} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/loginEmail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/loginPassword/i), { target: { value: 'password123' } });
    
    //fireEvent.submit(screen.getByRole('form'));
    fireEvent.click(screen.getByText('loginButton'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: undefined // Name should be undefined in login mode
    });
  });

  it('should show loading state on the submit button', () => {
    render(<AuthForm mode="login" onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitBtn = screen.getByRole('button', { name: /loginButton/i });
    
    // Blueprint adds 'bp6-loading' class when loading prop is true
    expect(submitBtn.className).toContain('bp6-loading');
  });
});