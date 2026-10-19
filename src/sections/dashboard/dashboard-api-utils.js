import { fDate, fToNow } from 'src/utils/format-time';

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

function humanizeKey(key) {
  const spaced = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isSkippedCountKey(key) {
  return key === 'total' || /rate|percent/i.test(key);
}

function extraStatusRows(source, usedKeys) {
  const used = new Set(usedKeys);
  return Object.entries(source || {})
    .filter(([key, value]) => {
      if (used.has(key) || isSkippedCountKey(key)) return false;
      if (value && typeof value === 'object') return false;
      return Number.isFinite(Number(value));
    })
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value: toCount(value),
      colorKey: getWorkflowStatusColorKey(key) || 'default',
    }))
    .filter((item) => item.label);
}

function statusSeries(source = {}, keys = []) {
  const known = keys
    .map(({ key, label, colorKey }) => ({
      label,
      value: toCount(source[key]),
      colorKey: colorKey || getWorkflowStatusColorKey(key) || getWorkflowStatusColorKey(label),
    }))
    .filter((item) => item.label);

  return [...known, ...extraStatusRows(source, keys.map((item) => item.key))];
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

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseMonthIndex(label) {
  const raw = String(label || '').trim();
  if (!raw) return -1;

  const iso = raw.match(/^(\d{4})-(\d{1,2})/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? month - 1 : -1;
  }

  const short = raw.slice(0, 3).toLowerCase();
  return SHORT_MONTHS.findIndex((m) => m.toLowerCase() === short);
}

function toCalendarJanFirst(categories = [], series = [], extraRows = []) {
  if (!Array.isArray(categories) || categories.length < 2) {
    return { categories, series, extraRows };
  }

  const stamped = categories.map((label, index) => ({
    index,
    monthIdx: parseMonthIndex(label),
  }));
  if (stamped.some((row) => row.monthIdx < 0)) {
    return { categories, series, extraRows };
  }

  stamped.sort((a, b) => a.monthIdx - b.monthIdx || a.index - b.index);
  const order = stamped.map((row) => row.index);

  return {
    categories: order.map((i) => categories[i]),
    series: (Array.isArray(series) ? series : []).map((item) => ({
      ...item,
      data: order.map((i) => toCount(item?.data?.[i])),
    })),
    extraRows: Array.isArray(extraRows) ? order.map((i) => extraRows[i]) : extraRows,
  };
}

function mapBranchesActivity(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const location = item?.location && typeof item.location === 'object' ? item.location : {};
      const rating = item?.rating && typeof item.rating === 'object' ? item.rating : {};
      const id = String(item?.id || '').trim();
      const name = String(
        item?.description || location.title || item?.title || 'Location'
      ).trim();
      const address = String(
        location.fullAddress || [location.city, location.state, location.country].filter(Boolean).join(', ')
      ).trim();
      const status = String(item?.status || '').trim().toLowerCase() || 'pending';

      return {
        id,
        name,
        address,
        status,
        city: String(location.city || '').trim(),
        avatarUrl: String(item?.profileIcon || '').trim(),
        ratingAverage: toCount(rating.average),
        ratingCount: toCount(rating.count),
        createdAt: item?.createdAt || '',
        time: item?.createdAt ? fToNow(item.createdAt) : '',
      };
    })
    .filter((item) => item.id || item.name);
}

