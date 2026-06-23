/**
 * Encapsulates all project mutations (create, delete, join, leave, rename).
 * Each mutation handles query invalidation and toaster feedback internally.
 * The caller is responsible only for dialog open/close state.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import {
  createProject, deleteProject, joinProject, leaveProject, renameProject,
} from '../api/project.api';
import { AppToaster } from '../utils/toaster';

export function useProjectActions(
  selectedProjectId: string | null,
  onSelect: (id: string | null) => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => createProject(name, color),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      onSelect(created.id);
    },
    onError: () =>
      AppToaster.show({ message: t('projectCreateError'), intent: Intent.DANGER, icon: 'warning-sign' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('projectDeleted'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      if (selectedProjectId === id) {
        onSelect(null);
      }
    },
    onError: () =>
      AppToaster.show({ message: t('projectDeleteError'), intent: Intent.DANGER, icon: 'warning-sign' }),
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => joinProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectJoined'), intent: Intent.SUCCESS, icon: 'tick-circle' });
    },
    onError: () =>
      AppToaster.show({ message: t('projectJoinError'), intent: Intent.DANGER, icon: 'warning-sign' }),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => leaveProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('projectLeft'), intent: Intent.PRIMARY, icon: 'log-out' });
      if (selectedProjectId === id) {
        onSelect(null);
      }
    },
    onError: () =>
      AppToaster.show({ message: t('projectLeaveError'), intent: Intent.DANGER, icon: 'warning-sign' }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProject(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectRenamed'), intent: Intent.SUCCESS, icon: 'tick-circle' });
    },
    onError: () =>
      AppToaster.show({ message: t('projectRenameError'), intent: Intent.DANGER, icon: 'warning-sign' }),
  });

  return { createMutation, deleteMutation, joinMutation, leaveMutation, renameMutation };
}
