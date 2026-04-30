import React from 'react';
import { Button, ButtonGroup, Tag, Icon } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import type { IUserWithStats } from '../../types/admin';
import type { SortColumn } from '../../hooks/useAdminDashboard';
import styles from './AdminDashboard.module.css';

interface Props {
  users: IUserWithStats[];
  sort: { column: SortColumn; direction: 'asc' | 'desc' };
  onSort: (col: SortColumn) => void;
  onOpenModal: (user: IUserWithStats) => void;
  onPromote: (user: IUserWithStats) => void;
  onDemote: (user: IUserWithStats) => void;
}

export const UserManagementTable: React.FC<Props> = ({
  users, sort, onSort, onOpenModal, onPromote, onDemote
}) => {
  const { t } = useTranslation();

  const renderHeader = (label: string, col: SortColumn) => (
    <th onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <Icon 
          icon={sort.column === col ? (sort.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'double-caret-vertical'} 
          size={12} 
          style={{ opacity: sort.column === col ? 1 : 0.2 }}
        />
      </div>
    </th>
  );

  return (
    <>
      {/* DESKTOP: full table, hidden on mobile via CSS */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {renderHeader(t('adminColName'), 'name')}
              {renderHeader(t('adminColEmail'), 'email')}
              <th>{t('adminColRole')}</th>
              {renderHeader(t('adminColTotal'), 'total')}
              {renderHeader(t('pending'), 'pending')}
              {renderHeader(t('inProgress'), 'inProgress')}
              {renderHeader(t('completed'), 'completed')}
              {renderHeader(t('completionRate'), 'rate')}
              <th>{t('adminColActions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={10}>{t('noResults')}</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className={styles.clickableRow} onClick={() => onOpenModal(user)}>
                  <td>{user.name ?? '—'}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}>
                      {user.role === 'ADMIN' ? t('adminRole') : t('userRole')}
                    </span>
                  </td>
                  <td>{user.stats.total}</td>
                  <td><Tag intent="warning" minimal>{user.stats.pending}</Tag></td>
                  <td><Tag intent="primary" minimal>{user.stats.inProgress}</Tag></td>
                  <td><Tag intent="success" minimal>{user.stats.completed}</Tag></td>
                  <td>
                    {user.stats.completionRate}%
                    <span className={styles.miniBarTrack}>
                      <span className={styles.miniBarFill} style={{ width: `${user.stats.completionRate}%` }} />
                    </span>
                  </td>
                  <td>
                    <ButtonGroup variant="minimal"> {/* We use ButtonGroup to fix the error */}
                      {user.role === 'USER' ? (
                        <Button size="small" icon="arrow-up" intent="warning" text={t('adminPromote')} 
                          onClick={(e) => { e.stopPropagation(); onPromote(user); }} />
                      ) : (
                        <Button size="small" icon="arrow-down" intent="danger" text={t('adminDemote')} 
                          onClick={(e) => { e.stopPropagation(); onDemote(user); }} />
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE: card list, hidden on desktop via CSS */}
      <div className={styles.mobileList}>
        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
            {t('noResults')}
          </p>
        ) : (
          users.map(user => (
            <div key={user.id} className={styles.mobileCard} onClick={() => onOpenModal(user)}>

              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardName}>{user.name ?? user.email.split('@')[0]}</span>
                <span className={user.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}>
                  {user.role === 'ADMIN' ? t('adminRole') : t('userRole')}
                </span>
              </div>

              <div className={styles.mobileCardEmail}>{user.email}</div>

              {/* Stat breakdown: one column per status */}
              <div className={styles.mobileCardStats}>
                <div>
                  <div className={styles.mobileCardStatLabel}>{t('pending')}</div>
                  <div className={styles.mobileCardStatValue} style={{ color: 'var(--status-pending)' }}>
                    {user.stats.pending}
                  </div>
                </div>
                <div>
                  <div className={styles.mobileCardStatLabel}>{t('inProgress')}</div>
                  <div className={styles.mobileCardStatValue} style={{ color: 'var(--status-progress)' }}>
                    {user.stats.inProgress}
                  </div>
                </div>
                <div>
                  <div className={styles.mobileCardStatLabel}>{t('completed')}</div>
                  <div className={styles.mobileCardStatValue} style={{ color: 'var(--status-done)' }}>
                    {user.stats.completed}
                  </div>
                </div>
              </div>

              <div className={styles.mobileCardFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {t('completionRate')}:
                  </span>
                  <strong>{user.stats.completionRate}%</strong>
                  <span className={styles.miniBarTrack}>
                    <span className={styles.miniBarFill} style={{ width: `${user.stats.completionRate}%` }} />
                  </span>
                </div>
                <ButtonGroup variant="minimal">
                  {user.role === 'USER' ? (
                    <Button size="small" icon="arrow-up" intent="warning" text={t('adminPromote')}
                      onClick={(e) => { e.stopPropagation(); onPromote(user); }} />
                  ) : (
                    <Button size="small" icon="arrow-down" intent="danger" text={t('adminDemote')}
                      onClick={(e) => { e.stopPropagation(); onDemote(user); }} />
                  )}
                </ButtonGroup>
              </div>

            </div>
          ))
        )}
      </div>
    </>
  );
};