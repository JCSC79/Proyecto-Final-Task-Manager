import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './TaskForm';
import type { IProject } from '../../types/project';
import axiosInstance from '../../api/axiosInstance';
import * as projectApi from '../../api/project.api';


// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/axiosInstance', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 'new-task' } })) },
}));

vi.mock('../../api/project.api', () => ({
  getProjects: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../api/category.api', () => ({
  getCategories: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../api/tag.api', () => ({
  getTagsByProject: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));


// Helpers

const memberProject: IProject = {
  id: 'proj-member',
  name: 'Team Project',
  userId: 'user-1',
  memberRole: 'MEMBER',
  memberCount: 3,
  settings: { projectId: 'proj-member', description: null, color: '#4c90f0', isPublic: true },
};

const nonMemberProject: IProject = {
  id: 'proj-guest',
  name: 'Guest Project',
  userId: 'user-2',
  memberRole: null,
  memberCount: 5,
  settings: { projectId: 'proj-guest', description: null, color: '#29a634', isPublic: true },
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderForm(onSuccess = vi.fn()) {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <TaskForm onSuccess={onSuccess} />
    </QueryClientProvider>
  );
  return { onSuccess };
}

// Tests

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(projectApi.getProjects).mockResolvedValue([]);
  });

  it('renders title and description fields', () => {
    renderForm();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderForm();
    expect(screen.getByText('addTask')).toBeInTheDocument();
  });

  it('renders the priority select', () => {
    renderForm();
    expect(screen.getByLabelText('priority')).toBeInTheDocument();
  });

  it('does NOT show project selector when user has no member projects', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([nonMemberProject]);
    renderForm();
    // Wait for query to settle
    await waitFor(() => {
      expect(screen.queryByLabelText('project')).not.toBeInTheDocument();
    });
  });

  it('shows project selector only for projects where user is a member', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([memberProject, nonMemberProject]);
    renderForm();
    const select = await screen.findByLabelText('project');
    expect(select).toBeInTheDocument();
    // memberProject should appear, nonMemberProject should not
    expect(screen.getByText('Team Project')).toBeInTheDocument();
    expect(screen.queryByText('Guest Project')).not.toBeInTheDocument();
  });

  it('calls POST /api/tasks with correct payload on submit', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/title/i),       { target: { value: 'Fix bug' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Details here' } });
    fireEvent.click(screen.getByText('addTask'));
    await waitFor(() => {
      expect(vi.mocked(axiosInstance.post)).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({ title: 'Fix bug', description: 'Details here' })
      );
    });
  });

  it('calls onSuccess callback after successful task creation', async () => {
    const { onSuccess } = renderForm();
    fireEvent.change(screen.getByLabelText(/title/i),       { target: { value: 'Task X' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Description' } });
    fireEvent.click(screen.getByText('addTask'));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('does NOT submit and shows warning when title is empty', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Desc' } });
    fireEvent.click(screen.getByText('addTask'));
    await waitFor(() => {
      expect(vi.mocked(axiosInstance.post)).not.toHaveBeenCalled();
    });
  });

  it('does NOT submit when description is empty', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Title' } });
    fireEvent.click(screen.getByText('addTask'));
    await waitFor(() => {
      expect(vi.mocked(axiosInstance.post)).not.toHaveBeenCalled();
    });
  });
});
