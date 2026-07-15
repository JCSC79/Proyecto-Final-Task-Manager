import React from 'react';
import { StatusDonutChart } from './charts/StatusDonutChart';
import { UserTasksBarChart } from './charts/UserTasksBarChart';
import { ResourceManagement } from './ResourceManagement';
import { LeadTimeChart } from './LeadTimeChart';
import {
  Card, Elevation, H2, H3, Icon, InputGroup,
  Button, Alert, Intent, Spinner, ButtonGroup, HTMLSelect
} from '@blueprintjs/core';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { UserDetailDialog } from './UserDetailDialog';
import { UserManagementTable } from './UserManagementTable';
import { DeleteUserDialog } from './DeleteUserDialog';
import { CHART_COLORS } from '../../styles/chartColors';
import { buildStatusChartData } from '../../utils/buildStatusChartData';
import { downloadAdminPdf } from '../../api/task.api';
import { useAuth } from '../../hooks/useAuth';
import styles from './AdminDashboard.module.css';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    t, isLoading, isError, search, setSearch, roleFilter, setRoleFilter,
    currentPage, setCurrentPage, totalPages, paginatedUsers, sort, handleSort,
    pendingChange, setPendingChange, selectedUser, setSelectedUser, roleMutation,
    userToDelete, setUserToDelete, blockMutation, deleteMutation,
    userToBlock, setUserToBlock,
    analytics, analyticsRange, setAnalyticsRange,
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
        <Button
          icon="import"
          intent={Intent.PRIMARY}
          variant="outlined"
          onClick={() => { void downloadAdminPdf(user?.lang ?? 'en'); }}
        >
          {t('exportPdf')}
        </Button>
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
          <H3 className={styles.chartTitle}>
            <Icon icon="doughnut-chart" size={25} /> {t('statusDistribution')}
          </H3>
          <StatusDonutChart data={pieData} />
        </Card>
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>
            <Icon icon="stacked-chart" size={25} /> {t('adminTasksPerUser')}
          </H3>
          <UserTasksBarChart
            data={barData}
            colors={{ pending: CHART_COLORS.pending, inProgress: CHART_COLORS.progress, completed: CHART_COLORS.done }}
            labels={{ pending: t('pending'), inProgress: t('inProgress'), completed: t('completed') }}
          />
        </Card>
      </div>

      {/* Analytics: Resource Management + Lead Time */}
      <div className={styles.analyticsGrid}>
        <Card elevation={Elevation.ONE} className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <H3 className={styles.chartTitle}>
              <Icon icon="horizontal-bar-chart-desc" size={20} /> {t('resourceManagement')}
            </H3>
          </div>
          <ResourceManagement workload={analytics?.workload ?? []} />
        </Card>

        <Card elevation={Elevation.ONE} className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <H3 className={styles.chartTitle}>
              <Icon icon="horizontal-bar-chart" size={20} /> {t('leadTimeByCategory')}
            </H3>
            <HTMLSelect
              value={analyticsRange}
              onChange={e => setAnalyticsRange(e.target.value as '7' | '30' | '90' | 'all')}
              aria-label={t('rangeAll')}
              iconName="caret-down"
            >
              <option value="7">{t('rangeLast7')}</option>
              <option value="30">{t('rangeLast30')}</option>
              <option value="90">{t('rangeLast90')}</option>
              <option value="all">{t('rangeAll')}</option>
            </HTMLSelect>
          </div>
          <LeadTimeChart data={analytics?.leadTimes ?? []} />
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
              rightElement={
                search
                  ? <Button icon="cross" variant="minimal" aria-label={t('clear')} onClick={() => { setSearch(''); setCurrentPage(1); }} />
                  : undefined
              }
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
          onBlock={setUserToBlock}
          onDelete={setUserToDelete}
          currentUserId={user?.id ?? ''}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <ButtonGroup>
              {totalPages > 2 && (
                <Button icon="double-chevron-left" disabled={currentPage === 1} aria-label={t('firstPage')} onClick={() => setCurrentPage(1)} />
              )}
              <Button icon="chevron-left" disabled={currentPage === 1} aria-label={t('prev')} onClick={() => setCurrentPage(prev => prev - 1)} />
              <Button variant='minimal' disabled className={styles.paginationPageBtn}>{t('page')} {currentPage} / {totalPages}</Button>
              <Button icon="chevron-right" disabled={currentPage === totalPages} aria-label={t('next')} onClick={() => setCurrentPage(prev => prev + 1)} />
              {totalPages > 2 && (
                <Button icon="double-chevron-right" disabled={currentPage === totalPages} aria-label={t('lastPage')} onClick={() => setCurrentPage(totalPages)} />
              )}
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

      <DeleteUserDialog
        user={userToDelete}
        isLoading={deleteMutation.isPending}
        onConfirm={() => { if (userToDelete) deleteMutation.mutate(userToDelete.id); }}
        onClose={() => setUserToDelete(null)}
      />

      <Alert
        isOpen={userToBlock !== null}
        icon={userToBlock?.is_blocked ? 'unlock' : 'lock'}
        intent={userToBlock?.is_blocked ? Intent.SUCCESS : Intent.WARNING}
        confirmButtonText={userToBlock?.is_blocked ? t('unblockUser') : t('blockUser')}
        cancelButtonText={t('cancel')}
        loading={blockMutation.isPending}
        onCancel={() => setUserToBlock(null)}
        onConfirm={() => {
          if (userToBlock) {
            blockMutation.mutate({ userId: userToBlock.id, blocked: !userToBlock.is_blocked });
          }
        }}
      >
        <p>
          {userToBlock?.is_blocked
            ? t('unblockUserConfirm', { name: userToBlock.name ?? userToBlock.email })
            : t('blockUserConfirm', { name: userToBlock?.name ?? userToBlock?.email })}
        </p>
      </Alert>
    </div>
  );
};