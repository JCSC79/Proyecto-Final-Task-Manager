import React, { useState } from 'react';
import { Button, Dialog, DialogBody, DialogFooter, Icon, InputGroup, Intent, Switch, Tag } from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  updateProjectSettings,
} from '../../api/project.api';
import type { ProjectMember } from '../../api/project.api';
import { AppToaster } from '../../utils/toaster';
import type { IProject } from '../../types/project';
import styles from './ProjectManageDialog.module.css';

interface ProjectManageDialogProps {
  project: IProject | null;
  onClose: () => void;
}

/**
 * ProjectManageDialog — OWNER-only dialog for managing project privacy and members.
 * Owns its own data-fetching (members query) and mutations (add/remove member, update settings).
 */
export const ProjectManageDialog: React.FC<ProjectManageDialogProps> = ({ project, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [memberEmailInput, setMemberEmailInput] = useState('');
  // Local isPublic tracks the Switch optimistically so updates feel instant
  const [isPublic, setIsPublic] = useState(project?.settings.isPublic ?? true);

  // Adjust local state during render when a different project is opened.
  // This is the React-recommended alternative to useEffect for derived state.
  const [prevProjectId, setPrevProjectId] = useState<string | undefined>(project?.id);
  if (prevProjectId !== project?.id) {
    setPrevProjectId(project?.id);
    if (project) {
      setIsPublic(project.settings.isPublic);
      setMemberEmailInput('');
    }
  }

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['projectMembers', project?.id],
    queryFn: () => getProjectMembers(project!.id),
    enabled: project !== null,
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => addProjectMember(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('memberAdded'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setMemberEmailInput('');
    },
    onError: () => {
      AppToaster.show({ message: t('memberAddError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      removeProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('memberRemoved'), intent: Intent.PRIMARY, icon: 'tick-circle' });
    },
    onError: () => {
      AppToaster.show({ message: t('memberRemoveError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, newIsPublic }: { id: string; newIsPublic: boolean }) =>
      updateProjectSettings(id, { isPublic: newIsPublic }),
    onSuccess: (_, { newIsPublic }) => {
      setIsPublic(newIsPublic);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      AppToaster.show({ message: t('settingsUpdated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
    },
    onError: () => {
      // Revert optimistic local state on error
      setIsPublic(project?.settings.isPublic ?? true);
      AppToaster.show({ message: t('settingsUpdateError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const handleAddMember = () => {
    const email = memberEmailInput.trim();
    if (!project || !email) {
        return;
    }
    addMemberMutation.mutate({ id: project.id, email });
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleAddMember();
    }
  };

  const handleToggleVisibility = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) {
        return;
    }
    const newIsPublic = (e.target as HTMLInputElement).checked;
    updateSettingsMutation.mutate({ id: project.id, newIsPublic });
  };

  return (
    <Dialog
      isOpen={project !== null}
      icon="people"
      onClose={onClose}
      title={project ? `${t('manageProject')}: ${project.name}` : t('manageProject')}
      className={styles.manageDialog}
    >
      <DialogBody>
        {/* Privacy toggle */}
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>
            <Icon icon={isPublic ? 'globe' : 'lock'} size={14} />
            {isPublic ? t('publicProject') : t('privateProject')}
          </span>
          <Switch
            checked={isPublic}
            disabled={updateSettingsMutation.isPending}
            onChange={handleToggleVisibility}
            label={t('visibilityToggle')}
            innerLabelChecked={t('public')}
            innerLabel={t('private')}
          />
        </div>

        {/* Member list */}
        <p className={styles.membersHeading}>{t('membersList')}</p>
        <ul className={styles.memberList}>
          {members.map((member) => (
            <li key={member.userId} className={styles.memberItem}>
              <span className={styles.memberInfo}>
                <strong>{member.name ?? member.email}</strong>
                <span className={styles.memberEmail}>{member.email}</span>
              </span>
              <Tag minimal intent={member.role === 'OWNER' ? Intent.WARNING : Intent.NONE}>
                {member.role}
              </Tag>
              {member.role === 'MEMBER' && (
                <Button
                  icon="cross"
                  variant="minimal"
                  intent={Intent.DANGER}
                  size="small"
                  loading={removeMemberMutation.isPending}
                  onClick={() =>
                    project &&
                    removeMemberMutation.mutate({ projectId: project.id, userId: member.userId })
                  }
                  aria-label={`${t('removeMember')}: ${member.name ?? member.email}`}
                  title={t('removeMember')}
                />
              )}
            </li>
          ))}
        </ul>

        {/* Add member by email */}
        <p className={styles.membersHeading}>{t('addMember')}</p>
        <div className={styles.addMemberRow}>
          <InputGroup
            placeholder={t('addMemberPlaceholder')}
            value={memberEmailInput}
            onChange={(e) => setMemberEmailInput(e.target.value)}
            onKeyDown={handleEmailKeyDown}
            fill
            leftIcon="envelope"
            maxLength={254}
          />
          <Button
            icon="add"
            intent={Intent.PRIMARY}
            loading={addMemberMutation.isPending}
            disabled={!memberEmailInput.trim()}
            onClick={handleAddMember}
            aria-label={t('addMember')}
          />
        </div>
      </DialogBody>
      <DialogFooter actions={<Button onClick={onClose}>{t('close')}</Button>} />
    </Dialog>
  );
};
