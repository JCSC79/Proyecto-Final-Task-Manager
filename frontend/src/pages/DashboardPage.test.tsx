import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Create a fresh QueryClient for each test
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Prevents Vitest from waiting for timeouts
    },
  },
});

// 2. Mock sub-components to keep the test focused on the Page
vi.mock('../components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/layout/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('../components/dashboard/DashboardView', () => ({
  DashboardView: () => <div data-testid="mock-dashboard-view">Dashboard Content</div>,
}));

describe('DashboardPage', () => {
  afterEach(cleanup);
  
  it('should render the dashboard layout and sub-components', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify layout structure
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dashboard-view')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });
});