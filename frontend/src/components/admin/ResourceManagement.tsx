import React, { useState } from 'react';
import { Icon, ProgressBar, Intent, Tag, Button, ButtonGroup } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import type { WorkloadEntry } from '../../api/admin.api';
import styles from './AdminDashboard.module.css';

const OVERLOAD_THRESHOLD = 5;
const PAGE_SIZE = 6;

interface Props {
  workload: WorkloadEntry[];
}

export const ResourceManagement: React.FC<Props> = ({ workload }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  if (workload.length === 0) {
    return <p className={styles.emptyMobileMsg}>{t('noActiveWork')}</p>;
  }

  const totalPages = Math.ceil(workload.length / PAGE_SIZE);
  const visible = workload.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const max = Math.max(...workload.map(w => w.activeTasks), 1);

  return (
    <div className={styles.workloadWrapper}>
      <ul className={styles.workloadList}>
        {visible.map(entry => {
          const displayName = entry.name ?? entry.email;
          const isOverloaded = entry.activeTasks >= OVERLOAD_THRESHOLD;
          return (
            <li key={entry.userId} className={styles.workloadRow}>
              <span className={styles.workloadName} title={entry.email}>
                {displayName}
                {isOverloaded
                  ? (
                    <Tag intent={Intent.DANGER} minimal round className={styles.workloadTag}>
                      <Icon icon="issue" size={12} /> {t('overloaded')}
                    </Tag>
                  ) : (
                    <Tag intent={Intent.SUCCESS} minimal round className={styles.workloadTag}>
                      <Icon icon="tick-circle" size={12} /> {t('healthy')}
                    </Tag>
                  )}
              </span>
              <ProgressBar
                className={styles.workloadBar}
                value={entry.activeTasks / max}
                intent={isOverloaded ? Intent.DANGER : Intent.PRIMARY}
                animate={false}
                stripes={false}
              />
              <span className={styles.workloadCount}>{entry.activeTasks}</span>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && (
        <div className={styles.workloadPagination}>
          <ButtonGroup variant="minimal" size="small">
            {totalPages > 2 && (
              <Button icon="double-chevron-left" disabled={page === 0} onClick={() => setPage(0)} aria-label={t('firstPage')} />
            )}
            <Button icon="chevron-left" disabled={page === 0} onClick={() => setPage(p => p - 1)} aria-label={t('prev')} />
            <Button variant="minimal" disabled className={styles.workloadPageLabel}>
              {page + 1} / {totalPages}
            </Button>
            <Button icon="chevron-right" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} aria-label={t('next')} />
            {totalPages > 2 && (
              <Button icon="double-chevron-right" disabled={page === totalPages - 1} onClick={() => setPage(totalPages - 1)} aria-label={t('lastPage')} />
            )}
          </ButtonGroup>
        </div>
      )}
    </div>
  );
};
