import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { Chart, useChart, ChartLegends } from 'src/components/chart';
import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

export function AnalyticsCurrentSubject({
  title,
  subheader,
  chart,
  emptyMessage = 'No data available yet',
  ...other
}) {
  const theme = useTheme();

  const seriesItems = Array.isArray(chart?.series) ? chart.series : [];
  const categories = Array.isArray(chart?.categories) ? chart.categories : [];
  const hasData = hasChartValues(chart) && categories.length > 0;

  const chartColors = chart?.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: { width: 2 },
    fill: { opacity: 0.48 },
    xaxis: {
      categories,
      labels: {
        style: { colors: categories.map(() => theme.palette.text.secondary) },
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
        <>
          <Chart
            type="radar"
            series={seriesItems}
            options={chartOptions}
            width={300}
            height={300}
            sx={{ my: 1, mx: 'auto', flexGrow: 1 }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          <ChartLegends
            labels={seriesItems.map((item) => item.name)}
            colors={chartOptions?.colors}
            sx={{ p: 3, justifyContent: 'center' }}
          />
        </>
      ) : (
        <DashboardEmptyState message={emptyMessage} minHeight={280} />
      )}
    </Card>
  );
}
