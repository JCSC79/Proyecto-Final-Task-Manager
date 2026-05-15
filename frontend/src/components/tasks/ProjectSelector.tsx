import React, { useState } from 'react';
import { Button, Intent, Spinner, InputGroup, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getProjects, createProject } from '../../api/project.api';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projects = [], isLoading } = useQuery<IProject[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('projectCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setIsDialogOpen(false);
      setNewProjectName('');
      onSelect(created.id);
    },
    onError: () => {
      AppToaster.show({ message: t('projectCreateError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const handleCreate = () => {
    const trimmed = newProjectName.trim();
    if (trimmed.length < 2) {
        return;
    }
    createMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleCreate();
    }
    
    if (e.key === 'Escape') {
        setIsDialogOpen(false);
    }
  };

  return (
    <>
      <nav className={styles.bar} aria-label={t('projects')}>
        {isLoading ? (
          <Spinner size={16} />
        ) : (
          <>
            <button
              className={`${styles.chip} ${selectedProjectId === null ? styles.chipActive : ''}`}
              onClick={() => onSelect(null)}
              aria-pressed={selectedProjectId === null}
            >
              {t('allProjects')}
            </button>

            {projects.map((project) => (
              <button
                key={project.id}
                className={`${styles.chip} ${selectedProjectId === project.id ? styles.chipActive : ''}`}
                onClick={() => onSelect(project.id)}
                aria-pressed={selectedProjectId === project.id}
              >
                {project.name}
              </button>
            ))}
          </>
        )}

        <Button
          icon="plus"
          variant="solid"
          intent={Intent.PRIMARY}
          onClick={() => setIsDialogOpen(true)}
          className={styles.newBtn}
          aria-label={t('newProject')}
        >
          {t('newProject')}
        </Button>
      </nav>

      <Dialog
        isOpen={isDialogOpen}
        icon="add-application"
        onClose={() => setIsDialogOpen(false)}
        title={t('newProject')}
        style={{ width: 380 }}
      >
        <DialogBody>
          <InputGroup
            placeholder={t('projectNamePlaceholder')}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={50}
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
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
    </>
  );
};
