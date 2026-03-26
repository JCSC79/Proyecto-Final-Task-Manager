import React from 'react';
import { Card, Elevation, Icon, H3, H2, H4, Text } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import type { Task, TaskStatus } from '../../types/task';

/**
 * DashboardView Component
 * Provides advanced analytics, KPIs, and interactive charts for task management.
 */

interface DashboardViewProps {
  tasks: Task[];
  isDark: boolean;
  onChartClick: (status: TaskStatus) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: unknown }>;
  isDark: boolean;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

/**
 * CustomTooltip: Styled tooltip for charts that adapts to light/dark themes.
 */
const CustomTooltip = ({ active, payload, isDark }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: isDark ? '#30404d' : '#ffffff', 
        padding: '10px', 
        borderRadius: '4px', 
        border: `1px solid ${isDark ? '#394b59' : '#dbe3e8'}`,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        <Text style={{ color: isDark ? '#f5f8fa' : '#182026', fontWeight: 'bold' }}>
          {`${payload[0].name}: ${payload[0].value}`}
        </Text>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks = [], isDark, onChartClick }) => {
  const { t } = useTranslation();

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

  /**
   * Chart event handler to filter tasks by status.
   * Uses safe type casting to comply with strict ESLint rules.
   */
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

  // Common styles for UI components
  const cardStyle = { backgroundColor: isDark ? '#293742' : '#ffffff', color: isDark ? '#f5f8fa' : '#182026', borderRadius: '8px' };
  const labelColor = isDark ? '#a7b6c2' : '#5c7080';

  return (
    <div style={{ marginTop: '20px', paddingBottom: '40px' }}>
      <H2 style={{ marginBottom: '30px', color: isDark ? '#f5f8fa' : '#182026' }}>
        <Icon icon="chart" size={25} intent="primary" /> {t('kpiDashboard')}
      </H2>

      {/* KPI CARDS SECTION  */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Card elevation={Elevation.TWO} style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <H4 style={{ color: labelColor }}>{t('totalTasks')}</H4>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: isDark ? '#ffffff' : '#182026' }}>{total}</div>
          </div>
        </Card>
        
        <Card elevation={Elevation.TWO} style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <H4 style={{ color: labelColor }}>{t('completionRate')}</H4>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#0F9960' }}>{completionRate}%</div>
          </div>
        </Card>
        
        <Card elevation={Elevation.TWO} style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <H4 style={{ color: labelColor }}>{t('boardHealth')}</H4>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: completionRate > 70 ? '#0F9960' : '#D9822B' }}>
              {completionRate > 70 ? t('healthExcellent') : t('healthImprovable')}
            </div>
          </div>
        </Card>
        
        <Card elevation={Elevation.TWO} style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <H4 style={{ color: labelColor }}>{t('avgTime')}</H4>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: isDark ? '#ffffff' : '#182026' }}>{timeDisplay}</div>
          </div>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Status Breakdown (Donut Chart) */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px' }}>
          <H3 style={{ color: isDark ? '#f5f8fa' : '#182026' }}>{t('statusDistribution')}</H3>
          <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
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
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workload Bar Chart */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px' }}>
          <H3 style={{ color: isDark ? '#f5f8fa' : '#182026' }}>{t('workloadTitle')}</H3>
          <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#394b59" : "#dbe3e8"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 12 }} />
                <Tooltip 
                  content={<CustomTooltip isDark={isDark} />} 
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} 
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  onClick={handleChartEvent}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Trend (Line Chart) */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px', gridColumn: 'span 2' }}>
          <H3 style={{ color: isDark ? '#f5f8fa' : '#182026', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon icon="timeline-events" /> {t('recentActivity')}
          </H3>
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#394b59" : "#dbe3e8"} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: labelColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor }} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Line type="monotone" dataKey="count" stroke="#2B95D9" strokeWidth={3} dot={{ r: 5, fill: '#2B95D9' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};