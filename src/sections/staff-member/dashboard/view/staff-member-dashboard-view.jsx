import { useMemo } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetNurseDashboardQuery } from 'src/store/Reducer/nurse-dashboard-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { DashboardNavCard } from 'src/sections/dashboard/dashboard-nav-card';
import { DashboardQuickAccess } from 'src/sections/dashboard/dashboard-quick-access';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardBranchesActivity } from 'src/sections/dashboard/dashboard-branches-activity';
import { DashboardEarningsChart } from 'src/sections/dashboard/dashboard-earnings-chart';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardShiftsEarnings } from 'src/sections/dashboard/dashboard-shifts-earnings';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import { DashboardWinRateByRegion } from 'src/sections/dashboard/dashboard-win-rate-by-region';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';
import { ModuleLoading } from 'src/components/loading-screen';


const MODULES = [
  {
    title: 'Shifts',
    description: 'Rotas · Bookings',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
    href: paths.dashboard.staffMember.shifts,
  },
  {
    title: 'Jobs',
    description: 'Find · Apply',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
    href: paths.dashboard.staffMember.jobs,
  },
  {
    title: 'Bids',
    description: 'Submitted · Outcomes',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
    href: paths.dashboard.staffMember.bids,
  },
  {
    title: 'Reviews',
    description: '1–5 stars',
    icon: 'solar:star-bold-duotone',
    color: 'warning',
    href: paths.dashboard.staffMember.reviews,
  },
];

const EMPTY_DASHBOARD = {
  stats: [],
  sparklineSeries: [],
  chart: { categories: [], series: [] },
  breakdowns: [],
  recentActivity: [],
  branchesActivity: [],
  openJobs: [],
  winRateByRegion: [],
  shiftsAndEarnings: [],
  moduleValues: {},
};

export function StaffMemberDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'Nurse';
  const { data, isLoading, isError, error } = useGetNurseDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.staffMember),
    [data]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Nurse Dashboard
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
              description="Here's what's happening with your shifts and jobs today."
              stats={dashboard.stats}
            />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardEarningsChart
              title="Your earnings"
              chart={dashboard.earningsGraph}
              href={paths.dashboard.staffMember.earnings}
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
              title="Your activity"
              subheader="Bookings and bids over the last 12 months"
              chart={dashboard.chart}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardActivityList
              title="Recent activity"
              items={dashboard.recentActivity}
            />
          </Grid>

          <Grid xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardActivityList
              title="Open jobs"
              items={dashboard.openJobs || []}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardWinRateByRegion items={dashboard.winRateByRegion || []} />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardBranchesActivity
              title="Location Activity"
              items={dashboard.branchesActivity || []}
            />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardShiftsEarnings items={dashboard.shiftsAndEarnings || []} />
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
