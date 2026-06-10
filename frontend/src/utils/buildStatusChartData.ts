import type { ChartDataPoint } from '../components/admin/charts/StatusDonutChart';
import { CHART_COLORS } from '../styles/chartColors';

interface StatusStats {
  pending: number;
  inProgress: number;
  completed: number;
}

interface StatusLabels {
  pending: string;
  inProgress: string;
  completed: string;
}

/**
 * Builds the ChartDataPoint array shared by StatusDonutChart and BarChart.
 * Centralises the status→color mapping so neither DashboardView nor AdminDashboard
 * need to know about CHART_COLORS directly.
 *
 * @param stats   - Numeric counts per status
 * @param labels  - Translated display names (pass t('pending') etc.)
 * @param withStatus - Include the `status` field needed for onPieClick (default: false)
 */
export const buildStatusChartData = (
  stats: StatusStats,
  labels: StatusLabels,
  withStatus = false
): ChartDataPoint[] => [
  {
    name: labels.pending,
    value: stats.pending,
    fill: CHART_COLORS.pending,
    ...(withStatus && { status: 'PENDING' }),
  },
  {
    name: labels.inProgress,
    value: stats.inProgress,
    fill: CHART_COLORS.progress,
    ...(withStatus && { status: 'IN_PROGRESS' }),
  },
  {
    name: labels.completed,
    value: stats.completed,
    fill: CHART_COLORS.done,
    ...(withStatus && { status: 'COMPLETED' }),
  },
];
