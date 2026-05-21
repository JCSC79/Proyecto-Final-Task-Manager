import React, { useState } from 'react';
import { Button, Intent, Spinner, InputGroup, Dialog, DialogBody, DialogFooter, Alert, Icon } from '@blueprintjs/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getProjects, createProject, deleteProject, joinProject, leaveProject, renameProject } from '../../api/project.api';
import { AppToaster } from '../../utils/toaster';
import type { IProject } from '../../types/project';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedProjectId, onSelect }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>(null);
  const [projectToRename, setProjectToRename] = useState<IProject | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [projectToJoin, setProjectToJoin] = useState<IProject | null>(null);
  const [projectToLeave, setProjectToLeave] = useState<IProject | null>(null);

  const { data: projects = [], isLoading } = useQuery<IProject[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      onSelect(created.id);
    },
    onError: () => {
      AppToaster.show({ message: t('projectCreateError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('projectDeleted'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      if (selectedProjectId === projectToDelete?.id) {
        onSelect(null);
      }
      setProjectToDelete(null);
    },
    onError: () => {
      AppToaster.show({ message: t('projectDeleteError'), intent: Intent.DANGER, icon: 'warning-sign' });
      setProjectToDelete(null);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => joinProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectJoined'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setProjectToJoin(null);
    },
    onError: () => {
      AppToaster.show({ message: t('projectJoinError'), intent: Intent.DANGER, icon: 'warning-sign' });
      setProjectToJoin(null);
    },
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
      setProjectToLeave(null);
    },
    onError: () => {
      AppToaster.show({ message: t('projectLeaveError'), intent: Intent.DANGER, icon: 'warning-sign' });
      setProjectToLeave(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProject(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectRenamed'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setProjectToRename(null);
      setRenameValue('');
    },
    onError: () => {
      AppToaster.show({ message: t('projectRenameError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const handleCreate = () => {
    const trimmed = newProjectName.trim();
    if (trimmed.length < 2) {
      return;
    }
    createMutation.mutate(trimmed);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewProjectName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
    if (e.key === 'Escape') {
      handleCloseCreateDialog();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: IProject) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const handleLeaveClick = (e: React.MouseEvent, project: IProject) => {
    e.stopPropagation();
    setProjectToLeave(project);
  };

  const handleRenameClick = (e: React.MouseEvent, project: IProject) => {
    e.stopPropagation();
    setProjectToRename(project);
    setRenameValue(project.name);
  };

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!projectToRename || trimmed.length < 2) {
      return;
    }
    renameMutation.mutate({ id: projectToRename.id, name: trimmed });
  };

  const handleCloseRenameDialog = () => {
    setProjectToRename(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    }

    if (e.key === 'Escape') {
      handleCloseRenameDialog();
    }
  };

  const COLLAPSE_THRESHOLD = 3;
  const visibleProjects = isBarExpanded ? projects : projects.slice(0, COLLAPSE_THRESHOLD);
  const hiddenCount = Math.max(0, projects.length - COLLAPSE_THRESHOLD);
  const showToggle = !isLoading && projects.length > COLLAPSE_THRESHOLD;

  return (
    <>
      <nav className={styles.bar} aria-label={t('projects')}>
        {isLoading ? (
          <Spinner size={16} />
        ) : (
          <>
            {/* "All Projects" chip */}
            <button
              className={`${styles.chip} ${selectedProjectId === null ? styles.chipActive : ''}`}
              onClick={() => onSelect(null)}
            >
              {t('allProjects')}
            </button>

            {visibleProjects.map((project) => {
              const role = project.memberRole;
              const isActive = selectedProjectId === project.id;

              // Non-member: dashed guest chip with Join button
              if (role === null) {
                return (
                  <button
                    key={project.id}
                    className={`${styles.chip} ${styles.chipGuest}`}
                    onClick={() => setProjectToJoin(project)}
                    aria-label={`${t('joinProject')}: ${project.name}`}
                    disabled={joinMutation.isPending}
                    title={project.name}
                  >
                    <span className={styles.chipName}>{project.name}</span>
                    <span className={styles.memberBadge}>{project.memberCount}</span>
                    <span className={styles.joinLabel}><Icon icon="add" size={15} />{t('joinProject')}</span>
                  </button>
                );
              }

              // Member or Owner: colored chip
              const chipClass = [
                styles.chip,
                styles.chipMember,
                isActive ? styles.chipMemberActive : '',
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={project.id}
                  className={chipClass}
                  onClick={() => onSelect(project.id)}
                  title={project.name}
                >
                  <span className={styles.chipName}>{project.name}</span>
                  <span className={styles.memberBadge}>{project.memberCount}</span>

                  {/* OWNER - rename + delete buttons */}
                  {role === 'OWNER' && (
                    <>
                      <span
                        role="button"
                        className={styles.editBtn}
                        onClick={(e) => handleRenameClick(e, project)}
                        aria-label={`${t('renameProject')}: ${project.name}`}
                        title={t('renameProject')}
                      >
                        <Icon icon="edit" size={16} />
                      </span>
                      <span
                        role="button"
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteClick(e, project)}
                        aria-label={`${t('deleteProject')}: ${project.name}`}
                        title={t('deleteProject')}
                      >
                        <Icon icon="cross" size={16} />
                      </span>
                    </>
                  )}

                  {/* MEMBER - leave button */}
                  {role === 'MEMBER' && (
                    <span
                      role="button"
                      className={styles.leaveBtn}
                      onClick={(e) => handleLeaveClick(e, project)}
                      aria-label={`${t('leaveProject')}: ${project.name}`}
                      title={t('leaveProject')}
                    >
                      <Icon icon="log-out" size={16} />
                    </span>
                  )}
                </button>
              );
            })}
            {/* Show more / show less toggle */}
            {showToggle && (
              <button
                className={`${styles.chip} ${styles.chipToggle}`}
                onClick={() => setIsBarExpanded(!isBarExpanded)}
                aria-label={isBarExpanded ? t('showLess') : `+${hiddenCount}`}
              >
                {isBarExpanded ? (
                  <><Icon icon="chevron-up" size={16} />{t('showLess')}</>
                ) : (
                  <><Icon icon="chevron-down" size={16} />+{hiddenCount}</>
                )}
              </button>
            )}          </>
        )}

        <Button
          icon="plus"
          variant="solid"
          intent={Intent.PRIMARY}
          onClick={() => setIsCreateDialogOpen(true)}
          className={styles.newBtn}
          aria-label={t('newProject')}
        >
          {t('newProject')}
        </Button>
      </nav>

      {/* Create project dialog */}
      <Dialog
        isOpen={isCreateDialogOpen}
        icon="add-application"
        onClose={handleCloseCreateDialog}
        title={t('newProject')}
        className={styles.createDialog}
      >
        <DialogBody>
          <InputGroup
            placeholder={t('projectNamePlaceholder')}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={50}
            rightElement={
              newProjectName.length > 0 ? (
                <Button variant='minimal' icon="cross" onClick={() => setNewProjectName('')} tabIndex={-1} aria-label="Clear" />
              ) : undefined
            }
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={handleCloseCreateDialog}>{t('cancel')}</Button>
              <Button
                intent={Intent.PRIMARY}
                onClick={handleCreate}
                loading={createMutation.isPending}
                disabled={newProjectName.trim().length < 2}
              >
                {t('create')}
              </Button>
            </>
          }
        />
      </Dialog>

      {/* Rename project dialog */}
      <Dialog
        isOpen={projectToRename !== null}
        icon="edit"
        onClose={handleCloseRenameDialog}
        title={t('renameProject')}
        className={styles.createDialog}
      >
        <DialogBody>
          <InputGroup
            placeholder={t('renameProjectPlaceholder')}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            autoFocus
            maxLength={50}
            rightElement={
              renameValue.length > 0 ? (
                <Button variant="minimal" icon="cross" onClick={() => setRenameValue('')} tabIndex={-1} aria-label="Clear" />
              ) : undefined
            }
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={handleCloseRenameDialog}>{t('cancel')}</Button>
              <Button
                intent={Intent.PRIMARY}
                onClick={handleRename}
                loading={renameMutation.isPending}
                disabled={renameValue.trim().length < 2 || renameValue.trim() === projectToRename?.name}
              >
                {t('save')}
              </Button>
            </>
          }
        />
      </Dialog>

      {/* Delete project confirmation alert */}
      <Alert
        isOpen={projectToDelete !== null}
        intent={Intent.DANGER}
        icon="trash"
        confirmButtonText={t('deleteProjectConfirm')}
        cancelButtonText={t('cancel')}
        loading={deleteMutation.isPending}
        onConfirm={() => projectToDelete && deleteMutation.mutate(projectToDelete.id)}
        onCancel={() => setProjectToDelete(null)}
      >
        <p>
          <strong>{projectToDelete?.name}</strong>
        </p>
        <p>{t('deleteProjectWarning')}</p>
      </Alert>

      {/* Join project confirmation alert */}
      <Alert
        isOpen={projectToJoin !== null}
        intent={Intent.PRIMARY}
        icon="add"
        confirmButtonText={t('joinProjectConfirm')}
        cancelButtonText={t('cancel')}
        loading={joinMutation.isPending}
        onConfirm={() => projectToJoin && joinMutation.mutate(projectToJoin.id)}
        onCancel={() => setProjectToJoin(null)}
      >
        <p>
          <strong>{projectToJoin?.name}</strong>
        </p>
        <p>{t('joinProjectWarning')}</p>
      </Alert>

      {/* Leave project confirmation alert */}
      <Alert
        isOpen={projectToLeave !== null}
        intent={Intent.WARNING}
        icon="log-out"
        confirmButtonText={t('leaveProjectConfirm')}
        cancelButtonText={t('cancel')}
        loading={leaveMutation.isPending}
        onConfirm={() => projectToLeave && leaveMutation.mutate(projectToLeave.id)}
        onCancel={() => setProjectToLeave(null)}
      >
        <p>
          <strong>{projectToLeave?.name}</strong>
        </p>
        <p>{t('leaveProjectWarning')}</p>
      </Alert>
    </>
  );
};
