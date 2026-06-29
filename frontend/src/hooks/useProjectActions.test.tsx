import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectActions } from './useProjectActions';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../api/project.api', () => ({
  createProject: vi.fn(() => Promise.resolve({ id: 'new-project-id', name: 'New Project' })),
  deleteProject: vi.fn(() => Promise.resolve()),
  joinProject:   vi.fn(() => Promise.resolve()),
  leaveProject:  vi.fn(() => Promise.resolve()),
  renameProject: vi.fn(() => Promise.resolve()),
}));

vi.mock('../utils/toaster', () => ({
  AppToaster: { show: vi.fn() },
}));

// Helpers

import * as projectApi from '../api/project.api';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

// Tests

describe('useProjectActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createMutation calls createProject API and triggers onSelect with new id', async () => {
    const onSelect = vi.fn();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions(null, onSelect),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.createMutation.mutateAsync({ name: 'My Project' });
    });

    expect(vi.mocked(projectApi.createProject)).toHaveBeenCalledWith('My Project', undefined);
    expect(onSelect).toHaveBeenCalledWith('new-project-id');
  });

  it('deleteMutation calls deleteProject API', async () => {
    const onSelect = vi.fn();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions(null, onSelect),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.deleteMutation.mutateAsync('proj-1');
    });

    expect(vi.mocked(projectApi.deleteProject)).toHaveBeenCalledWith('proj-1');
  });

  it('deleteMutation calls onSelect(null) when the deleted project was active', async () => {
    const onSelect = vi.fn();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions('proj-active', onSelect),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.deleteMutation.mutateAsync('proj-active');
    });

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('deleteMutation does NOT call onSelect when a different project is deleted', async () => {
    const onSelect = vi.fn();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions('proj-active', onSelect),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.deleteMutation.mutateAsync('proj-other');
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('joinMutation calls joinProject API', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions(null, vi.fn()),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.joinMutation.mutateAsync('proj-public');
    });

    expect(vi.mocked(projectApi.joinProject)).toHaveBeenCalledWith('proj-public');
  });

  it('leaveMutation calls leaveProject and onSelect(null) when leaving the active project', async () => {
    const onSelect = vi.fn();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions('proj-active', onSelect),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.leaveMutation.mutateAsync('proj-active');
    });

    expect(vi.mocked(projectApi.leaveProject)).toHaveBeenCalledWith('proj-active');
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('renameMutation calls renameProject API with id and new name', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useProjectActions(null, vi.fn()),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.renameMutation.mutateAsync({ id: 'proj-1', name: 'Renamed' });
    });

    expect(vi.mocked(projectApi.renameProject)).toHaveBeenCalledWith('proj-1', 'Renamed');
  });
});
