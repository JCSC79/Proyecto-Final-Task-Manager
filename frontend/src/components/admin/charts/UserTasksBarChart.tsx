import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../AdminDashboard.module.css';

interface UserTasksBarChartProps {
  //  Define that 'data' is an array of objects with name and dynamic values for pending, inProgress, and completed tasks
  data: Array<{
    name: string;
    [key: string]: string | number; // This allows translated keys to work
  }>;
  colors: {
    pending: string;
    inProgress: string;
    completed: string;
  };
  labels: {
    pending: string;
    inProgress: string;
    completed: string;
  };
  isDark: boolean;
}

export const UserTasksBarChart: React.FC<UserTasksBarChartProps> = ({
  data, colors, labels, isDark
}) => {
  const labelColor = isDark ? '#a7b6c2' : '#5c7080';
  const gridColor = isDark ? '#394b59' : '#dbe3e8';

  return (
    <div className={styles.chartContainer}>
      {/* height={380} mirrors the CSS .chartContainer height — avoids ResizeObserver -1 on first render */}
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: labelColor, fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={70}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: labelColor, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              color: 'var(--text-main)'
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar dataKey={labels.pending} stackId="a" fill={colors.pending} radius={[0, 0, 0, 0]} />
          <Bar dataKey={labels.inProgress} stackId="a" fill={colors.inProgress} radius={[0, 0, 0, 0]} />
          <Bar dataKey={labels.completed} stackId="a" fill={colors.completed} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};