import { useMemo } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetUserDashboardQuery } from 'src/store/Reducer/user-dashboard-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { DashboardNavCard } from 'src/sections/dashboard/dashboard-nav-card';
import { DashboardQuickAccess } from 'src/sections/dashboard/dashboard-quick-access';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardBranchesActivity } from 'src/sections/dashboard/dashboard-branches-activity';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';
import { ModuleLoading } from 'src/components/loading-screen';


const MODULES = [
  {
    title: 'Shifts',
    description: 'Rotas · Schedules',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
    href: paths.dashboard.individualHomeCare.shifts,
  },
  {
    title: 'Locations',
    description: 'Sites · Branches',
    icon: 'solar:map-point-bold-duotone',
    color: 'success',
    href: paths.dashboard.individualHomeCare.locations,
  },
  {
    title: 'Add Job',
    description: 'Post · Open shifts',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
    href: paths.dashboard.individualHomeCare.jobs.post,
  },
  {
    title: 'Created Jobs',
    description: 'Posted · Active',
    icon: 'solar:clipboard-list-bold-duotone',
    color: 'warning',
    href: paths.dashboard.individualHomeCare.jobs.created,
  },
  {
    title: 'Job Bids',
    description: 'Review · Outcomes',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
    href: paths.dashboard.individualHomeCare.jobs.bids,
  },
];

const EMPTY_DASHBOARD = {
  stats: [],
  sparklineSeries: [],
  chart: { categories: [], series: [] },
  breakdowns: [],
  recentActivity: [],
  branchesActivity: [],
  moduleValues: {},
};

export function IndividualHomeCareDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'User';
  const { data, isLoading, isError, error } = useGetUserDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.individualHomeCare),
    [data]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        User Dashboard
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
              description="Here's what's happening across your home care today. Tap a card to open that area."
              stats={dashboard.stats}
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
              title="Home care activity"
              subheader="Jobs and bids over the last 12 months"
              chart={dashboard.chart}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardActivityList title="Recent activity" items={dashboard.recentActivity} />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardBranchesActivity
              title="Location Activity"
              items={dashboard.branchesActivity || []}
              href={paths.dashboard.individualHomeCare.locations}
            />
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
