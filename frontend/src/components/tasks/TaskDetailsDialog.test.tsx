import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import type { Task } from '../../types/task';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/task.api', () => ({
  getTaskHistory: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Helpers

const mockTask: Task = {
  id: 'task-1',
  title: 'My Task',
  description: 'Task description here',
  status: 'PENDING',
  userId: 'user-1',
  createdAt: new Date('2025-01-15T10:00:00Z').toISOString(),
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface RenderOptions {
  isOpen?: boolean;
  isOwner?: boolean;
  task?: Task;
}

function renderDialog(options: RenderOptions = {}) {
  const onClose = vi.fn();
  const onEdit = vi.fn();
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <TaskDetailsDialog
        task={options.task ?? mockTask}
        isOpen={options.isOpen ?? true}
        onClose={onClose}
        onEdit={onEdit}
        isOwner={options.isOwner ?? true}
      />
    </QueryClientProvider>
  );
  return { onClose, onEdit };
}

// Tests

describe('TaskDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with the task title', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Task')).toBeInTheDocument();
  });

  it('renders the task description in the info tab', () => {
    renderDialog();
    expect(screen.getByText('Task description here')).toBeInTheDocument();
  });

  it('shows "noDetails" placeholder when description is empty', () => {
    renderDialog({ task: { ...mockTask, description: '' } });
    expect(screen.getByText('noDetails')).toBeInTheDocument();
  });

  it('renders the Info and History tab labels', () => {
    renderDialog();
    // 'taskDetails' appears in both the dialog heading and the Info tab title
    expect(screen.getAllByText('taskDetails').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('history')).toBeInTheDocument();
  });

  it('calls onClose when the Close button is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByText('close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the Edit button when isOwner is true', () => {
    renderDialog({ isOwner: true });
    expect(screen.getByText('editTask')).toBeInTheDocument();
  });

  it('hides the Edit button when isOwner is false', () => {
    renderDialog({ isOwner: false });
    expect(screen.queryByText('editTask')).not.toBeInTheDocument();
  });

  it('calls onEdit and onClose when the Edit button is clicked', () => {
    const { onClose, onEdit } = renderDialog({ isOwner: true });
    fireEvent.click(screen.getByText('editTask'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('switches to the History tab when clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByText('history'));
    // After switching, the history panel renders (empty state = noHistory)
    expect(screen.getByText('noHistory')).toBeInTheDocument();
  });
});
