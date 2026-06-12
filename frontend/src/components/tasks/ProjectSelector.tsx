import React, { useState } from 'react';
import { Alert, Button, Icon, Intent, Spinner } from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  createProject, deleteProject, getProjects, joinProject, leaveProject, renameProject,
} from '../../api/project.api';
import { AppToaster } from '../../utils/toaster';
import type { IProject } from '../../types/project';
import { ProjectFormDialog } from './ProjectFormDialog';
import { ProjectManageDialog } from './ProjectManageDialog';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedProjectId, onSelect }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>(null);
  const [projectToRename, setProjectToRename] = useState<IProject | null>(null);
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [projectToJoin, setProjectToJoin] = useState<IProject | null>(null);
  const [projectToLeave, setProjectToLeave] = useState<IProject | null>(null);
  const [projectToManage, setProjectToManage] = useState<IProject | null>(null);

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
    },
    onError: () => {
      AppToaster.show({ message: t('projectRenameError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const COLLAPSE_THRESHOLD = 3;
  const visibleProjects = isBarExpanded ? projects : projects.slice(0, COLLAPSE_THRESHOLD);
  const hiddenCount = Math.max(0, projects.length - COLLAPSE_THRESHOLD);
  const showToggle = !isLoading && projects.length > COLLAPSE_THRESHOLD;

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
  };

  const handleManageClick = (e: React.MouseEvent, project: IProject) => {
    e.stopPropagation();
    setProjectToManage(project);
  };

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
                    <span className={styles.joinLabel}><Icon icon="add" size={18} />{t('joinProject')}</span>
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
                <div
                  key={project.id}
                  className={chipClass}
                  title={project.name}
                >
                  <button
                    type="button"
                    className={styles.chipSelectArea}
                    onClick={() => onSelect(project.id)}
                  >
                    <span className={styles.chipName}>{project.name}</span>
                    <span className={styles.memberBadge}>{project.memberCount}</span>
                  </button>

                  {/* OWNER — rename + manage + delete actions */}
                  {role === 'OWNER' && (
                    <>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => handleRenameClick(e, project)}
                        aria-label={`${t('renameProject')}: ${project.name}`}
                        title={t('renameProject')}
                      >
                        <Icon icon="edit" size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => handleManageClick(e, project)}
                        aria-label={`${t('manageProject')}: ${project.name}`}
                        title={t('manageProject')}
                      >
                        <Icon icon="people" size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteClick(e, project)}
                        aria-label={`${t('deleteProject')}: ${project.name}`}
                        title={t('deleteProject')}
                      >
                        <Icon icon="cross" size={18} />
                      </button>
                    </>
                  )}

                  {/* MEMBER — leave action */}
                  {role === 'MEMBER' && (
                    <button
                      type="button"
                      className={styles.leaveBtn}
                      onClick={(e) => handleLeaveClick(e, project)}
                      aria-label={`${t('leaveProject')}: ${project.name}`}
                      title={t('leaveProject')}
                    >
                      <Icon icon="log-out" size={18} />
                    </button>
                  )}
                </div>
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
                  <><Icon icon="chevron-up" size={18} />{t('showLess')}</>
                ) : (
                  <><Icon icon="chevron-down" size={18} />+{hiddenCount}</>
                )}
              </button>
            )}
          </>
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

      {/* Create / Rename dialog — same UI, parametrized by mode */}
      <ProjectFormDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        isLoading={createMutation.isPending}
        onConfirm={(name) => createMutation.mutate(name)}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <ProjectFormDialog
        mode="rename"
        isOpen={projectToRename !== null}
        currentName={projectToRename?.name ?? ''}
        isLoading={renameMutation.isPending}
        onConfirm={(name) => projectToRename && renameMutation.mutate({ id: projectToRename.id, name })}
        onClose={() => setProjectToRename(null)}
      />

      {/* Delete confirmation */}
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
        <p><strong>{projectToDelete?.name}</strong></p>
        <p>{t('deleteProjectWarning')}</p>
      </Alert>

      {/* Join confirmation */}
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
        <p><strong>{projectToJoin?.name}</strong></p>
        <p>{t('joinProjectWarning')}</p>
      </Alert>

      {/* Leave confirmation */}
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
        <p><strong>{projectToLeave?.name}</strong></p>
        <p>{t('leaveProjectWarning')}</p>
      </Alert>

      {/* Manage project dialog — OWNER only */}
      <ProjectManageDialog
        project={projectToManage}
        onClose={() => setProjectToManage(null)}
      />
    </>
  );
};
