import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import { RouterLink } from 'src/routes/components';

import { Chart, useChart } from 'src/components/chart';
import { Iconify } from 'src/components/iconify';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { resolveWorkflowStatusHex } from './dashboard-status-colors';

// ----------------------------------------------------------------------

export function DashboardStatusBreakdown({
  title,
  hint,
  series = [],
  total: totalProp,
  color = 'primary',
  href,
  sx,
  ...other
}) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;
  const isLink = Boolean(href);

  const rows = (Array.isArray(series) ? series : []).map((item) => ({
    label: item.label,
    value: Number(item.value) || 0,
    color: resolveWorkflowStatusHex(theme, item.label, item.colorKey || item.color),
  }));

  const sliceTotal = rows.reduce((sum, item) => sum + item.value, 0);
  const displayTotal = Number.isFinite(Number(totalProp)) ? Number(totalProp) : sliceTotal;
  const hasData = sliceTotal > 0 || displayTotal > 0;

  const chartColors = hasData ? rows.map((row) => row.color) : [theme.palette.grey[300]];
  const chartSeries = hasData ? rows.map((row) => row.value) : [1];
  const chartLabels = hasData ? rows.map((row) => row.label) : ['No data'];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: chartLabels,
    stroke: { width: 2, colors: [paletteColor.lighter] },
    legend: { show: false },
    tooltip: {
      enabled: sliceTotal > 0,
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => seriesName },
      },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '76%',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: -6,
              fontSize: '12px',
              color: theme.palette.text.secondary,
            },
            value: {
              show: true,
              offsetY: 6,
              fontSize: '22px',
              fontWeight: 700,
              color: theme.palette.text.primary,
              formatter: () => fNumber(displayTotal),
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              color: theme.palette.text.secondary,
              formatter: () => fNumber(displayTotal),
            },
          },
        },
      },
    },
  });

  return (
    <Card
      {...other}
      component={isLink ? RouterLink : 'div'}
      href={isLink ? href : undefined}
      sx={{
        ...bgGradient({
          color: `135deg, ${varAlpha(paletteColor.lighterChannel, 0.42)}, ${varAlpha(paletteColor.lightChannel, 0.28)}`,
        }),
        p: 3,
        height: 1,
        width: 1,
        minHeight: 280,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        color: `${color}.darker`,
        backgroundColor: 'common.white',
        textDecoration: 'none',
        ...(isLink
          ? {
              cursor: 'pointer',
              transition: theme.transitions.create(['transform', 'box-shadow'], { duration: 200 }),
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.customShadows?.z8 || theme.shadows[4],
              },
            }
          : null),
        ...sx,
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {isLink ? (
            <Typography
              variant="caption"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                color: `${color}.dark`,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Open
              <Iconify icon="eva:arrow-ios-forward-fill" width={14} />
            </Typography>
          ) : null}
        </Stack>
        {hint ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {hint}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={2.5} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ width: 168, height: 168, mx: 'auto', flexShrink: 0 }}>
          <Chart type="donut" series={chartSeries} options={chartOptions} width={168} height={168} />
        </Box>

        <Stack spacing={1} sx={{ width: 1, minWidth: 0 }}>
          {rows.map((row) => (
            <Stack
              key={row.label}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 1.25,
                py: 0.75,
                width: 1,
                borderRadius: 1,
                bgcolor: 'common.white',
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: row.color,
                }}
              />
              <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }} noWrap>
                {row.label}
              </Typography>
              <Typography variant="subtitle2" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {fNumber(row.value)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
