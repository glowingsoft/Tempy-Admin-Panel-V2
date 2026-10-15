import { useMemo } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetHomeCareCompanyDashboardQuery } from 'src/store/Reducer/home-care-company-dashboard-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { DashboardNavCard } from 'src/sections/dashboard/dashboard-nav-card';
import { DashboardQuickAccess } from 'src/sections/dashboard/dashboard-quick-access';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardEarningsChart } from 'src/sections/dashboard/dashboard-earnings-chart';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';
import { ModuleLoading } from 'src/components/loading-screen';


const ROOT = paths.dashboard.homeCareCompany;

const MODULES = [
  {
    title: 'Shifts',
    description: 'Rotas · Bookings',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
    href: ROOT.shifts,
  },
  {
    title: 'Staff',
    description: 'Team · Status',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
    href: ROOT.staff,
  },
  {
    title: 'Jobs',
    description: 'Find · Apply',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
    href: ROOT.jobs,
  },
  {
    title: 'Bids',
    description: 'Submitted · Outcomes',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
    href: ROOT.bids,
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

export function HomeCareCompanyDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'Home Care Company';
  const { data, isLoading, isError, error } = useGetHomeCareCompanyDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.homeCareCompany),
    [data]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Home Care Company Dashboard
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
              description="Here's what's happening across your company today."
              stats={dashboard.stats}
            />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardEarningsChart
              chart={dashboard.earningsGraph}
              href={ROOT.earnings}
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
              title="Company activity"
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
