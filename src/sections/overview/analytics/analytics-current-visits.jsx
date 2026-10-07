import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';
import { DashboardChartLegend } from 'src/sections/dashboard/dashboard-chart-legend';

// ----------------------------------------------------------------------

export function AnalyticsCurrentVisits({
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

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.light,
    theme.palette.info.dark,
    theme.palette.error.main,
    theme.palette.text.primary,
  ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: seriesItems.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: chartSeries.length <= 4, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    ...chart.options,
  });

  return (
    <Card
      {...other}
      sx={{
        height: { md: 452 },
        minHeight: { md: 452 },
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...other.sx,
      }}
    >
      <CardHeader title={title} subheader={subheader} sx={{ flexShrink: 0 }} />

      {hasData ? (
        <>
          <Chart
            type="pie"
            series={chartSeries}
            options={chartOptions}
            width={200}
            height={200}
            sx={{ my: 2, mx: 'auto', flexShrink: 0 }}
          />

          <Divider sx={{ borderStyle: 'dashed', flexShrink: 0 }} />

          <DashboardChartLegend items={seriesItems} colors={chartColors} sx={{ flexGrow: 1 }} />
        </>
      ) : (
        <DashboardEmptyState message={emptyMessage} />
      )}
    </Card>
  );
}
