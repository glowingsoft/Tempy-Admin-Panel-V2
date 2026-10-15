import { useMemo } from 'react';

import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetAdminDashboardQuery } from 'src/store/Reducer/admin-dashboard-api';

import { DashboardStatCard } from 'src/sections/dashboard/dashboard-stat-card';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';

import { AnalyticsCurrentVisits } from 'src/sections/overview/analytics/analytics-current-visits';
import { AnalyticsOrderTimeline } from 'src/sections/overview/analytics/analytics-order-timeline';

import { AppCurrentDownload } from 'src/sections/overview/app/app-current-download';

import { AdminTopPerformers } from '../admin-top-performers';
import { AdminUsersByType } from '../admin-users-by-type';
import { AdminScoreList } from '../admin-score-list';
import { AdminRegionalFillRates } from '../admin-regional-fill-rates';
import { AdminRegionalHeatMap } from '../admin-regional-heat-map';
import { AdminFinanceByOrg } from '../admin-finance-by-org';
import { AdminAllegationsOverview } from 'src/sections/admin/allegations/admin-allegations-overview';
import { ModuleLoading } from 'src/components/loading-screen';

const EMPTY_DASHBOARD = {
  stats: [],
  extraStats: [],
  breakdowns: [],
  usersByType: [],
  jobStatus: [],
  customerSupplier: [],
  bidsStatus: [],
  bidsTotal: 0,
  permanentHires: { total: 0, series: [] },
  allegations: { total: 0, series: [] },
  allegationFeeds: { total: 0, series: [] },
  monthlyActivity: { categories: [], series: [] },
  growthChart: { categories: [], series: [] },
  regionalFillRates: { categories: [], series: [] },
  regionalHeatMap: [],
  heatMapChart: { categories: [], series: [] },
  platformHealth: { categories: [], series: [] },
  healthRows: [],
  fillRate: 0,
  completionRate: 0,
  timeline: [],
  topPerformers: [],
  recentActivity: [],
  moneyByOrg: [],
};

export function AdminDashboardView() {
  const theme = useTheme();
  const { user } = useSelector((state) => state.user);
  const displayName = user?.basicInfo?.name || 'Admin';
  const { data, isLoading, isError, error } = useGetAdminDashboardQuery();
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.admin),
    [data]
  );

  return (
    <DashboardContent
      maxWidth="xl"
      sx={{ minWidth: 0, overflowX: 'hidden', width: 1 }}
    >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Admin Dashboard
      </Typography>

      {isLoading ? (
        <ModuleLoading />
      ) : isError ? (
        <Alert severity="error">
          {error?.data?.message || error?.error || 'Could not load dashboard'}
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ width: 1, minWidth: 0 }}>
          <Grid xs={12} sx={{ minWidth: 0 }}>
            <DashboardOverviewHeader
              title={`Welcome back 👋\n${displayName}`}
              description="Here's what's happening across your platform today."
              stats={dashboard.stats}
            />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AdminFinanceByOrg
              list={dashboard.moneyByOrg}
              subheader="Platform totals"
            />
          </Grid>

          <Grid xs={12} sx={{ minWidth: 0 }}>
            <AdminAllegationsOverview />
          </Grid>

          {dashboard.extraStats.map((stat) => (
            <Grid key={stat.title} xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
              <DashboardStatCard
                title={stat.title}
                total={stat.total}
                icon={stat.icon}
                color={stat.color}
                href={stat.href}
              />
            </Grid>
          ))}

          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AppCurrentDownload
              title="Job status mix"
              emptyMessage="No job status data yet"
              sx={{ minHeight: 360, minWidth: 0 }}
              chart={{
                colors: [
                  theme.palette.info.main,
                  theme.palette.grey[500],
                  theme.palette.success.main,
                ],
                series: dashboard.jobStatus,
              }}
            />
          </Grid>

          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AppCurrentDownload
              title="Customers & suppliers"
              subheader="Registered accounts"
              emptyMessage="No customer or supplier totals yet"
              sx={{ minHeight: 360, minWidth: 0 }}
              chart={{
                colors: [theme.palette.primary.main, theme.palette.info.main],
                series: dashboard.customerSupplier,
              }}
            />
          </Grid>

          <Grid xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AnalyticsCurrentVisits
              title="Bids by status"
              subheader={`${dashboard.bidsTotal} bids in total`}
              emptyMessage="No bid data yet"
              sx={{ height: 1, minHeight: 360, minWidth: 0 }}
              chart={{
                series: dashboard.bidsStatus,
                colors: [
                  theme.palette.warning.main,
                  theme.palette.success.main,
                  theme.palette.error.main,
                  theme.palette.grey[500],
                ],
              }}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AdminUsersByType list={dashboard.usersByType} />
          </Grid>

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardOverviewChart
              title="Platform activity"
              subheader="Jobs, bids & filled shifts over the last 12 months"
              emptyMessage="No monthly activity yet"
              chart={dashboard.monthlyActivity}
            />
          </Grid>

          <Grid xs={12} sx={{ minWidth: 0 }}>
            <AdminRegionalHeatMap points={dashboard.regionalHeatMap} />
          </Grid>

          <Grid xs={12} sm={6} md={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardStatusBreakdown
              title="Permanent hires"
              series={dashboard.permanentHires.series}
              total={dashboard.permanentHires.total}
              color="success"
              href={paths.adminDashboard.recruitment}
            />
          </Grid>

          <Grid xs={12} sm={6} md={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardStatusBreakdown
              title="Allegations"
              series={dashboard.allegations.series}
              total={dashboard.allegations.total}
              color="error"
              href={paths.adminDashboard.allegations}
            />
          </Grid>

          <Grid xs={12} sm={6} md={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardStatusBreakdown
              title="Allegation sources"
              series={dashboard.allegationFeeds.series}
              total={dashboard.allegationFeeds.total}
              color="warning"
              href={paths.adminDashboard.allegations}
            />
          </Grid>

          {dashboard.breakdowns.map((item) => (
            <Grid
              key={item.title}
              xs={12}
              sm={6}
              md={3}
              sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
            >
              <DashboardStatusBreakdown
                title={item.title}
                series={item.series}
                total={item.total}
                color={item.color}
                href={item.href}
              />
            </Grid>
          ))}

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AdminRegionalFillRates
              title="Regional fill rates"
              subheader={`Fill rate ${dashboard.fillRate}% · Completion ${dashboard.completionRate}%`}
              chart={dashboard.regionalFillRates}
            />
          </Grid>

          <Grid xs={12} md={6} lg={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AdminScoreList title="Platform health" items={dashboard.healthRows} suffix="%" />
          </Grid>

          <Grid xs={12} md={6} lg={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AnalyticsOrderTimeline
              title="Platform timeline"
              emptyMessage="No timeline events yet"
              list={dashboard.timeline}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <AdminTopPerformers
              title="Top performers"
              emptyMessage="No top performers yet"
              list={dashboard.topPerformers}
            />
          </Grid>

          <Grid xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardOverviewChart
              title="Customers & suppliers growth"
              subheader="Registrations over the last 12 months"
              emptyMessage="No growth data yet"
              chart={dashboard.growthChart}
            />
          </Grid>

          <Grid xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <DashboardActivityList
              title="Recent platform activity"
              items={dashboard.recentActivity}
            />
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
