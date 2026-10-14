import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useGetAgencyDashboardQuery } from 'src/store/Reducer/agency-dashboard-api';
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

// ----------------------------------------------------------------------

const MODULES = [
  {
    title: 'Shifts',
    description: 'Rotas · Bookings',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
    href: paths.dashboard.agency.shifts,
  },
  {
    title: 'Staff',
    description: 'Team · Status',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
    href: paths.dashboard.agency.staff,
  },
  {
    title: 'Jobs',
    description: 'Find · Apply',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
    href: paths.dashboard.jobs.find,
  },
  {
    title: 'Bids',
    description: 'Submitted · Outcomes',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
    href: paths.dashboard.agency.bids,
  },
  {
    title: 'Agreements',
    description: 'Terms · DocuSign',
    icon: 'solar:document-add-bold-duotone',
    color: 'warning',
    href: paths.dashboard.agency.agreements,
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

export function AgencyDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'Agency';
  const { data, isLoading, isError, error } = useGetAgencyDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.agency),
    [data]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Agency Dashboard
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
              description="Here's what's happening across your agency today."
              stats={dashboard.stats}
            />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardEarningsChart
              chart={dashboard.earningsGraph}
              href={paths.dashboard.agency.earnings}
            />
          </Grid>

          <DashboardQuickAccess description="Jump into live sections">
            {MODULES.map((module, index) => {
              const columns = 3;
              const remainder = MODULES.length % columns || columns;
              const inLastRow = index >= MODULES.length - remainder;

              return (
              <Grid
                key={module.title}
                xs={12}
                sm={MODULES.length % 2 === 1 && index === MODULES.length - 1 ? 12 : 6}
                md={inLastRow ? 12 / remainder : 12 / columns}
                sx={{ display: 'flex', flexDirection: 'column' }}
              >
                <DashboardNavCard
                  {...module}
                  value={dashboard.moduleValues[module.title]}
                />
              </Grid>
              );
            })}
          </DashboardQuickAccess>

          <Grid xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardOverviewChart
              title="Agency activity"
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
