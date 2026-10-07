import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';
import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

export function AnalyticsWebsiteVisits({
  title,
  subheader,
  chart,
  emptyMessage = 'No data available yet',
  ...other
}) {
  const theme = useTheme();
  const hasData = hasChartValues(chart);

  const chartColors = chart?.colors ?? [
    hexAlpha(theme.palette.primary.dark, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
  ];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chart?.categories || [],
    },
    legend: {
      show: true,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} visits`,
      },
    },
    ...chart?.options,
  });

  return (
    <Card
      {...other}
      sx={{
        height: 1,
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        ...other.sx,
      }}
    >
      <CardHeader title={title} subheader={hasData ? subheader : undefined} />

      {hasData ? (
        <Chart
          type="bar"
          series={Array.isArray(chart?.series) ? chart.series : []}
          options={chartOptions}
          height={364}
          sx={{ py: 2.5, pl: 1, pr: 2.5, flexGrow: 1 }}
        />
      ) : (
        <DashboardEmptyState message={emptyMessage} minHeight={320} />
      )}
    </Card>
  );
}
