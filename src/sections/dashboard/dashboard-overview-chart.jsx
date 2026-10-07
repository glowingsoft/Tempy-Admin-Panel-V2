import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { varAlpha } from 'src/theme/styles';
import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

const PLOT_HEIGHT = 220;
const Y_TICKS = 4;

function getMaxValue(series = []) {
  return series.reduce((highest, item) => {
    const seriesMax = (Array.isArray(item?.data) ? item.data : []).reduce(
      (sum, value) => Math.max(sum, Number(value) || 0),
      0
    );
    return Math.max(highest, seriesMax);
  }, 0);
}

function ActivityBars({ categories = [], series = [], colors = [] }) {
  const theme = useTheme();
  const yMax = Math.max(Y_TICKS, Math.ceil(getMaxValue(series)));
  const ticks = Array.from({ length: Y_TICKS + 1 }, (_, index) =>
    Math.round((yMax / Y_TICKS) * (Y_TICKS - index))
  );

  return (
    <Box sx={{ px: 3, pb: 3, pt: 0.5, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mb: 2.5 }}>
        {series.map((item, index) => (
          <Stack
            key={item.name}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 1,
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 0.5,
                bgcolor: colors[index % colors.length],
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {item.name}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <Stack justifyContent="space-between" sx={{ width: 24, height: PLOT_HEIGHT, flexShrink: 0 }}>
          {ticks.map((tick) => (
            <Typography key={tick} variant="caption" color="text.disabled" sx={{ lineHeight: 1 }}>
              {tick}
            </Typography>
          ))}
        </Stack>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              position: 'relative',
              height: PLOT_HEIGHT,
              px: 0.5,
              borderRadius: 1,
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
            }}
          >
            {ticks.slice(1).map((tick) => (
              <Box
                key={`grid-${tick}`}
                sx={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  bottom: `${(tick / yMax) * 100}%`,
                  borderTop: `dashed 1px ${theme.palette.divider}`,
                }}
              />
            ))}

            <Stack
              direction="row"
              alignItems="flex-end"
              justifyContent="space-around"
              sx={{ position: 'relative', height: PLOT_HEIGHT, px: 0.5 }}
            >
              {categories.map((label, monthIndex) => (
                <Stack
                  key={`${label}-${monthIndex}`}
                  direction="row"
                  spacing={0.5}
                  alignItems="flex-end"
                  justifyContent="center"
                  sx={{ flex: 1, height: PLOT_HEIGHT, minWidth: 0 }}
                >
                  {series.map((item, seriesIndex) => {
                    const value = Number(item?.data?.[monthIndex]) || 0;
                    const barHeight = yMax ? (value / yMax) * (PLOT_HEIGHT - 8) : 0;

                    return (
                      <Tooltip
                        key={`${item.name}-${label}`}
                        title={`${item.name}: ${value}`}
                        arrow
                      >
                        <Box
                          sx={{
                            width: { xs: 7, sm: 11 },
                            maxWidth: 14,
                            height: Math.max(barHeight, value > 0 ? 10 : 0),
                            bgcolor: colors[seriesIndex % colors.length],
                            borderRadius: '6px 6px 2px 2px',
                            transition: (muiTheme) =>
                              muiTheme.transitions.create(['transform', 'filter'], {
                                duration: 160,
                              }),
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              filter: 'brightness(0.92)',
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="space-around" sx={{ pt: 1.25 }}>
            {categories.map((label, index) => (
              <Typography
                key={`${label}-axis-${index}`}
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, textAlign: 'center', minWidth: 0, fontWeight: 500 }}
              >
                {label}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function DashboardOverviewChart({
  title = 'Weekly overview',
  subheader = 'Activity across the last 12 months',
  chart = { categories: [], series: [] },
  emptyMessage = 'No data available yet',
  ...other
}) {
  const theme = useTheme();

  const chartSeries = Array.isArray(chart.series) ? chart.series : [];
  const chartCategories = Array.isArray(chart.categories) ? chart.categories : [];
  const hasData = hasChartValues(chart);

  return (
    <Card
      {...other}
      sx={{
        height: { md: 452 },
        width: 1,
        minHeight: { md: 452 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...other.sx,
      }}
    >
      <CardHeader title={title} subheader={hasData ? subheader : undefined} />

      {hasData ? (
        <ActivityBars
          categories={chartCategories}
          series={chartSeries}
          colors={[
            theme.palette.primary.main,
            theme.palette.warning.main,
            theme.palette.info.main,
          ]}
        />
      ) : (
        <DashboardEmptyState message={emptyMessage} minHeight={280} />
      )}
    </Card>
  );
}
