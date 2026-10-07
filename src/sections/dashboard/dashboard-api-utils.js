import { fToNow } from 'src/utils/format-time';

import { getWorkflowStatusColorKey } from './dashboard-status-colors';

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function lastPoints(data, size = 7) {
  if (!Array.isArray(data) || !data.length) return [];
  const list = data.map(toCount);
  if (list.length >= size) return list.slice(-size);
  return [...Array(size - list.length).fill(0), ...list];
}

function statusSeries(source = {}, keys = []) {
  return keys
    .map(({ key, label, colorKey }) => ({
      label,
      value: toCount(source[key]),
      colorKey: colorKey || getWorkflowStatusColorKey(key) || getWorkflowStatusColorKey(label),
    }))
    .filter((item) => item.label);
}

const ACTIVITY_ICONS = {
  job: 'solar:case-round-bold',
  bid: 'solar:document-text-bold',
  booking: 'solar:calendar-bold',
  staff: 'solar:user-plus-bold',
};

const ACTIVITY_COLORS = {
  job: 'primary',
  bid: 'warning',
  booking: 'info',
  staff: 'success',
};

export function mapCustomerDashboardFromApi(response) {
  const data = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
  const jobs = data.jobs && typeof data.jobs === 'object' ? data.jobs : {};
  const bookings = data.bookings && typeof data.bookings === 'object' ? data.bookings : {};
  const staff = data.staff && typeof data.staff === 'object' ? data.staff : {};
  const bids = data.bids && typeof data.bids === 'object' ? data.bids : {};
  const monthly =
    data.monthlyActivity && typeof data.monthlyActivity === 'object' ? data.monthlyActivity : {};

  const monthlyCategories = Array.isArray(monthly.categories) ? monthly.categories : [];
  const monthlySeries = Array.isArray(monthly.series)
    ? monthly.series.map((item) => ({
        name: item?.name || 'Series',
        data: Array.isArray(item?.data) ? item.data.map(toCount) : monthlyCategories.map(() => 0),
      }))
    : [
        { name: 'Jobs', data: monthlyCategories.map(() => 0) },
        { name: 'Bids', data: monthlyCategories.map(() => 0) },
      ];

  const jobsMonthly = monthlySeries.find((item) => String(item.name).toLowerCase() === 'jobs');
  const bidsMonthly = monthlySeries.find((item) => String(item.name).toLowerCase() === 'bids');

  return {
    stats: [
      {
        title: 'Total bookings',
        total: toCount(summary.totalBookings),
        icon: 'solar:calendar-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Active staff',
        total: toCount(summary.activeStaff),
        icon: 'solar:users-group-rounded-bold-duotone',
        color: 'info',
      },
      {
        title: 'Active jobs',
        total: toCount(
          summary.scheduledJobs ?? summary.filledJobs ?? jobs.scheduled ?? bookings.active
        ),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Pending jobs',
        total: toCount(summary.pendingJobs ?? jobs.pending ?? jobs.active),
        icon: 'solar:clipboard-list-bold-duotone',
        color: 'warning',
      },
      {
        title: 'Completed jobs',
        total: toCount(jobs.completed),
        icon: 'solar:check-circle-bold-duotone',
        color: 'success',
      },
    ],
    sparklineSeries: [
      [],
      [],
      lastPoints(jobsMonthly?.data),
      lastPoints(jobsMonthly?.data),
      lastPoints(jobsMonthly?.data),
    ],
    chart: {
      categories: monthlyCategories,
      series: monthlySeries,
    },
    breakdowns: [
      {
        title: 'Jobs by status',
        color: 'primary',
        hint: 'Active = open or filled · Completed = finished · Cancelled = closed without completing',
        series: statusSeries(jobs, [
          { key: 'active', label: 'Active', colorKey: 'info' },
          { key: 'inactive', label: 'Inactive', colorKey: 'error' },
          { key: 'completed', label: 'Completed', colorKey: 'success' },
          { key: 'deleted', label: 'Deleted', colorKey: 'default' },
        ]),
      },
      {
        title: 'Bookings by status',
        color: 'info',
        // Active ≠ In progress: scheduled upcoming vs currently on shift
        hint: 'Scheduled = confirmed upcoming · In progress = live now',
        series: statusSeries(bookings, [
          { key: 'pending', label: 'Pending', colorKey: 'warning' },
          { key: 'active', label: 'Scheduled', colorKey: 'info' },
          { key: 'inProgress', label: 'In progress', colorKey: 'primary' },
          { key: 'completed', label: 'Completed', colorKey: 'success' },
          { key: 'cancelled', label: 'Cancelled', colorKey: 'error' },
        ]),
      },
      {
        title: 'Staff by status',
        color: 'warning',
        hint: 'Active = available · Pending = awaiting acceptance',
        series: statusSeries(staff, [
          { key: 'active', label: 'Active', colorKey: 'info' },
          { key: 'pending', label: 'Pending', colorKey: 'warning' },
          { key: 'inactive', label: 'Inactive', colorKey: 'default' },
        ]),
      },
      {
        title: 'Bids by status',
        color: 'success',
        hint: 'Pending = waiting · Accepted = won · Rejected = declined',
        series: statusSeries(bids, [
          { key: 'pending', label: 'Pending', colorKey: 'warning' },
          { key: 'accepted', label: 'Accepted', colorKey: 'success' },
          { key: 'rejected', label: 'Rejected', colorKey: 'error' },
          { key: 'withdrawn', label: 'Withdrawn', colorKey: 'default' },
        ]),
      },
    ],
    recentActivity: (Array.isArray(data.recentActivity) ? data.recentActivity : []).map((item) => {
      const type = String(item?.type || '').toLowerCase();
      const title = String(item?.title || '').trim();
      const description = String(item?.description || '').trim();
      const entityId = String(item?.jobId || item?.job || item?.id || '').trim();
      return {
        id: String(item?.id || `${title}-${item?.createdAt || ''}`),
        label: [title, description].filter(Boolean).join(' · ') || 'Activity',
        time: item?.createdAt ? fToNow(item.createdAt) : String(item?.status || ''),
        icon: item?.icon || ACTIVITY_ICONS[type] || 'solar:bell-bold',
        color: ACTIVITY_COLORS[type] || 'primary',
        activityType: type,
        entityId: type === 'job' ? entityId : '',
        clickable: type === 'job' && Boolean(entityId),
      };
    }),
    moduleValues: {
      Shifts: String(toCount(bookings.total)),
      Staff: String(toCount(staff.total)),
      'Created Jobs': String(toCount(jobs.total)),
      'Add Job': String(toCount(jobs.active)),
      'Job Bids': String(toCount(bids.total)),
    },
  };
}

