import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskItem } from './TaskItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../contexts/AuthContext';
import type { AuthContextType } from '../../contexts/AuthContext';
import type { Task } from '../../types/task';
import type { IUser } from '../../types/user';

/**
 * 1. Setup Mocks
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../api/axiosInstance', () => ({
  default: {
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock categories API to avoid unhandled network calls
vi.mock('../../api/category.api', () => ({
  getCategories: vi.fn(() => Promise.resolve([])),
}));

// The logged-in user — userId matches mockTask.userId so isOwner = true
const mockUser: IUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'USER',
  lang: 'en',
  is_blocked: false,
  createdAt: new Date().toISOString(),
};

const mockAuthContext: AuthContextType = {
  user: mockUser,
  isAuthenticated: true,
  isAdmin: false,
  login: vi.fn(),
  register: vi.fn(),
  updateName: vi.fn(),
  logout: vi.fn(),
};

let queryClient: QueryClient;

const mockTask: Task = {
  id: 'task-123',
  title: 'Test Task',
  description: 'This is a test description',
  status: 'PENDING',
  userId: 'user-1',
  createdAt: new Date().toISOString(),
};

// Wrapper that provides all required contexts
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </AuthContext.Provider>
);

describe('TaskItem Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  });

  it('should render task title and description', () => {
    render(<TaskItem task={mockTask} />, { wrapper: Wrapper });

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should open the details dialog when clicking on the task content', async () => {
    render(<TaskItem task={mockTask} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Test Task'));

    // Wait for the dialog heading to appear (Blueprint renders via Portal)
    const dialogHeading = await screen.findByRole('heading', { name: 'taskDetails' });
    expect(dialogHeading).toBeInTheDocument();
  });

  it('should open the delete alert when clicking the trash button', async () => {
    render(<TaskItem task={mockTask} />, { wrapper: Wrapper });

    const deleteBtn = document.querySelector('.bp6-icon-trash')?.closest('button');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    expect(await screen.findByText(/deleteWarning/i)).toBeInTheDocument();
  });

  it('should show the next-status button only if the task is NOT completed', async () => {
    const completedTask: Task = { ...mockTask, status: 'COMPLETED' };

    const { rerender } = render(<TaskItem task={completedTask} />, { wrapper: Wrapper });

    // Completed task — advance button must NOT be present
    expect(document.querySelector('.bp6-icon-double-chevron-right')).toBeNull();

    // Rerender as PENDING — advance button must appear
    rerender(<TaskItem task={mockTask} />);

    await waitFor(() => {
      expect(document.querySelector('.bp6-icon-double-chevron-right')).toBeInTheDocument();
    });
  });
});