export function mapCustomerDashboardFromApi(response) {
  const data = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
  const jobs = data.jobs && typeof data.jobs === 'object' ? data.jobs : {};
  const bookings = data.bookings && typeof data.bookings === 'object' ? data.bookings : {};
  const staff = data.staff && typeof data.staff === 'object' ? data.staff : {};
  const branches = data.branches && typeof data.branches === 'object' ? data.branches : {};
  const bids = data.bids && typeof data.bids === 'object' ? data.bids : {};
  const monthly =
    data.monthlyActivity && typeof data.monthlyActivity === 'object' ? data.monthlyActivity : {};

  const rawCategories = Array.isArray(monthly.categories) ? monthly.categories : [];
  const rawSeries = Array.isArray(monthly.series)
    ? monthly.series.map((item) => ({
        name: item?.name || 'Series',
        data: Array.isArray(item?.data) ? item.data.map(toCount) : rawCategories.map(() => 0),
      }))
    : [
        { name: 'Jobs', data: rawCategories.map(() => 0) },
        { name: 'Bids', data: rawCategories.map(() => 0) },
      ];

  const { categories: monthlyCategories, series: monthlySeries } = toCalendarJanFirst(
    rawCategories,
    rawSeries
  );

  const jobsMonthly = monthlySeries.find((item) => String(item.name).toLowerCase() === 'jobs');
  const bidsMonthly = monthlySeries.find((item) => String(item.name).toLowerCase() === 'bids');
  const hasBranches =
    Object.keys(branches).length > 0 ||
    summary.totalBranches != null ||
    summary.activeBranches != null;

  return {
    stats: [
      {
        title: 'Total jobs',
        total: toCount(summary.totalJobs ?? jobs.total),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Active jobs',
        total: toCount(summary.activeJobs ?? jobs.active),
        icon: 'solar:clipboard-list-bold-duotone',
        color: 'warning',
      },
      {
        title: 'Total bookings',
        total: toCount(summary.totalBookings ?? bookings.total),
        icon: 'solar:calendar-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Active staff',
        total: toCount(summary.activeStaff ?? staff.active),
        icon: 'solar:users-group-rounded-bold-duotone',
        color: 'info',
      },
      {
        title: 'Locations',
        total: toCount(summary.totalBranches ?? branches.total),
        icon: 'solar:map-point-bold-duotone',
        color: 'success',
      },
    ],
    sparklineSeries: [
      lastPoints(jobsMonthly?.data),
      lastPoints(jobsMonthly?.data),
      [],
      [],
      [],
    ],
    chart: {
      categories: monthlyCategories,
      series: monthlySeries,
    },
    breakdowns: [
      ...(hasBranches
        ? [
            {
              title: 'Locations by status',
              color: 'secondary',
              hint: 'Active = live sites · Pending = awaiting setup · Inactive = closed',
              series: statusSeries(branches, [
                { key: 'active', label: 'Active', colorKey: 'info' },
                { key: 'pending', label: 'Pending', colorKey: 'warning' },
                { key: 'inactive', label: 'Inactive', colorKey: 'default' },
              ]),
            },
          ]
        : []),
      {
        title: 'Jobs by status',
        color: 'primary',
        hint: 'Active = open or filled · Inactive = closed · Completed = finished',
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
    branchesActivity: mapBranchesActivity(data.branchesActivity),
    moduleValues: {
      Shifts: String(toCount(bookings.total)),
      Staff: String(toCount(staff.total)),
      'Created Jobs': String(toCount(jobs.total)),
      'Add Job': String(toCount(summary.activeJobs ?? jobs.active)),
      'Job Bids': String(toCount(bids.total)),
      Locations: String(toCount(summary.totalBranches ?? branches.total)),
      ...(data.contracts?.total != null
        ? { Contracts: String(toCount(data.contracts.total)) }
        : {}),
    },
  };
}

export const mapCareHomeDashboardFromApi = mapCustomerDashboardFromApi;

function mapMoneyBlock(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return null;

  const amount = Number(block.amount);
  const hours = Number(block.hours);
  const bookings = Number(block.bookings);
  const formatted = String(block.formatted || '').trim();
  if (!Number.isFinite(amount) && !formatted && !Number.isFinite(bookings)) return null;

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    formatted,
    hours: Number.isFinite(hours) ? hours : 0,
    bookings: Number.isFinite(bookings) ? bookings : 0,
  };
}

function readUpcomingBlock(data) {
  const earnings = data.earnings && typeof data.earnings === 'object' ? data.earnings : {};
  const graph = data.earningsGraph && typeof data.earningsGraph === 'object' ? data.earningsGraph : {};
  return mapMoneyBlock(data.upcoming || earnings.upcoming || graph.upcoming);
}

function mapEarningsGraph(graph) {
  const source = graph && typeof graph === 'object' ? graph : {};
  const rawCategories = Array.isArray(source.categories) ? source.categories.map(String) : [];
  const firstSeries = Array.isArray(source.series) ? source.series[0] : null;
  const seriesData = Array.isArray(firstSeries?.data) ? firstSeries.data : [];
  const rawPoints = Array.isArray(source.points) ? source.points : [];
  const rawSeries = [
    {
      name: firstSeries?.name || 'Earnings',
      data: rawCategories.map((_, index) => toCount(seriesData[index])),
    },
  ];
  const rawExtra = rawCategories.map((_, index) => ({
    month: String(rawPoints[index]?.month || ''),
    hours: toCount(rawPoints[index]?.hours),
    bookings: toCount(rawPoints[index]?.bookings),
  }));

  const { categories, series, extraRows: points } = toCalendarJanFirst(
    rawCategories,
    rawSeries,
    rawExtra
  );
  const data = series[0]?.data || [];

  return {
    categories,
    series,
    total: source.total != null ? toCount(source.total) : data.reduce((sum, v) => sum + v, 0),
    points,
  };
}

function mapOpenJobs(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const id = String(item?.id || item?._id || '').trim();
      const title = String(
        item?.title || item?.jobTitle || item?.name || item?.description || 'Open job'
      ).trim();
      const description = String(
        item?.description || item?.location?.fullAddress || item?.address || item?.status || ''
      ).trim();
      return {
        id: id || `${title}-${item?.createdAt || ''}`,
        label: [title, description].filter(Boolean).join(' · ') || 'Open job',
        time: item?.createdAt ? fToNow(item.createdAt) : String(item?.status || ''),
        icon: item?.icon || 'solar:case-round-bold',
        color: 'secondary',
        entityId: id,
        clickable: Boolean(id),
      };
    })
    .filter((item) => item.id || item.label);
}

