import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectSelector } from './ProjectSelector';
import type { IProject } from '../../types/project';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/project.api', () => ({
  getProjects: vi.fn(() => Promise.resolve([])),
  getProjectSummary: vi.fn(() => Promise.resolve({ taskCount: 0, memberCount: 0 })),
}));

// Mock the heavy sub-dialogs to keep tests focused on the chip bar
vi.mock('./ProjectFormDialog', () => ({
  ProjectFormDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="mock-project-form-dialog" /> : null,
}));

vi.mock('./ProjectManageDialog', () => ({
  ProjectManageDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="mock-manage-dialog" /> : null,
}));

// Mock the hook so mutations are controllable
const mockCreateMutate  = vi.fn();
const mockDeleteMutate  = vi.fn();
const mockJoinMutate    = vi.fn();
const mockLeaveMutate   = vi.fn();
const mockRenameMutate  = vi.fn();

vi.mock('../../hooks/useProjectActions', () => ({
  useProjectActions: () => ({
    createMutation: { mutate: mockCreateMutate, isPending: false },
    deleteMutation: { mutate: mockDeleteMutate, isPending: false },
    joinMutation:   { mutate: mockJoinMutate,   isPending: false },
    leaveMutation:  { mutate: mockLeaveMutate,  isPending: false },
    renameMutation: { mutate: mockRenameMutate, isPending: false },
  }),
}));

vi.mock('../../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Helpers

import * as projectApi from '../../api/project.api';

const makeProject = (overrides: Partial<IProject> = {}): IProject => ({
  id: 'proj-1',
  name: 'Alpha',
  userId: 'user-1',
  memberRole: 'OWNER',
  memberCount: 2,
  settings: { projectId: 'proj-1', description: null, color: '#4c90f0', isPublic: true },
  ...overrides,
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderSelector(selectedProjectId: string | null = null) {
  const onSelect = vi.fn();
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <ProjectSelector selectedProjectId={selectedProjectId} onSelect={onSelect} />
    </QueryClientProvider>
  );
  return { onSelect };
}

// Tests

describe('ProjectSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "All Projects" chip and the New Project button', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([]);
    renderSelector();
    expect(await screen.findByText('allProjects')).toBeInTheDocument();
    expect(screen.getByLabelText('newProject')).toBeInTheDocument();
  });

  it('calls onSelect(null) when the All Projects chip is clicked', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([]);
    const { onSelect } = renderSelector('proj-1');
    fireEvent.click(await screen.findByText('allProjects'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('renders a chip for each project returned by the API', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'p1', name: 'Alpha' }),
      makeProject({ id: 'p2', name: 'Beta' }),
    ]);
    renderSelector();
    expect(await screen.findByTitle('Alpha')).toBeInTheDocument();
    expect(await screen.findByTitle('Beta')).toBeInTheDocument();
  });

  it('calls onSelect with the project id when a member chip is clicked', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'proj-1', name: 'Alpha', memberRole: 'MEMBER' }),
    ]);
    const { onSelect } = renderSelector();
    fireEvent.click(await screen.findByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('proj-1');
  });

  it('shows rename and delete buttons for OWNER projects', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'proj-1', name: 'Alpha', memberRole: 'OWNER' }),
    ]);
    renderSelector();
    expect(await screen.findByLabelText('renameProject: Alpha')).toBeInTheDocument();
    expect(screen.getByLabelText('deleteProject: Alpha')).toBeInTheDocument();
  });

  it('shows leave button for MEMBER projects (no delete/rename)', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'proj-1', name: 'Beta', memberRole: 'MEMBER' }),
    ]);
    renderSelector();
    expect(await screen.findByLabelText('leaveProject: Beta')).toBeInTheDocument();
    expect(screen.queryByLabelText('deleteProject: Beta')).not.toBeInTheDocument();
  });

  it('shows a Join chip with join label for non-member public projects', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'proj-public', name: 'OpenProject', memberRole: null }),
    ]);
    renderSelector();
    expect(await screen.findByLabelText('joinProject: OpenProject')).toBeInTheDocument();
  });

  it('opens the create dialog when the New Project button is clicked', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([]);
    renderSelector();
    fireEvent.click(await screen.findByLabelText('newProject'));
    expect(screen.getByTestId('mock-project-form-dialog')).toBeInTheDocument();
  });

  it('shows the "show more" toggle when there are more than 3 projects', async () => {
    vi.mocked(projectApi.getProjects).mockResolvedValue([
      makeProject({ id: 'p1', name: 'P1' }),
      makeProject({ id: 'p2', name: 'P2' }),
      makeProject({ id: 'p3', name: 'P3' }),
      makeProject({ id: 'p4', name: 'P4' }),
    ]);
    renderSelector();
    // The hidden count is 1 (+1 label on the toggle chip)
    expect(await screen.findByText('+1')).toBeInTheDocument();
  });
});
