import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskBoard } from './TaskBoard';
import type { Task } from '../../types/task';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/axiosInstance', () => ({
  default: { patch: vi.fn(() => Promise.resolve({ data: {} })) },
}));

vi.mock('../../api/category.api', () => ({
  getCategories: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Mock dnd-kit — tests focus on rendering, not drag behaviour
vi.mock('@dnd-kit/core', () => ({
  DndContext:    ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay:  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useSensor:    vi.fn(() => ({})),
  useSensors:   vi.fn(() => []),
  PointerSensor: {},
  closestCorners: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext:        ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {}, listeners: {}, setNodeRef: vi.fn(),
    transform: null, transition: null, isDragging: false,
  }),
}));

// Mock TaskItem to keep tests focused on board structure
vi.mock('./TaskItem', () => ({
  TaskItem: ({ task }: { task: Task }) => (
    <div data-testid={`task-item-${task.id}`}>{task.title}</div>
  ),
}));

// Helpers

const makeTask = (id: string, status: Task['status'], title: string): Task => ({
  id,
  title,
  description: '',
  status,
  userId: 'user-1',
  createdAt: new Date().toISOString(),
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderBoard(tasks: Task[], statusFilter: Task['status'] | 'ALL' = 'ALL') {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <TaskBoard tasks={tasks} statusFilter={statusFilter} />
    </QueryClientProvider>
  );
}

// Tests

describe('TaskBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders three column headings', () => {
    renderBoard([]);
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('inProgress')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders empty state in a column with no tasks', () => {
    renderBoard([]);
    // All three columns are empty → three "noTasks" placeholders
    expect(screen.getAllByText('noTasks')).toHaveLength(3);
  });

  it('renders a task in the correct column', () => {
    const tasks = [makeTask('t1', 'PENDING', 'Buy milk')];
    renderBoard(tasks);
    expect(screen.getByTestId('task-item-t1')).toBeInTheDocument();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('places tasks in their respective columns', () => {
    const tasks = [
      makeTask('t1', 'PENDING',     'Task A'),
      makeTask('t2', 'IN_PROGRESS', 'Task B'),
      makeTask('t3', 'COMPLETED',   'Task C'),
    ];
    renderBoard(tasks);
    expect(screen.getByTestId('task-item-t1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-t2')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-t3')).toBeInTheDocument();
  });

  it('shows correct task count per column', () => {
    const tasks = [
      makeTask('t1', 'PENDING', 'A'),
      makeTask('t2', 'PENDING', 'B'),
      makeTask('t3', 'COMPLETED', 'C'),
    ];
    renderBoard(tasks);
    // "(2)" for PENDING column and "(1)" for COMPLETED column
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('shows sort buttons for each column', () => {
    renderBoard([]);
    // Each column has a sort button
    const sortButtons = screen.getAllByLabelText('sortNewest');
    expect(sortButtons).toHaveLength(3);
  });

  it('renders pagination controls per column', () => {
    renderBoard([]);
    const prevButtons = screen.getAllByLabelText('prev');
    const nextButtons = screen.getAllByLabelText('next');
    expect(prevButtons).toHaveLength(3);
    expect(nextButtons).toHaveLength(3);
  });
});