function mapWinRateByRegion(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const country = String(item?.country || item?.region || item?.name || '').trim();
      const totalBids = toCount(item?.totalBids);
      const wonBids = toCount(item?.wonBids);
      const winRate =
        item?.winRate != null && Number.isFinite(Number(item.winRate))
          ? Number(item.winRate)
          : totalBids > 0
            ? (wonBids / totalBids) * 100
            : 0;
      return {
        id: country || `${totalBids}-${wonBids}`,
        country: country || 'Unknown',
        totalBids,
        wonBids,
        winRate: Math.round(winRate * 100) / 100,
      };
    })
    .filter((item) => item.country);
}

function mapShiftsAndEarnings(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const shift = item?.shift && typeof item.shift === 'object' ? item.shift : {};
      const id = String(item?.id || item?._id || '').trim();
      const status = String(item?.status || '').trim();
      const dateLabel = shift.date ? fDate(shift.date) || '' : '';
      const start = String(shift.startTime || '').trim();
      const end = String(shift.endTime || '').trim();
      const timeRange = start && end ? `${start} – ${end}` : start || end || '';
      const breakLabel =
        shift.isBreak && toCount(shift.breakMin) > 0 ? `${toCount(shift.breakMin)}m break` : '';

      return {
        id: id || `${item?.job || ''}-${shift.id || ''}`,
        jobId: String(item?.job || '').trim(),
        workerId: String(item?.worker || '').trim(),
        status,
        statusLabel: humanizeKey(status) || '—',
        dateLabel,
        timeRange,
        breakLabel,
        createdAt: item?.createdAt || '',
        time: item?.createdAt ? fToNow(item.createdAt) : dateLabel,
      };
    })
    .filter((item) => item.id);
}

function mapEarningsSummary(earnings) {
  const source = earnings && typeof earnings === 'object' ? earnings : {};
  const thisWeek = mapMoneyBlock(source.thisWeek);
  const thisMonth = mapMoneyBlock(source.thisMonth);
  return {
    currency: String(source.currency || 'GBP').trim(),
    symbol: String(source.symbol || '£').trim(),
    total: mapMoneyBlock(source.total),
    upcoming: mapMoneyBlock(source.upcoming),
    thisWeek: thisWeek
      ? { ...thisWeek, period: String(source.thisWeek?.period || '').trim() }
      : null,
    thisMonth: thisMonth
      ? { ...thisMonth, period: String(source.thisMonth?.period || '').trim() }
      : null,
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

  const earningsGraph = mapEarningsGraph(data.earningsGraph);
  const upcoming = readUpcomingBlock(data);
  const earnings = mapEarningsSummary(data.earnings);
  const thisWeek = earnings.thisWeek;

  return {
    ...mapped,
    earnings,
    openJobs: mapOpenJobs(data.openJobs),
    winRateByRegion: mapWinRateByRegion(data.winRateByRegion),
    shiftsAndEarnings: mapShiftsAndEarnings(data.shiftsAndEarnings),
    earningsGraph: {
      ...earningsGraph,
      ...(upcoming ? { upcoming } : {}),
      ...(thisWeek ? { thisWeek } : {}),
      ...(earnings.total ? { totalBlock: earnings.total } : {}),
      ...(earnings.thisMonth ? { thisMonthBlock: earnings.thisMonth } : {}),
    },
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
      Locations: String(
        toCount(
          summary.totalBranches ??
            data.branches?.total ??
            (Array.isArray(data.branchesActivity) ? data.branchesActivity.length : 0)
        )
      ),
      ...(data.agreements?.total != null
        ? { Agreements: String(toCount(data.agreements.total)) }
        : {}),
    },
  };
}

export const mapSupplierDashboardFromApi = mapAgencyDashboardFromApi;

export function mapNurseDashboardFromApi(response) {
  const mapped = mapAgencyDashboardFromApi(response);
  const data = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
  const jobs = data.jobs && typeof data.jobs === 'object' ? data.jobs : {};
  const bookings = data.bookings && typeof data.bookings === 'object' ? data.bookings : {};
  const bids = data.bids && typeof data.bids === 'object' ? data.bids : {};
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
    moduleValues: {
      ...mapped.moduleValues,
      Shifts: String(toCount(bookings.total)),
      Jobs: String(toCount(summary.newJobs ?? jobs.total)),
      Bids: String(toCount(bids.total)),
    },
  };
}
