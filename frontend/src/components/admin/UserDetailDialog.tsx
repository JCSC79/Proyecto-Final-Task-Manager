import React from 'react';
import { Dialog, DialogBody, DialogFooter, Button, H3, H4, H2, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import type { IUserWithStats } from '../../types/admin';
import styles from './AdminDashboard.module.css';

interface UserDetailDialogProps {
  user: IUserWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * UserDetailDialog — Displays the performance breakdown of a selected user.
 */
export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({ user, isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('userDetails')}
      icon="info-sign"
      className={styles.userDetailDialog}
    >
      <DialogBody>
        {user && (
          <div className={styles.userDetailContent}>
            <H3>{user.name ?? user.email}</H3>
            <p className="bp6-text-muted">{user.email}</p>
            
            <div className={styles.statsHighlight}>
              <div className={styles.statsHighlightCell}>
                <div className={`bp6-text-muted ${styles.statsHighlightLabel}`}>{t('adminColTotal')}</div>
                <H2 className={styles.statsHighlightValue}>{user.stats.total}</H2>
              </div>
              <div className={styles.statsHighlightCell}>
                <div className={`bp6-text-muted ${styles.statsHighlightLabel}`}>{t('completionRate')}</div>
                <H2 className={styles.statsHighlightValueGreen}>{user.stats.completionRate}%</H2>
              </div>
            </div>

            <H4>{t('statusDistribution')}</H4>
            <div className={styles.tagList}>
              <Tag intent="warning" size="large" fill minimal icon="time">{t('pending')}: {user.stats.pending}</Tag>
              <Tag intent="primary" size="large" fill minimal icon="play">{t('inProgress')}: {user.stats.inProgress}</Tag>
              <Tag intent="success" size="large" fill minimal icon="tick-circle">{t('completed')}: {user.stats.completed}</Tag>
            </div>
          </div>
        )}
      </DialogBody>
      <DialogFooter actions={<Button onClick={onClose} size="large">{t('close')}</Button>} />
    </Dialog>
  );
};