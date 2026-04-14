import React from 'react';
import { StatusDonutChart, type ChartDataPoint } from './charts/StatusDonutChart';
import { UserTasksBarChart } from './charts/UserTasksBarChart';
import {
  Card, Elevation, H2, H3, H4, Icon, InputGroup,
  Button, Alert, Intent, Spinner, ButtonGroup
} from '@blueprintjs/core';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { UserDetailDialog } from './UserDetailDialog';
import { UserManagementTable } from './UserManagementTable';
import { useTheme } from '../../hooks/useTheme.ts';
import styles from './AdminDashboard.module.css';

const COLOR_PENDING = '#D9822B';
const COLOR_IN_PROGRESS = '#2B95D9';
const COLOR_COMPLETED = '#0F9960';

export const AdminDashboard: React.FC = () => {
  const { isDark } = useTheme();
  
  const {
    t, isLoading, isError, search, setSearch, roleFilter, setRoleFilter,
    currentPage, setCurrentPage, totalPages, paginatedUsers, sort, handleSort,
    pendingChange, setPendingChange, selectedUser, setSelectedUser, roleMutation,
    users, globalStats
  } = useAdminDashboard();

  if (isLoading) {
    return <Spinner size={50} intent={Intent.PRIMARY} />;
  }

  if (isError) {
    return <p style={{ color: 'var(--text-main)' }}>{t('errorMessage')}</p>;
  }

  /**
   * We use 'fill' instead of 'color' to comply with the modernized StatusDonutChart interface
   */
  const pieData: ChartDataPoint[] = [
    { name: t('pending'), value: globalStats.pending, fill: COLOR_PENDING },
    { name: t('inProgress'), value: globalStats.inProgress, fill: COLOR_IN_PROGRESS },
    { name: t('completed'), value: globalStats.completed, fill: COLOR_COMPLETED },
  ].filter(d => d.value > 0);

  const barData = [...users]
    .sort((a, b) => b.stats.total - a.stats.total)
    .slice(0, 10)
    .map(u => ({
      name: u.name ?? u.email.split('@')[0],
      [t('pending')]: u.stats.pending,
      [t('inProgress')]: u.stats.inProgress,
      [t('completed')]: u.stats.completed,
    }));

  return (
    <div className={styles.wrapper}>
      <H2 className={styles.pageTitle}>
        <Icon icon="shield" size={25} intent="warning" /> {t('adminPanel')}
      </H2>

      {/* KPI Section */}
      <div className={styles.kpiGrid}>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('adminTotalUsers')}</H4>
          <div className={styles.kpiValue}>{users.length}</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('adminTotalTasks')}</H4>
          <div className={styles.kpiValue}>{globalStats.total}</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('completionRate')}</H4>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{globalStats.rate}%</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('adminInProgress')}</H4>
          <div className={`${styles.kpiValue} ${styles.kpiValueBlue}`}>{globalStats.inProgress}</div>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className={styles.chartsGrid}>
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('statusDistribution')}</H3>
          <StatusDonutChart data={pieData} />
        </Card>
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('adminTasksPerUser')}</H3>
          <UserTasksBarChart 
            data={barData}
            isDark={isDark}
            colors={{ pending: COLOR_PENDING, inProgress: COLOR_IN_PROGRESS, completed: COLOR_COMPLETED }}
            labels={{ pending: t('pending'), inProgress: t('inProgress'), completed: t('completed') }}
          />
        </Card>
      </div>

      {/* User Management Section */}
      <Card elevation={Elevation.ONE} className={styles.tableCard}>
        <H3 className={styles.tableTitle}><Icon icon="people" /> {t('adminUserList')}</H3>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <InputGroup 
              leftIcon="search" 
              placeholder={t('adminSearchUsers')} 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <ButtonGroup minimal>
            <Button text={t('all')} active={roleFilter === 'ALL'} onClick={() => { setRoleFilter('ALL'); setCurrentPage(1); }} />
            <Button text="Admin" active={roleFilter === 'ADMIN'} intent="primary" onClick={() => { setRoleFilter('ADMIN'); setCurrentPage(1); }} />
            <Button text="User" active={roleFilter === 'USER'} onClick={() => { setRoleFilter('USER'); setCurrentPage(1); }} />
          </ButtonGroup>
        </div>

        {/* Modularized Table Component */}
        <UserManagementTable 
          users={paginatedUsers}
          sort={sort}
          onSort={handleSort}
          onOpenModal={setSelectedUser}
          onPromote={(user) => setPendingChange({ user, targetRole: 'ADMIN' })}
          onDemote={(user) => setPendingChange({ user, targetRole: 'USER' })}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup>
              <Button icon="chevron-left" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} />
              <Button minimal disabled style={{ fontWeight: 'bold' }}>{t('page')} {currentPage} / {totalPages}</Button>
              <Button icon="chevron-right" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} />
            </ButtonGroup>
          </div>
        )}
      </Card>

      {/* Modals and Alerts */}
      <UserDetailDialog 
        user={selectedUser} 
        isOpen={selectedUser !== null} 
        onClose={() => setSelectedUser(null)} 
      />

      <Alert
        isOpen={pendingChange !== null}
        icon={pendingChange?.targetRole === 'ADMIN' ? 'arrow-up' : 'arrow-down'}
        intent={pendingChange?.targetRole === 'ADMIN' ? Intent.WARNING : Intent.DANGER}
        confirmButtonText={pendingChange?.targetRole === 'ADMIN' ? t('adminPromote') : t('adminDemote')}
        cancelButtonText={t('cancel')}
        onCancel={() => setPendingChange(null)}
        onConfirm={() => {
          if (pendingChange) {
            roleMutation.mutate({ userId: pendingChange.user.id, role: pendingChange.targetRole });
          }
        }}
        loading={roleMutation.isPending}
      >
        <p>{pendingChange?.targetRole === 'ADMIN' ? t('adminPromoteConfirm', { name: pendingChange.user.name ?? pendingChange.user.email }) : t('adminDemoteConfirm', { name: pendingChange?.user.name ?? pendingChange?.user.email })}</p>
      </Alert>
    </div>
  );
};