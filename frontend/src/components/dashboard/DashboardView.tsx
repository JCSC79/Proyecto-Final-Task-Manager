import React from 'react';
import { Card, Elevation, Icon, H3, H2, H4 } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import type { Task, TaskStatus } from '../../types/task';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  tasks: Task[];
  onChartClick: (status: TaskStatus) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: unknown }>;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        {`${payload[0].name}: ${payload[0].value}`}
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks = [], onChartClick }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Recharts requires actual color strings — CSS vars don't work inside chart props
  const labelColor = isDark ? '#a7b6c2' : '#5c7080';
  const gridColor = isDark ? '#394b59' : '#dbe3e8';

  // DATA PROCESSING FOR KPIs AND CHARTS
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completedCount = completedTasks.length;
  const completionRate = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // HUMAN-READABLE TIME CALCULATION (Days + Hours)
  const completedWithDates = completedTasks.filter(task => task.updatedAt && task.createdAt);
  let timeDisplay = "--";
  
  if (completedWithDates.length > 0) {
    const totalMs = completedWithDates.reduce((acc, task) => {
      // Using '!' as the filter above ensures dates exist
      return acc + (new Date(task.updatedAt!).getTime() - new Date(task.createdAt!).getTime());
    }, 0);
    
    const avgMs = totalMs / completedWithDates.length;
    const totalHours = Math.floor(avgMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    if (totalHours === 0) {
      timeDisplay = t('lessThanDay');
    } else {
      // Build dynamic string: "X days and Y hours"
      const dayPart = days > 0 ? `${days}${t('days')}` : "";
      const connector = (days > 0 && remainingHours > 0) ? t('and') : "";
      const hourPart = remainingHours > 0 ? `${remainingHours}${t('hours')}` : "";
      
      timeDisplay = `${dayPart}${connector}${hourPart}`;
    }
  }

  // WEEKLY ACTIVITY TREND (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    const count = tasks.filter(task => 
      task.createdAt && new Date(task.createdAt).toDateString() === d.toDateString()
    ).length;
    return { date: dateStr, count };
  }).reverse();

  // Map localized labels back to TaskStatus for filtering
  const statusMap: Record<string, TaskStatus> = {
    [t('pending')]: 'PENDING',
    [t('inProgress')]: 'IN_PROGRESS',
    [t('completed')]: 'COMPLETED'
  };

  const handleChartEvent = (data: unknown) => {
    if (data && typeof data === 'object' && 'name' in data) {
      const entryName = (data as { name: string }).name;
      if (statusMap[entryName]) onChartClick(statusMap[entryName]);
    }
  };

  const chartData: ChartDataPoint[] = [
    { name: t('pending'), value: pending, color: '#D9822B' },
    { name: t('inProgress'), value: inProgress, color: '#2B95D9' },
    { name: t('completed'), value: completedCount, color: '#0F9960' }
  ];

  return (
    <div className={styles.wrapper}>
      <H2 className={styles.pageTitle}>
        <Icon icon="chart" size={25} intent="primary" /> {t('kpiDashboard')}
      </H2>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('totalTasks')}</H4>
          <div className={styles.kpiValue}>{total}</div>
        </Card>

        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('completionRate')}</H4>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{completionRate}%</div>
        </Card>

        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('boardHealth')}</H4>
          <div className={`${styles.kpiValue} ${completionRate > 70 ? styles.kpiValueGreen : styles.kpiValueOrange}`} style={{ fontSize: '1.5rem' }}>
            {completionRate > 70 ? t('healthExcellent') : t('healthImprovable')}
          </div>
        </Card>

        <Card elevation={Elevation.TWO} className={styles.kpiCard}>
          <H4 className={styles.kpiLabel}>{t('avgTime')}</H4>
          <div className={styles.kpiValue} style={{ fontSize: '1.2rem' }}>{timeDisplay}</div>
        </Card>
      </div>

      {/* CHARTS */}
      <div className={styles.chartsGrid}>
        {/* Status Breakdown (Donut Chart) */}
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('statusDistribution')}</H3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  onClick={handleChartEvent}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workload Bar Chart */}
        <Card elevation={Elevation.ONE} className={styles.chartCard}>
          <H3 className={styles.chartTitle}>{t('workloadTitle')}</H3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 12 }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={handleChartEvent} style={{ cursor: 'pointer', outline: 'none' }}>
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Trend (Line Chart) */}
        <Card elevation={Elevation.ONE} className={`${styles.chartCard} ${styles.chartCardFull}`}>
          <H3 className={styles.chartTitle}>
            <Icon icon="timeline-events" /> {t('recentActivity')}
          </H3>
          <div className={styles.chartContainerSm}>
            <ResponsiveContainer>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: labelColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#2B95D9" strokeWidth={3} dot={{ r: 5, fill: '#2B95D9' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};