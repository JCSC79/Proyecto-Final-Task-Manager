import React, { useState } from 'react';
import {
  Dialog, Classes, Tabs, Tab, Tag, H3, Text, Button, Icon, Intent,
} from '@blueprintjs/core';
import { useQuery } from '@tanstack/react-query';
import { getTaskHistory } from '../../api/task.api';
import type { Task, AuditLog } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { TagBadge } from './TagBadge';
import { getTranslatedStatus } from './taskUtils';
import styles from './TaskItem.module.css';

const STATUS_INTENT: Record<string, Intent> = {
  COMPLETED: Intent.SUCCESS,
  IN_PROGRESS: Intent.PRIMARY,
  PENDING: Intent.WARNING,
};

interface TaskDetailsDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  isOwner: boolean;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task, isOpen, onClose, onEdit, isOwner,
}) => {
  const { t } = useTranslation();
  const [detailsTab, setDetailsTab] = useState<string>('info');

  const statusIntent = STATUS_INTENT[task.status] ?? Intent.WARNING;

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ['taskHistory', task.id],
    queryFn: () => getTaskHistory(task.id),
    enabled: isOpen && detailsTab === 'history',
  });

  return (
    <Dialog
      icon="info-sign"
      onClose={onClose}
      title={t('taskDetails')}
      isOpen={isOpen}
    >
      <div className={Classes.DIALOG_BODY}>
        <div className={styles.detailHeader}>
          <H3 className={styles.dialogTitle}>{task.title}</H3>
          <Tag intent={statusIntent} size="large" round className={styles.statusTag}>
            {getTranslatedStatus(task.status, t)}
          </Tag>
        </div>
        <Tabs
          id="task-detail-tabs"
          selectedTabId={detailsTab}
          onChange={(newTabId) => setDetailsTab(String(newTabId))}
        >
          <Tab id="info" title={t('taskDetails')} panel={
            <>
              <div className={styles.detailBody}>
                <Text>{task.description || t('noDetails')}</Text>
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className={styles.detailTagRow}>
                  {task.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
              {task.createdAt && (
                <div className={styles.detailDate}>
                  {t('createdOn')}: {new Date(task.createdAt).toLocaleString()}
                </div>
              )}
            </>
          } />
          <Tab id="history" title={t('history')} panel={
            <div className={styles.historyList}>
              {auditLogs.length === 0
                ? <Text className={styles.noHistory}>{t('noHistory')}</Text>
                : auditLogs.map((log) => (
                  <div key={log.id} className={styles.historyEntry}>
                    <Icon icon="history" size={14} />
                    <span className={styles.historyAction}>
                      {t(`historyAction_${log.action}`)}
                    </span>
                    {log.createdAt && (
                      <span className={styles.historyDate}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))
              }
            </div>
          } />
        </Tabs>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose}>{t('close')}</Button>
          {isOwner && (
            <Button intent="primary" icon="edit" onClick={() => { onClose(); onEdit(); }}>
              {t('editTask')}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
