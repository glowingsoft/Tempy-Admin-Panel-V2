import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';
import { DashboardChartLegend } from 'src/sections/dashboard/dashboard-chart-legend';

// ----------------------------------------------------------------------

export function AppCurrentDownload({
  title,
  subheader,
  chart,
  emptyMessage = 'No data available yet',
  ...other
}) {
  const theme = useTheme();

  const seriesItems = Array.isArray(chart?.series) ? chart.series : [];
  const chartSeries = seriesItems.map((item) => Number(item.value) || 0);
  const hasData = chartSeries.some((value) => value > 0);

  const chartColors = chart?.colors ?? [
    theme.palette.primary.lighter,
    theme.palette.primary.light,
    theme.palette.primary.dark,
    theme.palette.primary.darker,
  ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: seriesItems.map((item) => item.label),
    stroke: { width: 0 },
    tooltip: {
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => `${seriesName}` },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            value: { formatter: (value) => fNumber(value) },
            total: {
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return fNumber(sum);
              },
            },
          },
        },
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
      <CardHeader title={title} subheader={subheader} />

      {hasData ? (
        <>
          <Chart
            type="donut"
            series={chartSeries}
            options={chartOptions}
            width={{ xs: 240, xl: 260 }}
            height={{ xs: 240, xl: 260 }}
            sx={{ my: 3, mx: 'auto', flexGrow: 1 }}
          />
          <Divider sx={{ borderStyle: 'dashed' }} />
          <DashboardChartLegend items={seriesItems} colors={chartColors} />
        </>
      ) : (
        <DashboardEmptyState message={emptyMessage} minHeight={240} />
      )}
    </Card>
  );
}
