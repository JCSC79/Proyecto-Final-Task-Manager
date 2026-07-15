import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { LeadTimeEntry } from '../../api/admin.api';
import styles from './AdminDashboard.module.css';

const COLOURS = ['#2980b9', '#27ae60', '#e67e22', '#8e44ad', '#c0392b', '#16a085'];

interface TooltipProps {
  active?: boolean;
  payload?: { value?: number }[];
  labelDays: string;
  labelAvg: string;
}

const LeadTimeTooltip: React.FC<TooltipProps> = ({ active, payload, labelDays, labelAvg }) => {
  if (!active || !payload?.length) {
    return null;
}
  return (
    <div className={styles.chartTooltip}>
      <span>{labelAvg}: <strong>{payload[0]?.value}{labelDays}</strong></span>
    </div>
  );
};

interface Props {
  data: LeadTimeEntry[];
}

export const LeadTimeChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();

  if (data.length === 0) {
    return <p className={styles.emptyMobileMsg}>{t('noLeadTimeData')}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          unit={t('days')}
          tick={{ fontSize: 11 }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<LeadTimeTooltip labelDays={t('days')} labelAvg={t('avgLeadTime')} />} />
        <Bar
          dataKey="avgDays"
          radius={[0, 4, 4, 0]}
          fill="#2980b9"
          // Each bar gets a colour from the palette based on its index
          label={false}
        >
          {data.map((entry, i) => (
            // NOSONAR: recharts requires children here for per-bar colour
            <rect key={entry.category} fill={COLOURS[i % COLOURS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
