import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomePage from './HomePage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * 1. Mock the API instance
 * We force the API to return an empty array so useQuery stays in 'success' state.
 */
vi.mock('../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

/**
 * 2. Component Mocks
 */
vi.mock('../components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/layout/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('../components/tasks/TaskFilters', () => ({
  TaskFilters: () => <div data-testid="mock-filters">Filters</div>,
}));

vi.mock('../components/tasks/TaskForm', () => ({
  TaskForm: () => <div data-testid="mock-form">Form</div>,
}));

vi.mock('../components/tasks/TaskBoard', () => ({
  TaskBoard: () => <div data-testid="mock-board">Board</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('HomePage', () => {
  it('should render the main layout and task-related sub-components after loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Check layout
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

    /**
     * Now that API is mocked to succeed, findByTestId will find the board
     * once the internal loading state finishes.
     */
    const board = await screen.findByTestId('mock-board');
    const filters = await screen.findByTestId('mock-filters');
    
    expect(board).toBeInTheDocument();
    expect(filters).toBeInTheDocument();
    // TaskForm lives inside a Dialog — only rendered when FAB is clicked, not always visible
  });
});