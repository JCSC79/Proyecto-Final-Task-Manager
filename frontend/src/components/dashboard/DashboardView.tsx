import React, { useMemo } from 'react';
import { Card, Elevation, H2, H4, Icon } from '@blueprintjs/core';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme'; 
import { StatusDonutChart, type ChartDataPoint } from '../admin/charts/StatusDonutChart'; 
import type { Task, TaskStatus } from '../../types/task';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  tasks: Task[];
  onChartClick?: (status: TaskStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks = [], onChartClick }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const labelColor = isDark ? '#a7b6c2' : '#5c7080';
  const gridColor = isDark ? '#394b59' : '#dbe3e8';

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, rate };
  }, [tasks]);

  /**
   * Data Mapping without Cell
   * Recharts Bar and Pie look for the 'fill' property in each data object.
   */
  const chartData: ChartDataPoint[] = [
    { name: t('pending'), value: stats.pending, status: 'PENDING' as TaskStatus, fill: '#D9822B' },
    { name: t('inProgress'), value: stats.inProgress, status: 'IN_PROGRESS' as TaskStatus, fill: '#2B95D9' },
    { name: t('completed'), value: stats.completed, status: 'COMPLETED' as TaskStatus, fill: '#0F9960' },
  ];

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
        <Card elevation={Elevation.ONE} className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('totalTasks')}</span>
          <div className={styles.kpiValue}>{stats.total}</div>
        </Card>
        <Card elevation={Elevation.ONE} className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('completionRate')}</span>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{stats.rate}%</div>
        </Card>
        <Card elevation={Elevation.ONE} className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('boardHealth')}</span>
          <div className={`${styles.kpiValue} ${stats.rate > 70 ? styles.kpiValueGreen : styles.kpiValueOrange}`}>
            {stats.rate > 70 ? t('healthExcellent') : t('healthImprovable')}
          </div>
        </Card>
        <Card elevation={Elevation.ONE} className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('avgTime')}</span>
          <div className={styles.kpiValue}>{t('lessThanDay')}</div>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H4 className={styles.chartTitle}>{t('statusDistribution')}</H4>
          <div className={styles.chartContainer}>
            <StatusDonutChart 
              data={chartData.filter(d => d.value > 0)} 
              onPieClick={(data) => onChartClick?.(data.status)}
            />
          </div>
        </Card>

        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H4 className={styles.chartTitle}>{t('workloadTitle')}</H4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: isDark ? '#30404d' : '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  onClick={(data: unknown) => {
                    const entry = data as { payload: ChartDataPoint };
                    if (entry?.payload) {
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
          <H4 className={styles.chartTitle}>
            <Icon icon="timeline-events" /> {t('recentActivity')}
          </H4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 11 }} allowDecimals={false} />
                <Line type="monotone" dataKey="count" stroke="#2B95D9" strokeWidth={3} dot={{ r: 4, fill: '#2B95D9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};