export const mapCareHomeDashboardFromApi = mapCustomerDashboardFromApi;

/** Supplier `earningsGraph`: last 12 months of completed-booking earnings, oldest month first. */
function mapEarningsGraph(graph) {
  const source = graph && typeof graph === 'object' ? graph : {};
  const categories = Array.isArray(source.categories) ? source.categories.map(String) : [];
  const firstSeries = Array.isArray(source.series) ? source.series[0] : null;
  const seriesData = Array.isArray(firstSeries?.data) ? firstSeries.data : [];
  const points = Array.isArray(source.points) ? source.points : [];
  const data = categories.map((_, index) => toCount(seriesData[index]));

  return {
    categories,
    series: [{ name: firstSeries?.name || 'Earnings', data }],
    total: source.total != null ? toCount(source.total) : data.reduce((sum, v) => sum + v, 0),
    points: categories.map((_, index) => ({
      month: String(points[index]?.month || ''),
      hours: toCount(points[index]?.hours),
      bookings: toCount(points[index]?.bookings),
    })),
  };
}

export function mapAgencyDashboardFromApi(response) {
  const mapped = mapCustomerDashboardFromApi(response);
  const data = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
  const jobs = data.jobs && typeof data.jobs === 'object' ? data.jobs : {};
  const bookings = data.bookings && typeof data.bookings === 'object' ? data.bookings : {};
  const staff = data.staff && typeof data.staff === 'object' ? data.staff : {};
  const bids = data.bids && typeof data.bids === 'object' ? data.bids : {};

  return {
    ...mapped,
    earningsGraph: mapEarningsGraph(data.earningsGraph),
    stats: [
      {
        title: 'New jobs',
        total: toCount(summary.newJobs),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Active bookings',
        total: toCount(summary.activeBookings),
        icon: 'solar:calendar-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Total staff',
        total: toCount(summary.totalStaff),
        icon: 'solar:users-group-rounded-bold-duotone',
        color: 'info',
      },
      {
        title: 'Active staff',
        total: toCount(summary.activeStaff),
        icon: 'solar:user-check-bold-duotone',
        color: 'success',
      },
    ],
    moduleValues: {
      Shifts: String(toCount(bookings.total)),
      Staff: String(toCount(staff.total)),
      Jobs: String(toCount(summary.newJobs) || toCount(jobs.total)),
      Bids: String(toCount(bids.total)),
    },
  };
}

export const mapSupplierDashboardFromApi = mapAgencyDashboardFromApi;

/** Employee / nurse dashboard — not the same as agency “staff” stats. */
export function mapNurseDashboardFromApi(response) {
  const mapped = mapAgencyDashboardFromApi(response);
  const data = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
  const jobs = data.jobs && typeof data.jobs === 'object' ? data.jobs : {};
  const bookings = data.bookings && typeof data.bookings === 'object' ? data.bookings : {};
  const bids = data.bids && typeof data.bids === 'object' ? data.bids : {};
  // Shifts worked through an agency/company are paid by them, so they're excluded from earningsGraph.
  const agencySupplied = data.earnings?.agencySupplied || {};

  return {
    ...mapped,
    earningsGraph: {
      ...mapped.earningsGraph,
      agencySupplied: {
        bookings: toCount(agencySupplied.bookings),
        hours: toCount(agencySupplied.hours),
      },
    },
    stats: [
      {
        title: 'Jobs to bid on',
        total: toCount(summary.newJobs ?? jobs.open ?? jobs.total),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Confirmed shifts',
        total: toCount(summary.activeBookings ?? bookings.active ?? bookings.total),
        icon: 'solar:calendar-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Pending bids',
        total: toCount(summary.pendingBids ?? bids.pending ?? bids.total),
        icon: 'solar:document-text-bold-duotone',
        color: 'warning',
      },
      {
        title: 'Total bookings',
        total: toCount(summary.totalBookings ?? bookings.total ?? summary.activeBookings),
        icon: 'solar:checklist-bold-duotone',
        color: 'info',
      },
    ],
  };
}
