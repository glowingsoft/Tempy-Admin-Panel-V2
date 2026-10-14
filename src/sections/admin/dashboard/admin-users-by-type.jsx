import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';

import { fNumber, fPercent } from 'src/utils/format-number';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { visibleScrollY } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

const PALETTE = [
  'primary',
  'info',
  'success',
  'warning',
  'secondary',
  'error',
];

export function AdminUsersByType({ title = 'Users by account type', list = [] }) {
  const theme = useTheme();
  const rows = Array.isArray(list) ? list : [];
  const total = rows.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <Card
      sx={{
        height: { md: 452 },
        minHeight: 452,
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title={title}
        subheader={total ? `${fNumber(total)} total users` : undefined}
        sx={{ flexShrink: 0 }}
      />

      {rows.length && total ? (
        <Stack spacing={1.75} sx={{ px: 3, pb: 3, pt: 0.5, flex: 1, minHeight: 0, ...visibleScrollY }}>
          {rows.map((item, index) => {
            const value = Number(item.value) || 0;
            const colorKey = PALETTE[index % PALETTE.length];
            const barColor = theme.palette[colorKey]?.main || theme.palette.primary.main;
            const share = total ? value / total : 0;
            const href = item.href || '';

            return (
              <Box
                key={item.label || index}
                component={href ? RouterLink : 'div'}
                href={href || undefined}
                sx={{
                  display: 'block',
                  color: 'inherit',
                  textDecoration: 'none',
                  borderRadius: 1,
                  px: href ? 0.75 : 0,
                  mx: href ? -0.75 : 0,
                  py: href ? 0.5 : 0,
                  ...(href
                    ? {
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }
                    : null),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: barColor,
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500, overflowWrap: 'break-word' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {fPercent(share * 100)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ minWidth: 36, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fNumber(value)}
                  </Typography>
                  {href ? (
                    <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                  ) : null}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={share * 100}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: theme.vars.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor: barColor,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      ) : (
        <DashboardEmptyState message="No users by type yet" />
      )}
    </Card>
  );
}
