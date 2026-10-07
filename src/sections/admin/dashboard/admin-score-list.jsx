import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';

import { fNumber } from 'src/utils/format-number';

import { visibleScrollY } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

export function AdminScoreList({
  title,
  subheader,
  items = [],
  emptyMessage = 'No data available yet',
  suffix = '',
  maxValue = 100,
}) {
  const theme = useTheme();
  const rows = Array.isArray(items) ? items.filter((item) => item?.label) : [];
  const hasData = rows.some((item) => Number(item.value) > 0);
  const peak = Math.max(maxValue, ...rows.map((item) => Number(item.value) || 0), 1);

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
        subheader={hasData ? subheader : undefined}
        sx={{
          flexShrink: 0,
          '& .MuiCardHeader-subheader': {
            overflow: 'visible',
            lineHeight: 1.5,
            mt: 0.5,
          },
        }}
      />

      {hasData ? (
        <Stack spacing={1.75} sx={{ px: 3, pb: 3, pt: 0.5, minHeight: 0, flexGrow: 1, ...visibleScrollY }}>
          {rows.map((item) => {
            const value = Number(item.value) || 0;
            const percent = Math.min(100, (value / peak) * 100);

            return (
              <Box key={item.label}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fNumber(value)}
                    {suffix}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: theme.vars.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      ) : (
        <DashboardEmptyState message={emptyMessage} />
      )}
    </Card>
  );
}
