import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskFilters } from './TaskFilters';
import type { TaskStatus, TaskPriority, ICategory } from '../../types/task';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/axiosInstance', () => ({
  default: {
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../api/category.api', () => ({
  getCategories: vi.fn((): Promise<ICategory[]> => Promise.resolve([
    { id: 'cat-1', name: 'Work', color: '#ff0000' },
    { id: 'cat-2', name: 'Personal', color: '#00ff00' },
  ])),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Helpers

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface Props {
  searchTerm?: string;
  statusFilter?: TaskStatus | 'ALL';
  categoryId?: string | null;
  priorityFilter?: TaskPriority | 'ALL';
  onlyMyTasks?: boolean;
}

function renderFilters(overrides: Props = {}) {
  const props = {
    searchTerm: overrides.searchTerm ?? '',
    setSearchTerm: vi.fn(),
    statusFilter: overrides.statusFilter ?? 'ALL',
    setStatusFilter: vi.fn(),
    categoryId: overrides.categoryId ?? null,
    setCategoryId: vi.fn(),
    priorityFilter: overrides.priorityFilter ?? 'ALL',
    setPriorityFilter: vi.fn(),
    onlyMyTasks: overrides.onlyMyTasks ?? false,
    setOnlyMyTasks: vi.fn(),
  };

  render(
    <QueryClientProvider client={makeQueryClient()}>
      <TaskFilters {...props} />
    </QueryClientProvider>
  );

  return props;
}

// Tests

describe('TaskFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input', () => {
    renderFilters();
    expect(screen.getByRole('textbox', { name: 'search' })).toBeInTheDocument();
  });

  it('renders status filter buttons', () => {
    renderFilters();
    expect(screen.getAllByText('all').length).toBeGreaterThan(0);
    expect(screen.getAllByText('pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('inProgress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
  });

  it('calls setSearchTerm when the user types in the search box', () => {
    const { setSearchTerm } = renderFilters();
    const input = screen.getByRole('textbox', { name: 'search' });
    fireEvent.change(input, { target: { value: 'fix bug' } });
    expect(setSearchTerm).toHaveBeenCalledWith('fix bug');
  });

  it('calls setStatusFilter when a status button is clicked', () => {
    const { setStatusFilter } = renderFilters();
    // Blueprint renders the button group twice (desktop + mobile), grab the first
    fireEvent.click(screen.getAllByText('completed')[0]);
    expect(setStatusFilter).toHaveBeenCalledWith('COMPLETED');
  });

  it('calls setPriorityFilter when a priority option is selected', () => {
    const { setPriorityFilter } = renderFilters();
    const prioritySelect = screen.getByRole('combobox', { name: 'priority' });
    fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });
    expect(setPriorityFilter).toHaveBeenCalledWith('HIGH');
  });

  it('does NOT show the clear-filters button when all filters are at default', () => {
    renderFilters();
    expect(screen.queryByLabelText('clearFilters')).not.toBeInTheDocument();
  });

  it('shows the clear-filters button when a status filter is active', () => {
    renderFilters({ statusFilter: 'PENDING' });
    expect(screen.getByLabelText('clearFilters')).toBeInTheDocument();
  });

  it('shows the clear-filters button when a priority filter is active', () => {
    renderFilters({ priorityFilter: 'HIGH' });
    expect(screen.getByLabelText('clearFilters')).toBeInTheDocument();
  });

  it('shows the clear-filters button when search term is not empty', () => {
    renderFilters({ searchTerm: 'hello' });
    expect(screen.getByLabelText('clearFilters')).toBeInTheDocument();
  });

  it('shows the clear-filters button when a categoryId is set', () => {
    renderFilters({ categoryId: 'cat-1' });
    expect(screen.getByLabelText('clearFilters')).toBeInTheDocument();
  });
});
