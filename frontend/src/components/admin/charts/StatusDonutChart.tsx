import React from 'react';
import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../../../hooks/useTheme';
import type { TaskStatus } from '../../../types/task';

export interface ChartDataPoint {
  name: string;
  value: number;
  status: TaskStatus;
  fill: string;
}

interface StatusDonutChartProps {
  data: ChartDataPoint[];
  onPieClick?: (data: ChartDataPoint) => void;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ data, onPieClick }) => {
  const { isDark } = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius="65%"
          outerRadius="85%"
          paddingAngle={10}
          dataKey="value"
          stroke="none"
          onClick={(data: unknown) => {
            const entry = data as { payload: ChartDataPoint };
            if (entry?.payload) {
              onPieClick?.(entry.payload);
            }
          }}
          style={{ cursor: 'pointer', outline: 'none' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? '#30404d' : '#fff', 
            border: 'none', 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} 
        />
        <Legend verticalAlign="bottom" height={6} />
      </PieChart>
    </ResponsiveContainer>
  );
};