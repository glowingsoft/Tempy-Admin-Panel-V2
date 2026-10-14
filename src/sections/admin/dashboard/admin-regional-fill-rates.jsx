import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { visibleScrollY } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function AdminRegionalFillRates({
  title = 'Regional fill rates',
  subheader,
  chart = { categories: [], series: [] },
}) {
  const theme = useTheme();
  const categories = Array.isArray(chart?.categories) ? chart.categories : [];
  const seriesItem = Array.isArray(chart?.series) ? chart.series[0] : null;
  const values = Array.isArray(seriesItem?.data) ? seriesItem.data.map(toCount) : [];
  const seriesName = String(seriesItem?.name || 'Fill Rate').trim() || 'Fill Rate';
  const hasData = categories.length > 0;
  const peak = Math.max(100, ...values, 1);

  return (
    <Card
      sx={{
        height: 1,
        minHeight: 360,
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title={title}
        subheader={hasData ? subheader || seriesName : undefined}
        sx={{
          flexShrink: 0,
          '& .MuiCardHeader-subheader': { overflow: 'visible', lineHeight: 1.5, mt: 0.5 },
        }}
      />

      {hasData ? (
        <Stack spacing={1.5} sx={{ px: 3, pb: 3, pt: 0.5, minHeight: 0, flexGrow: 1, ...visibleScrollY }}>
          {categories.map((label, index) => {
            const value = toCount(values[index]);
            const width = `${Math.max(0, Math.min(100, (value / peak) * 100))}%`;

            return (
              <Box key={`${label}-${index}`}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}>
                    {String(label || '').trim() || '—'}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {value}%
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: theme.vars.palette.grey[200],
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width,
                      height: 1,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <DashboardEmptyState message="No regional fill rates yet" />
      )}
    </Card>
  );
}
