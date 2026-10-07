import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';
import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

export function AnalyticsConversionRates({
  title,
  subheader,
  chart,
  emptyMessage = 'No data available yet',
  ...other
}) {
  const theme = useTheme();
  const hasData = hasChartValues(chart);

  const chartColors = chart?.colors ?? [
    theme.palette.primary.dark,
    hexAlpha(theme.palette.primary.dark, 0.24),
  ];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: { width: 2, colors: ['transparent'] },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => `${seriesName}: ` },
      },
    },
    xaxis: { categories: chart?.categories || [] },
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: { fontSize: '10px', colors: ['#FFFFFF', theme.palette.text.primary] },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        barHeight: '48%',
        dataLabels: { position: 'top' },
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
          height={360}
          sx={{ py: 2.5, pl: 1, pr: 2.5, flexGrow: 1 }}
        />
      ) : (
        <DashboardEmptyState message={emptyMessage} minHeight={280} />
      )}
    </Card>
  );
}
