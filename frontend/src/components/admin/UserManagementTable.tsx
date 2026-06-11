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

// Extracted as a named component so each branch returns a <th> with a literal
// aria-sort string — prevents the Edge Tools axe/aria false positive that fires
// when the attribute value is a JSX expression instead of a string literal.
interface SortableThProps {
  label: string;
  col: SortColumn;
  sort: { column: SortColumn; direction: 'asc' | 'desc' };
  onSort: (col: SortColumn) => void;
}

const SortableTh: React.FC<SortableThProps> = ({ label, col, sort, onSort }) => {
  const isActive = sort.column === col;
  const thProps = {
    className: styles.sortableTh,
    onClick: () => onSort(col),
    tabIndex: 0 as const,
    onKeyDown: (e: React.KeyboardEvent<HTMLTableCellElement>) => { if (e.key === 'Enter') onSort(col); },
  };
  const content = (
    <div className={styles.sortThContent}>
      {label}
      <Icon
        icon={isActive ? (sort.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'double-caret-vertical'} // NOSONAR: nested ternary is intentional for icon selection
        size={12}
        style={{ opacity: isActive ? 1 : 0.2 }}
      />
    </div>
  );
  
  if (!isActive) {
    return <th {...thProps} aria-sort="none">{content}</th>;
  }

  if (sort.direction === 'asc') {
    return <th {...thProps} aria-sort="ascending">{content}</th>;
  
  }
  return <th {...thProps} aria-sort="descending">{content}</th>;
};

interface MobileUserCardProps {
  user: IUserWithStats;
  onOpenModal: (user: IUserWithStats) => void;
  onPromote: (user: IUserWithStats) => void;
  onDemote: (user: IUserWithStats) => void;
}

const MobileUserCard: React.FC<MobileUserCardProps> = ({ user, onOpenModal, onPromote, onDemote }) => {
  const { t } = useTranslation();

  const handleClick = () => onOpenModal(user);
  const handlePromote = (e: React.MouseEvent) => { e.stopPropagation(); onPromote(user); };
  const handleDemote = (e: React.MouseEvent) => { e.stopPropagation(); onDemote(user); };

  return (
    <div className={styles.mobileCard}>
      <button type="button" className={styles.mobileCardClickable} onClick={handleClick}>
        <div className={styles.mobileCardHeader}>
          <span className={styles.mobileCardName}>{user.name ?? user.email.split('@')[0]}</span>
          <span className={user.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}>
            {user.role === 'ADMIN' ? t('adminRole') : t('userRole')}
          </span>
        </div>
        <div className={styles.mobileCardEmail}>{user.email}</div>
        <div className={styles.mobileCardStats}>
          <div>
            <div className={styles.mobileCardStatLabel}>{t('pending')}</div>
            <div className={`${styles.mobileCardStatValue} ${styles.mobileStatPending}`}>{user.stats.pending}</div>
          </div>
          <div>
            <div className={styles.mobileCardStatLabel}>{t('inProgress')}</div>
            <div className={`${styles.mobileCardStatValue} ${styles.mobileStatProgress}`}>{user.stats.inProgress}</div>
          </div>
          <div>
            <div className={styles.mobileCardStatLabel}>{t('completed')}</div>
            <div className={`${styles.mobileCardStatValue} ${styles.mobileStatDone}`}>{user.stats.completed}</div>
          </div>
        </div>
        <div className={styles.completionRateRow}>
          <span className={styles.completionRateLabel}>{t('completionRate')}:</span>
          <strong>{user.stats.completionRate}%</strong>
          <progress
            className={styles.miniBar}
            max={100}
            value={user.stats.completionRate}
            aria-label={`${user.stats.completionRate}%`}
          />
        </div>
      </button>
      <div className={styles.mobileCardFooter}>
        <ButtonGroup variant="minimal">
          {user.role === 'USER' ? (
            <Button size="small" icon="arrow-up" intent="warning" text={t('adminPromote')} onClick={handlePromote} />
          ) : (
            <Button size="small" icon="arrow-down" intent="danger" text={t('adminDemote')} onClick={handleDemote} />
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export const UserManagementTable: React.FC<Props> = ({
  users, sort, onSort, onOpenModal, onPromote, onDemote
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* DESKTOP: full table, hidden on mobile via CSS */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <SortableTh label={t('adminColName')} col="name" sort={sort} onSort={onSort} />
              <SortableTh label={t('adminColEmail')} col="email" sort={sort} onSort={onSort} />
              <th>{t('adminColRole')}</th>
              <SortableTh label={t('adminColTotal')} col="total" sort={sort} onSort={onSort} />
              <SortableTh label={t('pending')} col="pending" sort={sort} onSort={onSort} />
              <SortableTh label={t('inProgress')} col="inProgress" sort={sort} onSort={onSort} />
              <SortableTh label={t('completed')} col="completed" sort={sort} onSort={onSort} />
              <SortableTh label={t('completionRate')} col="rate" sort={sort} onSort={onSort} />
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
                    <progress
                      className={styles.miniBar}
                      max={100}
                      value={user.stats.completionRate}
                      aria-label={`${user.stats.completionRate}%`}
                    />
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
          <p className={styles.emptyMobileMsg}>
            {t('noResults')}
          </p>
        ) : (
          users.map(user => (
            <MobileUserCard key={user.id} user={user} onOpenModal={onOpenModal} onPromote={onPromote} onDemote={onDemote} />
          ))
        )}
      </div>
    </>
  );
};