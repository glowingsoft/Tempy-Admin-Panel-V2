import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

function money(value) {
  return fCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryTile({ label, value, icon, color }) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        bgcolor: varAlpha(paletteColor.mainChannel, 0.08),
        border: `1px solid ${varAlpha(paletteColor.mainChannel, 0.16)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            color: `${color}.darker`,
            bgcolor: varAlpha(paletteColor.mainChannel, 0.16),
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              fontSize: { xs: '1.15rem', sm: '1.5rem' },
            }}
          >
            {money(value)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function AdminFinanceByOrg({
  title = 'Spend & earned',
  subheader = 'Platform totals',
  list = [],
}) {
  const rows = Array.isArray(list) ? list : [];
  const spendTotal = rows.reduce((sum, row) => sum + (Number(row.spend ?? row.billed) || 0), 0);
  const earnedTotal = rows.reduce((sum, row) => sum + (Number(row.earned) || 0), 0);

  return (
    <Card sx={{ height: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      <CardHeader title={title} subheader={subheader} />

      {rows.length ? (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, minWidth: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: 0 }}>
            <SummaryTile
              label="Total spend"
              value={spendTotal}
              icon="solar:wallet-money-bold"
              color="warning"
            />
            <SummaryTile
              label="Total earned"
              value={earnedTotal}
              icon="solar:graph-up-bold-duotone"
              color="success"
            />
          </Stack>
        </Box>
      ) : (
        <Stack sx={{ px: 3, pb: 3, flexGrow: 1 }}>
          <DashboardEmptyState message="No spend or earnings data yet" />
        </Stack>
      )}
    </Card>
  );
}
