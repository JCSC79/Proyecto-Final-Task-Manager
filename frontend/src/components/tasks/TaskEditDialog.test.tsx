import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskEditDialog } from './TaskEditDialog';
import type { Task } from '../../types/task';
import axiosInstance from '../../api/axiosInstance';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/axiosInstance', () => ({
  default: { patch: vi.fn(() => Promise.resolve({ data: {} })) },
}));

vi.mock('../../api/category.api', () => ({
  getCategories: vi.fn(() => Promise.resolve([
    { id: 'cat-1', name: 'Work', color: '#ff0000' },
  ])),
}));

vi.mock('../../api/tag.api', () => ({
  getTagsByProject: vi.fn(() => Promise.resolve([])),
  assignTag: vi.fn(() => Promise.resolve()),
  unassignTag: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Helpers

const mockTask: Task = {
  id: 'task-1',
  title: 'Original title',
  description: 'Original description',
  status: 'PENDING',
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  priority: 'MEDIUM',
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  isOpen?: boolean;
  task?: Task;
}

function renderDialog(options: RenderOptions = {}) {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <TaskEditDialog
        task={options.task ?? mockTask}
        isOpen={options.isOpen ?? true}
        onClose={onClose}
      />
    </QueryClientProvider>
  );
  return { onClose };
}

// Tests

describe('TaskEditDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog when isOpen is true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('pre-fills the title input with the task title', () => {
    renderDialog();
    const titleInput = screen.getByDisplayValue('Original title');
    expect(titleInput).toBeInTheDocument();
  });

  it('pre-fills the description textarea with the task description', () => {
    renderDialog();
    expect(screen.getByDisplayValue('Original description')).toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByText('cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls the PATCH API with updated title when Save is clicked', async () => {
    renderDialog();
    const titleInput = screen.getByDisplayValue('Original title');
    fireEvent.change(titleInput, { target: { value: 'Updated title' } });
    fireEvent.click(screen.getByText('saveChanges'));
    await waitFor(() => {
      expect(vi.mocked(axiosInstance.patch)).toHaveBeenCalledWith(
        '/api/tasks/task-1',
        expect.objectContaining({ title: 'Updated title' })
      );
    });
  });

  it('renders the priority select pre-filled with the task priority', async () => {
    renderDialog();
    const prioritySelect = await screen.findByDisplayValue('MEDIUM');
    expect(prioritySelect).toBeInTheDocument();
  });

  it('updates priority when a new option is selected', async () => {
    renderDialog();
    const prioritySelect = await screen.findByRole('combobox', { name: /priority/i });
    fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });
    expect(prioritySelect).toHaveValue('HIGH');
  });
});
