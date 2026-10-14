import { useMemo } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetCareHomeDashboardQuery } from 'src/store/Reducer/care-home-dashboard-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { DashboardNavCard } from 'src/sections/dashboard/dashboard-nav-card';
import { DashboardQuickAccess } from 'src/sections/dashboard/dashboard-quick-access';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';
import { useActiveBranch } from 'src/sections/branches/active-branch-context';
import { ModuleLoading } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const MODULES = [
  {
    title: 'Shifts',
    description: 'Rotas · Schedules',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
    href: paths.dashboard.shifts,
  },
  {
    title: 'Staff',
    description: 'Team · Status',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
    href: paths.dashboard.staff.root,
  },
  {
    title: 'Add Job',
    description: 'Post · Open shifts',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
    href: paths.dashboard.jobs.post,
  },
  {
    title: 'Created Jobs',
    description: 'Posted · Active',
    icon: 'solar:clipboard-list-bold-duotone',
    color: 'warning',
    href: paths.dashboard.jobs.created,
  },
  {
    title: 'Job Bids',
    description: 'Review · Outcomes',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
    href: paths.dashboard.jobs.bids,
  },
];

const EMPTY_DASHBOARD = {
  stats: [],
  sparklineSeries: [],
  chart: { categories: [], series: [] },
  breakdowns: [],
  recentActivity: [],
  moduleValues: {},
};

export function CareHomeDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'Care Home';
  const { isAllSites, activeBranchName } = useActiveBranch();
  const { data, isLoading, isError, error } = useGetCareHomeDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.careHome),
    [data]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Care Home Dashboard
      </Typography>


      {isLoading ? (
        <ModuleLoading />
      ) : isError ? (
        <Alert severity="error">
          {error?.data?.message || error?.error || 'Could not load dashboard'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12}>
            <DashboardOverviewHeader
              title={`Welcome back 👋\n${displayName}`}
              description={
                !isAllSites && activeBranchName
                  ? `Here's what's happening at ${activeBranchName} today. Tap a card to open that area.`
                  : "Here's what's happening across your care home today. Tap a card to open that area."
              }
              stats={dashboard.stats}
              sparklineSeries={dashboard.sparklineSeries}
            />
          </Grid>

          <DashboardQuickAccess description="Jump into live sections">
            {MODULES.map((module) => (
              <Grid
                key={module.title}
                xs={12}
                sm={6}
                sx={{ display: 'flex', flexDirection: 'column' }}
              >
                <DashboardNavCard
                  {...module}
                  value={dashboard.moduleValues[module.title]}
                />
              </Grid>
            ))}
          </DashboardQuickAccess>

          <Grid xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardOverviewChart
              title="Care home activity"
              subheader="Jobs and bids over the last 12 months"
              chart={dashboard.chart}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardActivityList title="Recent activity" items={dashboard.recentActivity} />
          </Grid>

          {dashboard.breakdowns.map((item) => (
            <Grid
              key={item.title}
              xs={12}
              sm={6}
              sx={{ display: 'flex', flexDirection: 'column' }}
            >
              <DashboardStatusBreakdown
                title={item.title}
                hint={item.hint}
                series={item.series}
                color={item.color}
                href={item.href}
              />
            </Grid>
          ))}

        </Grid>
      )}
    </DashboardContent>
  );
}
