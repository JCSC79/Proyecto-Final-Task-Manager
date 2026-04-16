import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminPage from './AdminPage';
import { BrowserRouter } from 'react-router-dom';

/** * 1. Mocks for sub-components
 * Since AdminPage is a container, we mock the sub-components 
 * to ensure they are called without testing their internal logic here.
 */
vi.mock('../components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/layout/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('../components/admin/AdminDashboard', () => ({
  AdminDashboard: () => <div data-testid="mock-admin-dashboard">Admin Dashboard</div>,
}));

/** * 2. Mock for i18next (just in case, though not directly used in this file, 
 * sub-components might need it if they weren't mocked)
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminPage', () => {
  it('should render the admin layout with header, dashboard, and footer', () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Check if the main structure is present using the test IDs
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-admin-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });
});