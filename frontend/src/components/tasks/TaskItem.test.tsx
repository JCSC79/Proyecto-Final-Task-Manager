import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskItem } from './TaskItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Task } from '../../types/task';

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

// We define queryClient outside but refresh it in beforeEach
let queryClient: QueryClient;

const mockTask: Task = {
  id: 'task-123',
  title: 'Test Task',
  description: 'This is a test description',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
};

describe('TaskItem Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { 
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false }
      },
    });
  });

  it('should render task title and description', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskItem task={mockTask} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should open the details dialog when clicking on the task content', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskItem task={mockTask} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText('Test Task'));

    // We use findByText (async) to wait for the Portal/Dialog to render
    expect(await screen.findByText('taskDetails')).toBeInTheDocument();
  });

  it('should open the delete alert when clicking the trash button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskItem task={mockTask} />
      </QueryClientProvider>
    );

    // Finding buttons in Blueprint can be tricky, we use the icon class as a hint
    const deleteBtn = document.querySelector('.bp6-icon-trash')?.closest('button');
    if (deleteBtn) fireEvent.click(deleteBtn);

    expect(await screen.findByText(/deleteWarning/i)).toBeInTheDocument();
  });

  it('should show the next-status button only if the task is NOT completed', async () => {
    const completedTask: Task = { ...mockTask, status: 'COMPLETED' };
    
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TaskItem task={completedTask} />
      </QueryClientProvider>
    );

    // Check it's NOT there
    expect(document.querySelector('.bp6-icon-double-chevron-right')).toBeNull();

    // Rerender as PENDING
    rerender(
      <QueryClientProvider client={queryClient}>
        <TaskItem task={mockTask} />
      </QueryClientProvider>
    );

    // Check it IS there
    await waitFor(() => {
      expect(document.querySelector('.bp6-icon-double-chevron-right')).toBeInTheDocument();
    });
  });
});