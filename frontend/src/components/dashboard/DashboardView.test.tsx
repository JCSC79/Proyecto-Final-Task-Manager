import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from './DashboardView';
import { ThemeContext } from '../../contexts/ThemeContext';
import type { Task } from '../../types/task';

/**
 * 1. Mocks
 */
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div data-testid="mock-bar-chart" />,
  LineChart: () => <div data-testid="mock-line-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Line: () => null,
}));

vi.mock('../admin/charts/StatusDonutChart', () => ({
  StatusDonutChart: () => <div data-testid="mock-donut-chart" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

/**
 * 2. Mock Data with required fields
 */
const mockTasks: Task[] = [
  { 
    id: '1', 
    title: 'Task 1', 
    description: 'Desc 1',
    status: 'COMPLETED', 
    userId: 'user-1',
    createdAt: '2026-04-10T10:00:00Z', 
    updatedAt: '2026-04-11T10:00:00Z' 
  },
  { 
    id: '2', 
    title: 'Task 2', 
    description: 'Desc 2',
    status: 'PENDING', 
    userId: 'user-1',
    createdAt: '2026-04-12T10:00:00Z', 
    updatedAt: '2026-04-12T10:00:00Z' 
  },
];

describe('DashboardView', () => {
  const mockOnChartClick = vi.fn();

  it('should calculate and display correct KPI values', () => {
    render(
      <ThemeContext.Provider value={{ isDark: false, toggleTheme: vi.fn() }}>
        <DashboardView tasks={mockTasks} onChartClick={mockOnChartClick} />
      </ThemeContext.Provider>
    );

    // Check KPIs
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check Charts
    expect(screen.getByTestId('mock-donut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('should show "healthExcellent" when completion rate is high', () => {
    const highCompletionTasks: Task[] = [
      { id: '1', title: 'T1', description: '', status: 'COMPLETED', userId: 'user-1' },
    ];

    render(
      <ThemeContext.Provider value={{ isDark: false, toggleTheme: vi.fn() }}>
        <DashboardView tasks={highCompletionTasks} onChartClick={mockOnChartClick} />
      </ThemeContext.Provider>
    );

    expect(screen.getByText('healthExcellent')).toBeInTheDocument();
  });
});