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

const ROLE_META = [
  { match: /home care/i, icon: 'solar:heart-bold', color: 'secondary' },
  { match: /care home/i, icon: 'solar:home-2-bold', color: 'primary' },
  { match: /hospital/i, icon: 'solar:hospital-bold', color: 'info' },
  { match: /local authority/i, icon: 'solar:buildings-bold', color: 'warning' },
  { match: /individual/i, icon: 'solar:user-bold', color: 'success' },
  { match: /agency/i, icon: 'solar:buildings-2-bold', color: 'info' },
  { match: /nurse/i, icon: 'solar:user-id-bold', color: 'error' },
];

const FALLBACK_ROLE = { icon: 'solar:user-bold', color: 'primary' };

function money(value) {
  return fCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roleMeta(label) {
  return ROLE_META.find((item) => item.match.test(String(label || ''))) || FALLBACK_ROLE;
}

function SummaryTile({ label, value, icon, color }) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 2,
        borderRadius: 2,
        bgcolor: varAlpha(paletteColor.mainChannel, 0.08),
        border: `1px solid ${varAlpha(paletteColor.mainChannel, 0.16)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
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
          <Typography variant="h5" noWrap>
            {money(value)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ShareBar({ spend, earned, spendColor, earnedColor }) {
  const total = spend + earned;
  const spendShare = total > 0 ? (spend / total) * 100 : 0;
  const earnedShare = total > 0 ? (earned / total) * 100 : 0;

  return (
    <Box
      sx={{
        mt: 1.5,
        height: 6,
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 99,
        bgcolor: 'background.neutral',
      }}
    >
      {spendShare > 0 && <Box sx={{ width: `${spendShare}%`, bgcolor: spendColor }} />}
      {earnedShare > 0 && <Box sx={{ width: `${earnedShare}%`, bgcolor: earnedColor }} />}
    </Box>
  );
}

function RoleCard({ row }) {
  const theme = useTheme();
  const meta = roleMeta(row.label);
  const paletteColor = theme.vars.palette[meta.color] || theme.vars.palette.primary;
  const spend = Number(row.spend ?? row.billed) || 0;
  const earned = Number(row.earned) || 0;

  return (
    <Box
      sx={{
        p: 2,
        height: 1,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            color: `${meta.color}.dark`,
            bgcolor: varAlpha(paletteColor.mainChannel, 0.12),
          }}
        >
          <Iconify icon={meta.icon} width={18} />
        </Box>
        <Typography variant="subtitle2" noWrap sx={{ minWidth: 0 }}>
          {row.label}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Spend
          </Typography>
          <Typography variant="subtitle1" noWrap>
            {money(spend)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Earned
          </Typography>
          <Typography variant="subtitle1" noWrap sx={{ color: 'success.dark' }}>
            {money(earned)}
          </Typography>
        </Box>
      </Stack>

      <ShareBar
        spend={spend}
        earned={earned}
        spendColor={theme.palette.warning.main}
        earnedColor={theme.palette.success.main}
      />
    </Box>
  );
}

export function AdminFinanceByOrg({
  title = 'Spend & earned',
  subheader = 'By user type',
  list = [],
}) {
  const rows = Array.isArray(list) ? list : [];
  const spendTotal = rows.reduce((sum, row) => sum + (Number(row.spend ?? row.billed) || 0), 0);
  const earnedTotal = rows.reduce((sum, row) => sum + (Number(row.earned) || 0), 0);

  return (
    <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} />

      {rows.length ? (
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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

          <Box
            sx={{
              mt: 2.5,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {rows.map((row) => (
              <RoleCard key={row.label} row={row} />
            ))}
          </Box>
        </Box>
      ) : (
        <Stack sx={{ px: 3, pb: 3, flexGrow: 1 }}>
          <DashboardEmptyState message="No spend or earned totals yet" />
        </Stack>
      )}
    </Card>
  );
}
