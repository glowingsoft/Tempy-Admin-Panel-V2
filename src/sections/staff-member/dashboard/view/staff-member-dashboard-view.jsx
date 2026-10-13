import { useMemo, useState, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { useSelector } from 'react-redux';

import { useGetNurseDashboardQuery } from 'src/store/Reducer/nurse-dashboard-api';
import { useGetNurseJobsQuery } from 'src/store/Reducer/nurse-jobs-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { DashboardNavCard } from 'src/sections/dashboard/dashboard-nav-card';
import { DashboardQuickAccess } from 'src/sections/dashboard/dashboard-quick-access';
import { DashboardActivityList } from 'src/sections/dashboard/dashboard-activity-list';
import { DashboardEarningsChart } from 'src/sections/dashboard/dashboard-earnings-chart';
import { DashboardOverviewChart } from 'src/sections/dashboard/dashboard-overview-chart';
import { DashboardOverviewHeader } from 'src/sections/dashboard/dashboard-overview-header';
import { DashboardStatusBreakdown } from 'src/sections/dashboard/dashboard-status-breakdown';
import {
  StaffUpcomingShiftsCard,
  StaffEarningsSnapshotCard,
} from 'src/sections/staff-member/dashboard/staff-member-dashboard-widgets';
import { StaffRatingSnapshotCard } from 'src/sections/staff-member/dashboard/staff-member-rating-snapshot-card';
import {
  DASHBOARD_LINK_MAPS,
  withDashboardLinks,
} from 'src/sections/dashboard/dashboard-links';
import {
  findStaffJobById,
  pickUpcomingStaffJobs,
} from 'src/sections/staff-member/jobs/staff-member-job-utils';
import { StaffMemberAcceptedJobDialog } from 'src/sections/staff-member/shifts/staff-member-accepted-job-dialog';
import { useStaffCancellationStats } from 'src/sections/staff-member/jobs/use-staff-cancellation-stats';
import { StaffMemberStrikeRuleAlert } from 'src/sections/staff-member/jobs/staff-member-strike-rule-alert';
import { ModuleLoading } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

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
    showStars: true,
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

export function StaffMemberDashboardView() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const displayName = user?.basicInfo?.name || 'Staff Member';
  const [selectedJob, setSelectedJob] = useState(null);
  const { data, isLoading, isError, error } = useGetNurseDashboardQuery(
    { userId: scopeUserId },
    { skip: !scopeUserId }
  );
  const { data: jobsResponse, isLoading: jobsLoading, refetch: refetchJobs } = useGetNurseJobsQuery({
    page: 0,
    limit: 200,
  });
  const jobs = jobsResponse?.data || [];
  const dashboard = useMemo(
    () => withDashboardLinks(data || EMPTY_DASHBOARD, DASHBOARD_LINK_MAPS.staffMember),
    [data]
  );
  const upcomingJobs = useMemo(() => pickUpcomingStaffJobs(jobs, { limit: 3 }), [jobs]);
  const cancellationStats = useStaffCancellationStats();

  const openJobDetails = useCallback(
    (job) => {
      if (job) {
        setSelectedJob(job);
        return;
      }
    },
    []
  );

  const handleActivityClick = useCallback(
    (item) => {
      const job = findStaffJobById(jobs, item?.entityId);
      if (job) {
        openJobDetails(job);
      }
    },
    [jobs, openJobDetails]
  );

  const handleJobCancelled = useCallback(() => {
    setSelectedJob(null);
    refetchJobs();
  }, [refetchJobs]);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Staff Member Dashboard
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
              description="Here's what's happening with your shifts and jobs today. Tap an upcoming shift or job activity for details."
              stats={dashboard.stats}
            />
          </Grid>

          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <StaffEarningsSnapshotCard />
          </Grid>

          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardEarningsChart
              title="Your earnings"
              chart={dashboard.earningsGraph}
              href={paths.dashboard.staffMember.earnings}
            />
          </Grid>

          <Grid xs={12}>
            <StaffMemberStrikeRuleAlert cancellationStats={cancellationStats} />
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

          <Grid xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <StaffRatingSnapshotCard />
          </Grid>

          <Grid xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardActivityList
              title="Recent activity"
              items={dashboard.recentActivity}
              onItemClick={handleActivityClick}
            />
          </Grid>

          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <StaffUpcomingShiftsCard
              jobs={upcomingJobs}
              loading={jobsLoading}
              onJobClick={openJobDetails}
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

          <Grid xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <DashboardOverviewChart
              title="Your activity"
              subheader="Bookings and bids over the last 12 months"
              chart={dashboard.chart}
            />
          </Grid>
        </Grid>
      )}

      <StaffMemberAcceptedJobDialog
        open={Boolean(selectedJob)}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onCancelled={handleJobCancelled}
      />
    </DashboardContent>
  );
}
