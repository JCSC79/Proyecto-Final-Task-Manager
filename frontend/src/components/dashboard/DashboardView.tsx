import React, { useMemo } from 'react';
import { Card, Elevation, H2, H3, Icon } from '@blueprintjs/core';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartColors } from '../../hooks/useChartColors';
import { StatusDonutChart, type ChartDataPoint } from '../admin/charts/StatusDonutChart';
import type { Task, TaskStatus } from '../../types/task';
import styles from './DashboardView.module.css';
import { CHART_COLORS } from '../../styles/chartColors';
import { buildStatusChartData } from '../../utils/buildStatusChartData';

interface DashboardViewProps {
  tasks: Task[];
  onChartClick?: (status: TaskStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks = [], onChartClick }) => {
  const { t } = useTranslation();
  const { labelColor, gridColor, cursorFill } = useChartColors();

  // Derived KPI counters — recalculated only when tasks array changes
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Avg completion time: createdAt → updatedAt for COMPLETED tasks
    const completedWithDates = tasks.filter(
      t => t.status === 'COMPLETED' && t.createdAt && t.updatedAt
    );
    let avgTime: string | null = null;
    if (completedWithDates.length > 0) {
      const totalMs = completedWithDates.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt!).getTime() - new Date(t.createdAt!).getTime());
      }, 0);
      const avgHours = totalMs / completedWithDates.length / 1000 / 3600;
      if (avgHours < 24) {
        avgTime = `${Math.round(avgHours)}h`;
      } else {
        avgTime = `${(avgHours / 24).toFixed(1)}d`;
      }
    }

    return { total, completed, pending, inProgress, rate, avgTime };
  }, [tasks]);

  // Chart data — status→color mapping centralised in buildStatusChartData
  const chartData = buildStatusChartData(
    { pending: stats.pending, inProgress: stats.inProgress, completed: stats.completed },
    { pending: t('pending'), inProgress: t('inProgress'), completed: t('completed') },
    true  // withStatus = true: needed for onPieClick filtering
  );

  // Activity trend — counts tasks created per day over the last 7 days, oldest first
  const activityData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      const count = tasks.filter(task => {
        if (!task.createdAt) {
          return false;
        }
        return new Date(task.createdAt).toDateString() === d.toDateString();
      }).length;
      return { date: dateLabel, count };
    }).reverse();
  }, [tasks]);

  return (
    <div className={styles.wrapper}>
      <H2 className={styles.pageTitle}>
        <Icon icon="chart" size={35} intent="primary" /> {t('kpiDashboard')}
      </H2>

      <div className={styles.kpiGrid}>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('totalTasks')}</H3>
          <div className={styles.kpiValue}>{stats.total}</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('completionRate')}</H3>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{stats.rate}%</div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('boardHealth')}</H3>
          <div className={`${styles.kpiValue} ${stats.rate > 70 ? styles.kpiValueGreen : styles.kpiValueOrange}`}>
            {stats.rate > 70 ? t('healthExcellent') : t('healthImprovable')}
          </div>
        </Card>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H3 className={styles.kpiLabel}>{t('avgTime')}</H3>
          <div className={`${styles.kpiValue} ${stats.avgTime ? styles.kpiValueGreen : ''}`}>
            {stats.avgTime ?? '—'}
          </div>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('statusDistribution')}</H3>
          <div className={styles.chartContainer}>
            <StatusDonutChart 
              data={chartData.filter(d => d.value > 0)} 
              onPieClick={(data) => data.status && onChartClick?.(data.status)}
            />
          </div>
        </Card>

        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('workloadTitle')}</H3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: cursorFill }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  onClick={(data: unknown) => {
                    const entry = data as { payload: ChartDataPoint };
                    if (entry?.payload?.status) {
                      onChartClick?.(entry.payload.status);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card elevation={Elevation.ONE} className={`${styles.chartCard} ${styles.chartCardFull}`}>
          <H3 className={styles.chartTitle}>
            <Icon icon="timeline-events" /> {t('recentActivity')}
          </H3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} allowDecimals={false} />
                <Line type="monotone" dataKey="count" stroke={CHART_COLORS.progress} strokeWidth={3} dot={{ r: 4, fill: CHART_COLORS.progress }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};