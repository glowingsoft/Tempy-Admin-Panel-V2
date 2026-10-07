import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { varAlpha, bgGradient } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function AppWidgetSummary({
  title,
  percent,
  total,
  icon,
  color,
  chart,
  formatTotal,
  formatTooltip,
  trendLabel = 'last 7 days',
  sx,
  ...other
}) {
  const theme = useTheme();
  const paletteColor = color ? theme.vars.palette[color] : null;
  const displayTotal = typeof formatTotal === 'function' ? formatTotal(total) : fNumber(total);
  const tooltipFormatter =
    typeof formatTooltip === 'function'
      ? formatTooltip
      : typeof formatTotal === 'function'
        ? formatTotal
        : fNumber;

  const chartColors = chart.colors ?? [theme.palette.primary.main];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    stroke: { width: 0 },
    xaxis: { categories: chart.categories },
    tooltip: {
      y: { formatter: (value) => tooltipFormatter(value), title: { formatter: () => '' } },
    },
    plotOptions: { bar: { borderRadius: 1.5, columnWidth: '64%' } },
    ...chart.options,
  });

  const hasSparkline = Array.isArray(chart?.series) && chart.series.length > 0;
  const showTrend = typeof percent === 'number' && Number.isFinite(percent);

  const renderTrending = showTrend ? (
    <Box
      sx={{
        gap: 0.5,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}
    >
      <Iconify
        width={20}
        icon={
          percent < 0
            ? 'solar:double-alt-arrow-down-bold-duotone'
            : 'solar:double-alt-arrow-up-bold-duotone'
        }
        sx={{ flexShrink: 0, color: 'success.main', ...(percent < 0 && { color: 'error.main' }) }}
      />

      <Box component="span" sx={{ typography: 'subtitle2', fontSize: 13, flexShrink: 0 }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
      <Box
        component="span"
        sx={{ typography: 'caption', color: 'text.secondary', fontSize: 12, flexShrink: 0 }}
      >
        {trendLabel}
      </Box>
    </Box>
  ) : null;

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 3,
        ...(paletteColor && {
          ...bgGradient({
            color: `135deg, ${varAlpha(paletteColor.lighterChannel, 0.4)}, ${varAlpha(paletteColor.lightChannel, 0.16)}`,
          }),
          boxShadow: 'none',
          backgroundColor: 'common.white',
        }),
        ...sx,
      }}
      {...other}
    >
      {icon ? (
        <Box
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            bgcolor: paletteColor ? 'common.white' : 'background.neutral',
            color: color ? `${color}.main` : 'text.secondary',
          }}
        >
          <Iconify icon={icon} width={26} />
        </Box>
      ) : null}

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ typography: 'subtitle2', color: 'text.secondary' }}>{title}</Box>
        <Box sx={{ mt: 1, mb: showTrend ? 1 : 0, typography: 'h3' }}>{displayTotal}</Box>
        {renderTrending}
      </Box>

      {hasSparkline ? (
        <Chart
          type="bar"
          series={[{ data: chart.series }]}
          options={chartOptions}
          width={60}
          height={40}
        />
      ) : null}
    </Card>
  );
}
