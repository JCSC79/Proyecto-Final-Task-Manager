import React from 'react';
import { StatusDonutChart } from './charts/StatusDonutChart';
import { UserTasksBarChart } from './charts/UserTasksBarChart';
import {
  Card, Elevation, H2, H3, Icon, InputGroup,
  Button, Alert, Intent, Spinner, ButtonGroup
} from '@blueprintjs/core';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { UserDetailDialog } from './UserDetailDialog';
import { UserManagementTable } from './UserManagementTable';
import { CHART_COLORS } from '../../styles/chartColors';
import { buildStatusChartData } from '../../utils/buildStatusChartData';
import styles from './AdminDashboard.module.css';

export const AdminDashboard: React.FC = () => {
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
    return <p className={styles.errorText}>{t('errorMessage')}</p>;
  }

  const pieData = buildStatusChartData(
    { pending: globalStats.pending, inProgress: globalStats.inProgress, completed: globalStats.completed },
    { pending: t('pending'), inProgress: t('inProgress'), completed: t('completed') }
  ).filter(d => d.value > 0);

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
          <H3 className={styles.kpiLabel}>{t('adminTotalUsers')}</H3>
          <div className={styles.kpiValue}>{users.length}</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('adminTotalTasks')}</H3>
          <div className={styles.kpiValue}>{globalStats.total}</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('completionRate')}</H3>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{globalStats.rate}%</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('adminInProgress')}</H3>
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
            colors={{ pending: CHART_COLORS.pending, inProgress: CHART_COLORS.progress, completed: CHART_COLORS.done }}
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
              aria-label={t('adminSearchUsers')}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <ButtonGroup variant='minimal'>
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
          <div className={styles.paginationWrapper}>
            <ButtonGroup>
              <Button icon="chevron-left" disabled={currentPage === 1} aria-label={t('prev')} onClick={() => setCurrentPage(prev => prev - 1)} />
              <Button variant='minimal' disabled className={styles.paginationPageBtn}>{t('page')} {currentPage} / {totalPages}</Button>
              <Button icon="chevron-right" disabled={currentPage === totalPages} aria-label={t('next')} onClick={() => setCurrentPage(prev => prev + 1)} />
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