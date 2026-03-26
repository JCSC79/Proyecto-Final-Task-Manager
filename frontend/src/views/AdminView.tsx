import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Elevation, H3, H5, Icon, Intent, Tag, HTMLTable, Button, NonIdealState, Spinner, InputGroup, Dialog, Classes } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosInstance';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';

interface UserRow {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  userId: string;
  userEmail?: string;
  createdAt: string;
}

export const AdminView: React.FC = () => {
  const { t } = useTranslation();
  const { user, verifyUserFromServer } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  const [taskSortOrder, setTaskSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [confirmState, setConfirmState] = useState<{ type: 'deleteUser' | 'deleteTask' | 'role' | null; id: string | null; text?: string }>({ type: null, id: null });
  const [userPage, setUserPage] = useState(0);
  const [taskPage, setTaskPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  const queryClient = useQueryClient();

  useEffect(() => {
    const verifyAccess = async () => {
      setIsVerifying(true);
      await verifyUserFromServer();
      setIsVerifying(false);
    };

    verifyAccess();
  }, []);

  const usersQuery = useQuery<UserRow[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    },
    enabled: !!user && !isVerifying,
    staleTime: 60_000,
  });

  const tasksQuery = useQuery<TaskRow[]>({
    queryKey: ['admin', 'tasks', selectedUserId],
    queryFn: async () => {
      const query = selectedUserId ? `?userId=${selectedUserId}` : '';
      const { data } = await api.get(`/admin/tasks${query}`);
      return data;
    },
    enabled: !!user && !isVerifying,
    staleTime: 60_000,
  });

  const updateRoleMutation = useMutation<UserRow, unknown, { id: string; newRole: 'ADMIN' | 'USER' }>({
    mutationFn: async ({ id, newRole }) => {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role: newRole });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });

  const deleteUserMutation = useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      setSelectedUserId(null);
    }
  });

  const deleteTaskMutation = useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await api.delete(`/admin/tasks/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', selectedUserId] })
  });

  const isDark = document.body.classList.contains('bp4-dark');
  const users = usersQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const visibleUsers = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    return users.filter((u) => 
      !term || u.email.toLowerCase().includes(term) || u.id.toLowerCase().includes(term)
    );
  }, [users, filterText]);

  const visibleTasks = useMemo(() => {
    const term = filterText.trim().toLowerCase();

    const base = tasks.filter((t) =>
      (!term ||
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.userId.toLowerCase().includes(term) ||
        (t.userEmail?.toLowerCase().includes(term) ?? false)) &&
      (taskStatusFilter === 'all' || t.status === taskStatusFilter)
    );

    const sorted = [...base].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return taskSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [tasks, filterText, taskStatusFilter, taskSortOrder]);

  const adminStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = totalTasks - completedTasks;

    return {
      totalUsers: users.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [users, tasks]);

  const statusChartData = useMemo(() => {
    const counts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: t('statusPending', 'PENDING'), value: counts.PENDING || 0 },
      { name: t('statusInProgress', 'EN CURSO'), value: counts.IN_PROGRESS || 0 },
      { name: t('statusCompleted', 'COMPLETADA'), value: counts.COMPLETED || 0 },
    ];
  }, [tasks, t]);

  const userTaskDistribution = useMemo(() => {
    const map = new Map<string, number>();
    tasks
      .filter((t) => t.status === 'COMPLETED')
      .forEach((t) => {
        const key = t.userEmail || t.userId;
        map.set(key, (map.get(key) || 0) + 1);
      });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tasks]);

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    tasks
      .filter((t) => t.status === 'COMPLETED')
      .forEach((t) => {
        const dateKey = new Date(t.createdAt).toLocaleDateString();
        map.set(dateKey, (map.get(dateKey) || 0) + 1);
      });

    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, value]) => ({ date, value }));
  }, [tasks]);

  const userStats = useMemo(() => {
    if (!selectedUserId) return null;
    const userTasks = tasks.filter((t) => t.userId === selectedUserId);
    const userCompleted = userTasks.filter((t) => t.status === 'COMPLETED').length;
    const userCompletionRate = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;

    return {
      totalTasks: userTasks.length,
      completedTasks: userCompleted,
      completionRate: userCompletionRate,
    };
  }, [tasks, selectedUserId]);

  const paginatedUsers = useMemo(() => {
    const start = userPage * ITEMS_PER_PAGE;
    return visibleUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleUsers, userPage]);

  const paginatedTasks = useMemo(() => {
    const start = taskPage * ITEMS_PER_PAGE;
    return visibleTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleTasks, taskPage]);

  const translateTaskStatus = (status: string): string => {
    if (status === 'COMPLETED') return t('statusCompleted', 'COMPLETED');
    if (status === 'IN_PROGRESS') return t('statusInProgress', 'EN CURSO');
    if (status === 'PENDING') return t('statusPending', 'PENDIENTE');
    return status;
  };

  const getTaskStatusIntent = (status: string) => {
    if (status === 'COMPLETED') return Intent.SUCCESS;
    if (status === 'IN_PROGRESS') return Intent.PRIMARY;
    if (status === 'PENDING') return Intent.WARNING;
    return Intent.NONE;
  };

  if (isVerifying || usersQuery.isLoading || tasksQuery.isLoading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ padding: '40px' }}>
        <NonIdealState
          icon={<Icon icon="ban-circle" intent={Intent.DANGER} size={60} />}
          title={t('accessDenied', 'Acceso No Autorizado')}
          description={t('accessDeniedDescription', 'No tienes permisos para visualizar las métricas globales del sistema.')}
        />
      </div>
    );
  }

  const openConfirm = (type: 'deleteUser' | 'deleteTask' | 'role', id: string, text?: string) => {
    setConfirmState({ type, id, text });
  };

  const closeConfirm = () => setConfirmState({ type: null, id: null });

  const confirmAction = async () => {
    if (!confirmState.type || !confirmState.id) return;

    if (confirmState.type === 'deleteUser') {
      await deleteUserMutation.mutateAsync(confirmState.id);
    }
    if (confirmState.type === 'deleteTask') {
      await deleteTaskMutation.mutateAsync(confirmState.id);
    }
    if (confirmState.type === 'role') {
      const target = users.find((x) => x.id === confirmState.id);
      if (target) {
        const newRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
        await updateRoleMutation.mutateAsync({ id: target.id, newRole });
      }
    }

    closeConfirm();
  };

  return (
    <div style={{ padding: '10px', color: isDark ? '#f0f8ff' : '#182026' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon icon="shield" size={30} intent={Intent.WARNING} />
          <H3 style={{ margin: 0 }}>{t('adminPanel', 'System Administration')}</H3>
        </div>
        <InputGroup
          leftIcon="filter"
          placeholder={t('filterPlaceholder', 'Filter users/tasks by email/title...')}
          value={filterText}
          onChange={(e) => setFilterText((e.target as HTMLInputElement).value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
          <H5>{t('totalUsers', 'Total Users')}</H5>
          <div>{adminStats.totalUsers}</div>
        </Card>
        <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
          <H5>{t('totalTasks', 'Total Tasks')}</H5>
          <div>{adminStats.totalTasks}</div>
        </Card>
        <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
          <H5>{t('completed', 'Completed')}</H5>
          <div>{adminStats.completedTasks}</div>
        </Card>
        <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
          <H5>{t('completionRate', 'Completion Rate')}</H5>
          <div>{`${adminStats.completionRate}%`}</div>
        </Card>
      </div>

      <Card elevation={Elevation.ONE} style={{ marginBottom: '20px', backgroundColor: isDark ? '#1b2b35' : '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <H5>{t('userManagement', 'User Management')}</H5>
          {selectedUserId && (
            <Button onClick={() => setSelectedUserId(null)} minimal icon="cross">
              {t('clearSelection', 'Clear Selection')}
            </Button>
          )}
        </div>
        <HTMLTable interactive striped style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>{t('userId', 'ID')}</th>
              <th>{t('userEmail', 'Email')}</th>
              <th>{t('role', 'Role')}</th>
              <th>{t('createdAt', 'Created')}</th>
              <th>{t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.id} style={{ backgroundColor: selectedUserId === u.id ? '#0b66c2' : undefined }}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td><Tag intent={u.role === 'ADMIN' ? Intent.WARNING : Intent.PRIMARY} round>{u.role}</Tag></td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td style={{ display: 'flex', gap: 5 }}>
                  <Button
                    icon="eye-open"
                    minimal
                    onClick={() => setSelectedUserId(u.id)}
                    text={t('viewTasks', 'View tasks')}
                  />
                  <Button
                    icon="exchange"
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => openConfirm('role', u.id, `${u.role}`)}
                    text={u.role === 'ADMIN' ? t('demote', 'Demote') : t('promote', 'Promote')}
                  />
                  <Button
                    icon="trash"
                    intent={Intent.DANGER}
                    minimal
                    onClick={() => openConfirm('deleteUser', u.id, u.email)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
        {usersQuery.isError && <div style={{ color: 'red' }}>{t('loadUsersError', 'Failed to load users')}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '12px' }}>
          <span>{t('page', 'Page')} {userPage + 1} {t('of', 'of')} {Math.ceil(visibleUsers.length / ITEMS_PER_PAGE)}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <Button onClick={() => setUserPage(Math.max(0, userPage - 1))} disabled={userPage === 0} minimal>{t('prev', 'Prev')}</Button>
            <Button onClick={() => setUserPage(userPage + 1)} disabled={(userPage + 1) * ITEMS_PER_PAGE >= visibleUsers.length} minimal>{t('next', 'Next')}</Button>
          </div>
        </div>
      </Card>

      {selectedUserId && userStats && (
        <Card elevation={Elevation.ONE} style={{ marginBottom: '20px', backgroundColor: isDark ? '#1b2b35' : '#ffffff' }}>
          <H5>{t('userTaskStats', 'User Task Statistics')}</H5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
              <H5>{t('totalTasks', 'Total Tasks')}</H5>
              <div>{userStats.totalTasks}</div>
            </Card>
            <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
              <H5>{t('completed', 'Completed')}</H5>
              <div>{userStats.completedTasks}</div>
            </Card>
            <Card elevation={Elevation.ZERO} style={{ textAlign: 'center', padding: '10px', backgroundColor: isDark ? '#1c2b36' : '#f1f4f8' }}>
              <H5>{t('completionRate', 'Completion Rate')}</H5>
              <div>{`${userStats.completionRate}%`}</div>
            </Card>
          </div>
        </Card>
      )}

      <Card elevation={Elevation.ONE} style={{ marginBottom: '20px', backgroundColor: isDark ? '#1b2b35' : '#ffffff' }}>
        <H5>{t('taskMetrics', 'Task Metrics')}</H5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: 15, marginTop: 10, height: 250 }}>
          <div style={{ background: isDark ? '#1c2b36' : '#f8fafc', padding: 10, borderRadius: 6 }}>
            <h5 style={{ marginTop: 0 }}>{t('statusDistribution', 'Status Distribution')}</h5>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={28}
                label
              >
                {statusChartData.map((slice) => {
                  const color =
                    slice.name === t('statusPending', 'PENDING') || slice.name === 'PENDING'
                      ? '#D9822B'
                      : slice.name === t('statusInProgress', 'EN CURSO') || slice.name === 'IN_PROGRESS'
                      ? '#2B95D9'
                      : '#0F9960';
                  return <Cell key={`cell-${slice.name}`} fill={color} />;
                })}
              </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: isDark ? '#1c2b36' : '#f8fafc', padding: 10, borderRadius: 6 }}>
            <h5 style={{ marginTop: 0 }}>{t('topUsers', 'Top Users')}</h5>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={userTaskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2E3B48' : '#dde7f3'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#fff' : '#000' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#fff' : '#000' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2B95D9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: isDark ? '#1c2b36' : '#f8fafc', padding: 10, borderRadius: 6 }}>
            <h5 style={{ marginTop: 0 }}>{t('trendByDay', 'Trend by Day')}</h5>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2E3B48' : '#dde7f3'} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#fff' : '#000' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#fff' : '#000' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0F9960" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card elevation={Elevation.ONE} style={{ backgroundColor: isDark ? '#1b2b35' : '#ffffff' }}>
        <H5>{t('taskList', 'Tasks')}</H5>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['all','PENDING','IN_PROGRESS','COMPLETED'] as const).map((status) => (
              <Button
                key={status}
                minimal
                intent={taskStatusFilter === status ? Intent.PRIMARY : Intent.NONE}
                onClick={() => { setTaskStatusFilter(status); setTaskPage(0); }}
              >
                {status === 'all' ? t('all', 'All') : t(`status${status === 'PENDING' ? 'Pending' : status === 'IN_PROGRESS' ? 'InProgress' : 'Completed'}` as string, status) }
              </Button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <Button minimal intent={taskSortOrder === 'newest' ? Intent.PRIMARY : Intent.NONE} onClick={() => setTaskSortOrder('newest')}>
              {t('sortRecent', 'Recent')}
            </Button>
            <Button minimal intent={taskSortOrder === 'oldest' ? Intent.PRIMARY : Intent.NONE} onClick={() => setTaskSortOrder('oldest')}>
              {t('sortOldest', 'Oldest')}
            </Button>
          </div>
        </div>
        <HTMLTable interactive striped style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>{t('taskTitle', 'Title')}</th>
              <th>{t('taskUser', 'User')}</th>
              <th>{t('taskUserId', 'User ID')}</th>
              <th>{t('taskStatus', 'State')}</th>
              <th>{t('createdAt', 'Created')}</th>
              <th>{t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.map((trow) => (
              <tr key={trow.id}>
                <td>{trow.title}</td>
                <td>{trow.userEmail ?? trow.userId}</td>
                <td>{trow.userId}</td>
                <td><Tag intent={getTaskStatusIntent(trow.status)}>{translateTaskStatus(trow.status)}</Tag></td>
                <td>{new Date(trow.createdAt).toLocaleString()}</td>
                <td>
                  <Button icon="trash" intent={Intent.DANGER} minimal onClick={() => openConfirm('deleteTask', trow.id, trow.title)} />
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
        {tasksQuery.isError && <div style={{ color: 'red' }}>{t('loadTasksError', 'Failed to load tasks')}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '12px' }}>
          <span>{t('page', 'Page')} {taskPage + 1} {t('of', 'of')} {Math.ceil(visibleTasks.length / ITEMS_PER_PAGE)}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <Button onClick={() => setTaskPage(Math.max(0, taskPage - 1))} disabled={taskPage === 0} minimal>{t('prev', 'Prev')}</Button>
            <Button onClick={() => setTaskPage(taskPage + 1)} disabled={(taskPage + 1) * ITEMS_PER_PAGE >= visibleTasks.length} minimal>{t('next', 'Next')}</Button>
          </div>
        </div>
      </Card>

      <Dialog isOpen={confirmState.type !== null} title={t('confirmTitle', 'Confirm Action')} onClose={closeConfirm} canEscapeKeyClose canOutsideClickClose>
        <div className={Classes.DIALOG_BODY}>
          <p>
            {confirmState.type === 'deleteUser' && t('confirmDeleteUser', 'Are you sure you want to delete this user?')}
            {confirmState.type === 'deleteTask' && t('confirmDeleteTask', 'Are you sure you want to delete this task?')}
            {confirmState.type === 'role' && t('confirmRoleChange', 'Are you sure you want to toggle role?')}
            {confirmState.text ? ` \n ${confirmState.text}` : ''}
          </p>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={closeConfirm}>{t('cancel', 'Cancel')}</Button>
            <Button intent={Intent.DANGER} onClick={confirmAction}>{t('confirm', 'Confirm')}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};