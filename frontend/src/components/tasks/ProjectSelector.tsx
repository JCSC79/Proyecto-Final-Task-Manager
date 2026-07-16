import React, { useState } from 'react';
import { Alert, Button, Icon, Intent, Spinner } from '@blueprintjs/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getProjects, getProjectSummary } from '../../api/project.api';
import type { ProjectSummary } from '../../api/project.api';
import type { IProject } from '../../types/project';
import { useProjectActions } from '../../hooks/useProjectActions';
import { ProjectFormDialog } from './ProjectFormDialog';
import { ProjectManageDialog } from './ProjectManageDialog';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedProjectId, onSelect }) => {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<ProjectSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [projectToRename, setProjectToRename] = useState<IProject | null>(null);
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [projectToJoin, setProjectToJoin] = useState<IProject | null>(null);
  const [projectToLeave, setProjectToLeave] = useState<IProject | null>(null);
  const [projectToManage, setProjectToManage] = useState<IProject | null>(null);
  const [sortMode, setSortMode] = useState<'recent' | 'alpha'>('recent');

  const { data: projects = [], isLoading } = useQuery<IProject[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { createMutation, deleteMutation, joinMutation, leaveMutation, renameMutation } =
    useProjectActions(selectedProjectId, onSelect);

  const sortedProjects = sortMode === 'alpha'
    ? [...projects].sort((a, b) => a.name.localeCompare(b.name))
    : projects;

  const COLLAPSE_THRESHOLD = 3;
  const visibleProjects = isBarExpanded ? sortedProjects : sortedProjects.slice(0, COLLAPSE_THRESHOLD);
  const hiddenCount = Math.max(0, sortedProjects.length - COLLAPSE_THRESHOLD);
  const showToggle = !isLoading && sortedProjects.length > COLLAPSE_THRESHOLD;

  const handleDeleteClick = async (e: React.MouseEvent, project: IProject) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteSummary(null);
    setIsSummaryLoading(true);
    try {
      const summary = await getProjectSummary(project.id);
      setDeleteSummary(summary);
    } finally {
      setIsSummaryLoading(false);
    }
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
                    <span className={styles.joinLabel}><Icon icon="follower" size={18} />{t('joinProject')}</span>
                  </button>
                );
              }

              // Member or Owner: colored chip
              const chipClass = [
                styles.chip,
                styles.chipMember,
                isActive ? styles.chipMemberActive : '',
              ].filter(Boolean).join(' ');

              // Tooltip: for members, append who the owner is
              let chipTitle = project.name;
              if (role === 'MEMBER' && project.ownerName) {
                chipTitle = `${project.name} — ${t('projectOwnedBy', { name: project.ownerName })}`;
              }

              return (
                <div
                  key={project.id}
                  className={chipClass}
                  title={chipTitle}
                >
                  <button
                    type="button"
                    className={styles.chipSelectArea}
                    onClick={() => onSelect(project.id)}
                  >
                    {project.settings?.color && (
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: project.settings.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.chipName}>{project.name}</span>
                    <span className={`${styles.roleLabel} ${role === 'OWNER' ? styles.roleLabelOwner : styles.roleLabelMember}`}>
                      {role === 'OWNER' ? t('projectOwnerLabel') : t('projectMemberLabel')}
                    </span>
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
          icon={sortMode === 'alpha' ? 'sort-alphabetical' : 'sort-desc'}
          variant="minimal"
          onClick={() => setSortMode(m => m === 'recent' ? 'alpha' : 'recent')}
          className={styles.sortBtn}
          title={sortMode === 'alpha' ? t('sortRecent') : t('sortAlpha')}
          aria-label={sortMode === 'alpha' ? t('sortRecent') : t('sortAlpha')}
        />

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
        onConfirm={(name, color) => createMutation.mutate(
          { name, color }, 
          { onSuccess: () => setIsCreateDialogOpen(false) }
        )}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <ProjectFormDialog
        mode="rename"
        isOpen={projectToRename !== null}
        currentName={projectToRename?.name ?? ''}
        isLoading={renameMutation.isPending}
        onConfirm={(name) => projectToRename && renameMutation.mutate(
          { id: projectToRename.id, name }, 
          { onSuccess: () => setProjectToRename(null), 
            onError: () => setProjectToRename(null) }
        )}
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
        onConfirm={() => projectToDelete && deleteMutation.mutate(
          projectToDelete.id, 
          { onSuccess: () => { setProjectToDelete(null); setDeleteSummary(null); }, 
            onError: () => { setProjectToDelete(null); setDeleteSummary(null); } }
          )}
        onCancel={() => { setProjectToDelete(null); setDeleteSummary(null); }}
      >
        <p><strong>{projectToDelete?.name}</strong></p>
        <p>{t('deleteProjectWarning')}</p>
        {isSummaryLoading && <Spinner size={16} />}
        {deleteSummary && (
          <ul className={styles.deleteSummaryList}>
            <li>{t('deleteProjectWarningTasks')} <strong>{deleteSummary.taskCount}</strong></li>
            <li>{t('deleteProjectWarningMembers')} <strong>{deleteSummary.memberCount}</strong></li>
            {deleteSummary.memberCount > 0 && (
              <li className={styles.deleteSummaryNote}>{t('deleteProjectNotifyNote')}</li>
            )}
          </ul>
        )}
      </Alert>

      {/* Join confirmation */}
      <Alert
        isOpen={projectToJoin !== null}
        intent={Intent.PRIMARY}
        icon="add"
        confirmButtonText={t('joinProjectConfirm')}
        cancelButtonText={t('cancel')}
        loading={joinMutation.isPending}
        onConfirm={() => projectToJoin && joinMutation.mutate(
          projectToJoin.id, 
          { onSuccess: () => setProjectToJoin(null), 
            onError: () => setProjectToJoin(null) }
          )}
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
        onConfirm={() => projectToLeave && leaveMutation.mutate(
          projectToLeave.id, 
          { onSuccess: () => setProjectToLeave(null), 
            onError: () => setProjectToLeave(null) }
          )}
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
