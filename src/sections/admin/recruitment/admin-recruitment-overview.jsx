import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fToNow } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { DashboardStatCard } from 'src/sections/dashboard/dashboard-stat-card';
import { AnalyticsCurrentVisits } from 'src/sections/overview/analytics/analytics-current-visits';

import { getRecruitmentStatusOption } from './admin-recruitment-constants';
import { useAdminRecruitment } from './use-admin-recruitment';

// ----------------------------------------------------------------------

export function AdminRecruitmentOverview() {
  const theme = useTheme();
  const { summary } = useAdminRecruitment();

  return (
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h6">Permanent hire</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track workers moving from temp shifts into permanent roles across the platform.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          href={paths.adminDashboard.recruitment}
          variant="contained"
          size="small"
          startIcon={<Iconify icon="solar:arrow-right-bold" />}
        >
          Manage pipeline
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Accepted"
            total={summary.accepted}
            icon="solar:calendar-bold-duotone"
            color="info"
            href={paths.adminDashboard.recruitment}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Hired"
            total={summary.hired}
            icon="solar:document-text-bold-duotone"
            color="warning"
            href={paths.adminDashboard.recruitment}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Total"
            total={summary.total}
            icon="solar:user-check-rounded-bold-duotone"
            color="success"
            href={paths.adminDashboard.recruitment}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Conversion rate"
            total={`${summary.conversionRate}%`}
            icon="solar:chart-2-bold-duotone"
            color="primary"
            href={paths.adminDashboard.recruitment}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid xs={12} md={5}>
          <AnalyticsCurrentVisits
            title="Pipeline status"
            subheader="Active temp-to-perm requests"
            emptyMessage="No permanent hire data yet"
            sx={{ height: 1, minHeight: 320 }}
            chart={{
              series: summary.pipeline,
              colors: [
                theme.palette.info.main,
                theme.palette.warning.main,
                theme.palette.primary.main,
                theme.palette.success.main,
                theme.palette.grey[500],
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={7}>
          <Card variant="outlined" sx={{ p: 2, height: 1, minHeight: 320 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Recent activity
            </Typography>

            {summary.recent.length ? (
              <Stack spacing={1.5}>
                {summary.recent.map((item) => {
                  const status = getRecruitmentStatusOption(item.status);
                  return (
                    <Stack
                      key={item.id}
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={2}
                      sx={{
                        py: 1,
                        borderBottom: (muiTheme) => `1px dashed ${muiTheme.palette.divider}`,
                        '&:last-of-type': { borderBottom: 0 },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {item.workerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          {item.employerName} · {item.role}
                        </Typography>
                      </Box>

                      <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Label color={status.color} variant="soft">
                          {status.label}
                        </Label>
                        <Typography variant="caption" color="text.secondary">
                          {item.updatedAt ? fToNow(item.updatedAt) : '—'}
                        </Typography>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent temp-to-perm activity.
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Card>
  );
}
