import React from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import type { IUserWithStats } from '../../types/admin';

interface Props {
  user: IUserWithStats | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteUserDialog: React.FC<Props> = ({ user, isLoading, onConfirm, onClose }) => {
  const { t } = useTranslation();

  if (!user) {
    return null;
  }

  const displayName = user.name ?? user.email;
  const taskCount = user.stats.total;

  return (
    <Alert
      isOpen={user !== null}
      intent={Intent.DANGER}
      icon="trash"
      confirmButtonText={t('deleteUser')}
      cancelButtonText={t('cancel')}
      loading={isLoading}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <p>
        <strong>{t('deleteUserConfirm', { name: displayName })}</strong>
      </p>
      <p>{t('deleteUserWarning', { count: taskCount })}</p>
    </Alert>
  );
};
