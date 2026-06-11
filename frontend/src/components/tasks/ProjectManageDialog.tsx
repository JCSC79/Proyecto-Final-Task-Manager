import React, { useState } from 'react';
import { Alert, Button, Dialog, DialogBody, DialogFooter, Icon, InputGroup, Intent, Switch, Tag } from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  updateProjectSettings,
} from '../../api/project.api';
import type { ProjectMember } from '../../api/project.api';
import { getTagsByProject, createTag, deleteTag } from '../../api/tag.api';
import type { ITagWithTaskCount } from '../../api/tag.api';
import { TagBadge } from './TagBadge';
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
  const [newTagName, setNewTagName] = useState('');
  // Restricted to the 4 Blueprint-intent hex values so TagBadge always maps correctly
  const [newTagColor, setNewTagColor] = useState('#2980b9');
  const [tagToDelete, setTagToDelete] = useState<ITagWithTaskCount | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
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
      setNewTagName('');
      setNewTagColor('#2980b9');
      setTagToDelete(null);
      setMemberToRemove(null);
    }
  }

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['projectMembers', project?.id],
    queryFn: () => getProjectMembers(project!.id),
    enabled: project !== null,
  });

  const { data: projectTags = [] } = useQuery<ITagWithTaskCount[]>({
    queryKey: ['tags', project?.id],
    queryFn: () => getTagsByProject(project!.id),
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

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      createTag(project!.id, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', project?.id] });
      AppToaster.show({ message: t('tagCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      setNewTagName('');
      setNewTagColor('#2980b9');
    },
    onError: () => {
      AppToaster.show({ message: t('tagCreateError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(project!.id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', project?.id] });
      AppToaster.show({ message: t('tagDeleted'), intent: Intent.PRIMARY, icon: 'tick-circle' });
    },
    onError: () => {
      AppToaster.show({ message: t('tagDeleteError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!project || !name) {
      return;
    }
    createTagMutation.mutate({ name, color: newTagColor });
  };

  const handleTagNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    }
  };

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
    const newIsPublic = e.target.checked;
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
                  onClick={() => setMemberToRemove(member)}
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

        {/* Tags section */}
        <p className={styles.membersHeading}>{t('tags')}</p>
        {projectTags.length === 0 ? (
          <p className={styles.emptyHint}>{t('noTags')}</p>
        ) : (
          <ul className={styles.tagList}>
            {projectTags.map((tag) => (
              <li key={tag.id} className={styles.tagRow}>
                <TagBadge tag={tag} />
                {tag.taskCount > 0 && (
                  <span className={styles.tagCount}>×{tag.taskCount}</span>
                )}
                <Button
                  icon="cross"
                  variant="minimal"
                  intent={Intent.DANGER}
                  size="small"
                  onClick={() => setTagToDelete(tag)}
                  aria-label={`${t('deleteTag')}: ${tag.name}`}
                  title={t('deleteTag')}
                />
              </li>
            ))}
          </ul>
        )}
        <div className={styles.addTagRow}>
          <InputGroup
            placeholder={t('tagNamePlaceholder')}
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleTagNameKeyDown}
            fill
            leftIcon="tag"
            maxLength={30}
          />
          <fieldset className={styles.colorSwatches} aria-label={t('tagColor')}>
            {([
              { hex: '#2980b9', intent: 'primary'  as const },
              { hex: '#27ae60', intent: 'success'  as const },
              { hex: '#c0a828', intent: 'warning'  as const },
              { hex: '#e74c3c', intent: 'danger'   as const },
            ]).map(({ hex, intent }) => (
              <Button
                key={hex}
                intent={intent}
                variant={newTagColor === hex ? 'outlined' : 'minimal'}
                size="small"
                icon="full-circle"
                onClick={() => setNewTagColor(hex)}
                aria-label={intent}
                aria-pressed={newTagColor === hex}
                title={intent}
              />
            ))}
          </fieldset>
          <Button
            icon="add"
            intent={Intent.PRIMARY}
            loading={createTagMutation.isPending}
            disabled={!newTagName.trim()}
            onClick={handleCreateTag}
            aria-label={t('addTag')}
            title={t('addTag')}
          />
        </div>
      </DialogBody>
      <DialogFooter actions={<Button onClick={onClose}>{t('close')}</Button>} />

      {/* Tag delete confirmation */}
      <Alert
        isOpen={tagToDelete !== null}
        icon="tag"
        intent={Intent.DANGER}
        confirmButtonText={t('deleteTag')}
        cancelButtonText={t('cancel')}
        loading={deleteTagMutation.isPending}
        onCancel={() => setTagToDelete(null)}
        onConfirm={() => {
          if (tagToDelete) deleteTagMutation.mutate(tagToDelete.id);
          setTagToDelete(null);
        }}
      >
        <p>
          {t('deleteTagWarning')} <b>{tagToDelete?.name}</b>.
          {(tagToDelete?.taskCount ?? 0) > 0 && (
            <> {t('deleteTagUsedIn')} {tagToDelete?.taskCount} {t('task(s)')}.</>
          )}
        </p>
      </Alert>

      {/* Member remove confirmation */}
      <Alert
        isOpen={memberToRemove !== null}
        icon="person"
        intent={Intent.WARNING}
        confirmButtonText={t('removeMember')}
        cancelButtonText={t('cancel')}
        loading={removeMemberMutation.isPending}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove && project)
            removeMemberMutation.mutate({ projectId: project.id, userId: memberToRemove.userId });
          setMemberToRemove(null);
        }}
      >
        <p>
          <b>{memberToRemove?.name ?? memberToRemove?.email}</b> {t('removeMemberWarning')}
        </p>
      </Alert>
    </Dialog>
  );
};
