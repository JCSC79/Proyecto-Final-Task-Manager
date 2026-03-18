import React from 'react';
import { Card, Elevation, Icon, H3, H2, H4, Text, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Task, TaskStatus } from '../../types/task';

interface DashboardViewProps {
  tasks: Task[];
  isDark: boolean;
  onChartClick: (status: TaskStatus) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: unknown; 
  }>;
  isDark: boolean;
}

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

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks, isDark, onChartClick }) => {
  const { t } = useTranslation();

  // 1. Data Processing
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completedCount = completedTasks.length;
  const completionRate = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // NEW: Calculate AVG Completion Time Logic for completed tasks
  const completedWithDates = completedTasks.filter(task => task.updatedAt && task.createdAt);
  
  let avgTimeDays: string | number = "--";
  if (completedWithDates.length > 0) {
    const totalTime = completedWithDates.reduce((acc, task) => {
      const end = new Date(task.updatedAt!).getTime();
      const start = new Date(task.createdAt!).getTime();
      return acc + (end - start);
    }, 0);
    
    const avgMs = totalTime / completedWithDates.length;
    const days = avgMs / (1000 * 60 * 60 * 24);
    
    avgTimeDays = days < 1 ? t('lessThanDay') : Math.round(days);
  }

  const statusMap: Record<string, TaskStatus> = {
    [t('pending')]: 'PENDING',
    [t('inProgress')]: 'IN_PROGRESS',
    [t('completed')]: 'COMPLETED'
  };

  const handlePointClick = (data: { name?: string } | undefined) => {
    if (data?.name && statusMap[data.name]) {
      onChartClick(statusMap[data.name]);
    }
  };

  const chartData = [
    { name: t('pending'), value: pending, color: '#D9822B' },
    { name: t('inProgress'), value: inProgress, color: '#2B95D9' },
    { name: t('completed'), value: completedCount, color: '#0F9960' }
  ];

  const recentTasks = [...tasks]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const cardStyle = { backgroundColor: isDark ? '#293742' : '#ffffff', color: isDark ? '#f5f8fa' : '#182026', borderRadius: '8px' };
  const titleStyle = { color: isDark ? '#f5f8fa' : '#182026', display: 'flex', alignItems: 'center', gap: '10px' };

  return (
    <div style={{ marginTop: '20px' }}>
      <H2 style={{ marginBottom: '30px', ...titleStyle }}>
        <Icon icon="chart" size={25} intent="primary" />
        {t('kpiDashboard')}
      </H2>

      {/* Metric Cards Row - Now with 4 columns for the new metric */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Card elevation={Elevation.TWO} style={{ ...cardStyle, textAlign: 'center', padding: '20px' }}>
          <Icon icon="projects" size={25} style={{ color: '#5c7080', marginBottom: '10px' }} />
          <H4 style={{ color: isDark ? '#a7b6c2' : '#5c7080' }}>{t('totalTasks')}</H4>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{total}</div>
        </Card>

        <Card elevation={Elevation.TWO} style={{ ...cardStyle, textAlign: 'center', padding: '20px' }}>
          <Icon icon="percentage" size={25} intent="success" style={{ marginBottom: '10px' }} />
          <H4 style={{ color: isDark ? '#a7b6c2' : '#5c7080' }}>{t('completionRate')}</H4>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#0F9960' }}>{completionRate}%</div>
        </Card>

        <Card elevation={Elevation.TWO} style={{ ...cardStyle, textAlign: 'center', padding: '20px' }}>
          <Icon icon="pulse" size={25} intent={completionRate > 70 ? "success" : "warning"} style={{ marginBottom: '10px' }} />
          <H4 style={{ color: isDark ? '#a7b6c2' : '#5c7080' }}>{t('boardHealth')}</H4>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: completionRate > 70 ? '#0F9960' : '#D9822B' }}>
            {completionRate > 70 ? t('healthExcellent') : t('healthImprovable')}
          </div>
        </Card>

        {/* NEW KPI CARD: AVG COMPLETION TIME */}
        <Card elevation={Elevation.TWO} style={{ ...cardStyle, textAlign: 'center', padding: '20px' }}>
          <Icon icon="time" size={25} intent="primary" style={{ marginBottom: '10px' }} />
          <H4 style={{ color: isDark ? '#a7b6c2' : '#5c7080' }}>{t('avgTime')}</H4>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
            {avgTimeDays} {typeof avgTimeDays === 'number' ? t('days') : ''}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* DONUT CHART */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px', cursor: 'pointer' }}>
          <H3 style={{ marginBottom: '25px', ...titleStyle }}>{t('statusDistribution')}</H3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value"
                  onClick={(data) => handlePointClick(data)}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* WORKLOAD BAR CHART */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px', cursor: 'pointer' }}>
          <H3 style={{ marginBottom: '25px', ...titleStyle }}>{t('workloadTitle')}</H3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                onClick={(state: unknown) => {
                  const chartState = state as { activePayload?: Array<{ payload: { name: string } }> };
                  if (chartState?.activePayload && chartState.activePayload.length > 0) {
                    handlePointClick(chartState.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#394b59" : "#dbe3e8"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#a7b6c2' : '#5c7080', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#a7b6c2' : '#5c7080', fontSize: 12 }} />
                <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} content={<CustomTooltip isDark={isDark} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RECENT ACTIVITY */}
        <Card elevation={Elevation.ONE} style={{ ...cardStyle, padding: '30px', gridColumn: 'span 2' }}>
          <H3 style={{ marginBottom: '20px', borderBottom: `1px solid ${isDark ? '#394b59' : '#dbe3e8'}`, paddingBottom: '10px', ...titleStyle }}>
            <Icon icon="list" style={{ marginRight: '10px' }} />
            {t('recentActivity')}
          </H3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {recentTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: isDark ? '#30404d' : '#f5f8fa', borderRadius: '6px' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: '#5c7080' }}>
                    {new Date(task.updatedAt || task.createdAt || 0).toLocaleDateString()}
                  </div>
                </div>
                <Tag intent={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'primary' : 'warning'} round large />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};