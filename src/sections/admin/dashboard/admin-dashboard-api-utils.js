import { fToNow } from 'src/utils/format-time';
import { isValidLatitude, isValidLongitude } from 'src/sections/branches/geo-coordinates';

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function formatSeriesLabel(label) {
  const value = String(label || '').trim();
  if (!value) return 'Other';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function labelSeries(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      label: formatSeriesLabel(item?.label),
      value: toCount(item?.value),
      userType: String(item?.userType || '').trim(),
    }))
    .filter((item) => item.label);
}

function normaliseTypeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[-_\s]/g, '');
}

function findTypeCount(list, keys) {
  const match = (Array.isArray(list) ? list : []).find((item) => {
    const type = normaliseTypeKey(item.userType);
    const label = normaliseTypeKey(item.label);
    return keys.some((key) => type.includes(key) || label.includes(key));
  });
  return toCount(match?.value);
}

/** Static until payment/billing lands on /admin/dashboard. */
export const STATIC_ADMIN_MONEY_BY_ORG = [
  { label: 'Care Home', billed: 18450, earned: 14220 },
  { label: 'Hospital / NHS', billed: 12680, earned: 10140 },
  { label: 'Local Authority', billed: 9420, earned: 7850 },
  { label: 'Individual (Home Care)', billed: 3680, earned: 2940 },
  { label: 'Agency', billed: 0, earned: 15680 },
  { label: 'Home Care Company', billed: 0, earned: 8940 },
  { label: 'Staff Member', billed: 0, earned: 6720 },
];

/** Static until rate-type breakdown lands on /admin/dashboard. */
export const STATIC_ADMIN_RATE_MIX = [
  { label: 'Bid rates', value: 46 },
  { label: 'Reduced rates', value: 31 },
  { label: 'Set rates', value: 23 },
];

function mapMoneyByOrg(source) {
  const finance = asObject(source);
  const rows = Array.isArray(finance.byType)
    ? finance.byType
    : Array.isArray(finance.byOrganisation)
      ? finance.byOrganisation
      : Array.isArray(finance.rows)
        ? finance.rows
        : [];

  const mapped = rows
    .map((row) => ({
      label: formatSeriesLabel(row?.label || row?.type || row?.organisationType),
      billed: toCount(row?.billed ?? row?.billedAmount ?? row?.invoiced),
      earned: toCount(row?.earned ?? row?.earnedAmount ?? row?.paid),
    }))
    .filter((row) => row.label);

  return mapped.length ? mapped : STATIC_ADMIN_MONEY_BY_ORG;
}

function mapRateMix(source) {
  const rates = asObject(source);
  if (Array.isArray(rates.series) && rates.series.length) {
    const series = labelSeries(rates.series).filter((item) => item.value > 0);
    if (series.length) return series;
  }
  const fromFields = [
    { label: 'Bid rates', value: toCount(rates.bid ?? rates.bidRates) },
    { label: 'Reduced rates', value: toCount(rates.reduced ?? rates.reducedRates) },
    { label: 'Set rates', value: toCount(rates.set ?? rates.setRates) },
  ].filter((item) => item.value > 0);

  return fromFields.length ? fromFields : STATIC_ADMIN_RATE_MIX;
}

function statusSeries(source = {}, keys = []) {
  return keys.map(({ key, label, colorKey }) => ({
    label,
    value: toCount(source[key]),
    colorKey: colorKey || undefined,
  }));
}

function monthlySeries(source) {
  const monthly = asObject(source);
  const categories = Array.isArray(monthly.categories)
    ? monthly.categories.map((label) => String(label || '').trim() || '—')
    : [];

  const series = Array.isArray(monthly.series)
    ? monthly.series.map((item) => ({
        name: String(item?.name || '').trim() || 'Series',
        data: Array.isArray(item?.data) ? item.data.map(toCount) : categories.map(() => 0),
      }))
    : [];

  return { categories, series };
}

function formatCityLabel(label) {
  const value = String(label || '').trim();
  if (!value) return 'Unknown';
  return value;
}

/** Map API regionalFillRates 1:1 — same order, same length as response. */
function mapRegionalFillRates(source) {
  const regional = asObject(source);
  const rawCategories = Array.isArray(regional.categories) ? regional.categories : [];
  const rawSeries = Array.isArray(regional.series) ? regional.series : [];
  const primary = rawSeries[0];
  const rawValues = Array.isArray(primary?.data) ? primary.data.map(toCount) : [];

  const categories = rawCategories.map((label) => formatCityLabel(label));
  const data = categories.map((_, index) => toCount(rawValues[index]));

  return {
    categories,
    series: categories.length
      ? [
          {
            name: String(primary?.name || 'Fill Rate').trim() || 'Fill Rate',
            data,
          },
        ]
      : [],
  };
}

/**
 * /admin/dashboard regionalHeatMap sometimes stores GeoJSON [lng, lat]
 * in fields named latitude / longitude.
 */
function heatMapLatLng(item) {
  const first = Number(item?.latitude ?? item?.lat);
  const second = Number(item?.longitude ?? item?.lng);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  const storedAsLngLat =
    Math.abs(first) > 90 ||
    (Math.abs(first) > 60 && Math.abs(second) <= 60 && Math.abs(first) > Math.abs(second));

  const latitude = storedAsLngLat ? second : first;
  const longitude = storedAsLngLat ? first : second;
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
}

/** Keep GET /admin/dashboard regionalHeatMap rows 1:1 for the map + list. */
function mapRegionalHeatMap(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const city = String(item?.city || '').trim();
    const state = String(item?.state || '').trim();
    const country = String(item?.country || '').trim();
    const coords = heatMapLatLng(item);
    const intensity = Number(item?.intensity);

    return {
      id: String(item?.id || `${city}-${state}-${index}`),
      label: city || [state, country].filter(Boolean).join(', ') || `Location ${index + 1}`,
      city,
      state,
      country,
      lat: coords?.latitude ?? null,
      lng: coords?.longitude ?? null,
      intensity: Number.isFinite(intensity) ? intensity : 0,
      value: Number.isFinite(intensity) ? Math.round(intensity * 100) : 0,
      total: toCount(item?.total),
      pending: toCount(item?.pending),
      active: toCount(item?.active),
      inProgress: toCount(item?.inProgress),
      completed: toCount(item?.completed),
      cancelled: toCount(item?.cancelled),
    };
  });
}

function shortHeatMapLabel(label) {
  const text = String(label || 'Unknown').trim() || 'Unknown';
  return text.length > 14 ? `${text.slice(0, 12)}…` : text;
}

/** Bar chart of GET /admin/dashboard regionalHeatMap (top locations by total). */
function mapHeatMapChart(rows) {
  const sorted = [...(Array.isArray(rows) ? rows : [])]
    .sort((a, b) => toCount(b.total) - toCount(a.total))
    .slice(0, 12);

  return {
    categories: sorted.map((row) => shortHeatMapLabel(row.label)),
    series: [
      { name: 'Total', data: sorted.map((row) => toCount(row.total)) },
      { name: 'Pending', data: sorted.map((row) => toCount(row.pending)) },
      { name: 'Active', data: sorted.map((row) => toCount(row.active)) },
    ],
  };
}

const ACTIVITY_ICONS = {
  job: 'solar:case-round-bold',
  bid: 'solar:document-text-bold',
  booking: 'solar:calendar-bold',
  staff: 'solar:user-plus-bold',
  user: 'solar:user-bold',
};

const ACTIVITY_COLORS = {
  job: 'primary',
  bid: 'warning',
  booking: 'info',
  staff: 'success',
  user: 'secondary',
};

const TIMELINE_TYPES = {
  job: 'order1',
  booking: 'order2',
  bid: 'order3',
  staff: 'order4',
  user: 'order4',
};

function mapActivityItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const type = String(item?.type || '').toLowerCase();
    const title = String(item?.title || '').trim();
    const description = String(item?.description || '').trim();

    return {
      id: String(item?.id || `${title}-${item?.createdAt || ''}`),
      label: [title, description].filter(Boolean).join(' · ') || 'Activity',
      time: item?.createdAt ? fToNow(item.createdAt) : String(item?.status || ''),
      icon: ACTIVITY_ICONS[type] || 'solar:bell-bold',
      color: ACTIVITY_COLORS[type] || 'primary',
    };
  });
}

export function mapAdminDashboardFromApi(response) {
  const data = asObject(response?.data ?? response);
  const summary = asObject(data.summary);
  const users = asObject(data.users);
  const jobs = asObject(data.jobs);
  const bids = asObject(data.bids);
  const bookings = asObject(data.bookings);
  const staff = asObject(data.staff);
  const growth = asObject(data.growth);
  const health = asObject(data.platformHealth);
  const customersGrowth = Array.isArray(growth.customers) ? growth.customers.map(toCount) : [];
  const suppliersGrowth = Array.isArray(growth.suppliers) ? growth.suppliers.map(toCount) : [];
  const growthCategories = Array.isArray(growth.categories)
    ? growth.categories.map((label) => String(label || '').trim() || '—')
    : [];
  const usersByType = labelSeries(data.usersByType?.series);
  const moneyByOrg = mapMoneyByOrg(data.finance || data.monies || data.billing);
  const rateMix = mapRateMix(data.rates || data.rateMix || jobs.rateTypes || bids.rateTypes);
  const regionalHeatMap = mapRegionalHeatMap(data.regionalHeatMap);
  const heatMapChart = mapHeatMapChart(regionalHeatMap);

  return {
    stats: [
      {
        title: 'Total users',
        total: toCount(summary.totalUsers ?? users.total),
        icon: 'solar:users-group-rounded-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Active users',
        total: toCount(summary.activeUsers ?? users.active),
        icon: 'solar:user-check-bold-duotone',
        color: 'info',
      },
      {
        title: 'Active jobs',
        total: toCount(summary.activeJobs ?? jobs.active),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Open bids',
        total: toCount(summary.openBids ?? bids.open),
        icon: 'solar:document-text-bold-duotone',
        color: 'warning',
      },
    ],
    extraStats: [
      {
        title: 'Active agencies',
        total: toCount(users.activeAgency ?? findTypeCount(usersByType, ['agency'])),
        icon: 'solar:buildings-2-bold-duotone',
        color: 'primary',
      },
      {
        title: 'Active home care companies',
        total: toCount(
          users.activeHomeCareCompany ??
            findTypeCount(usersByType, ['homecare', 'homecarecompany', 'homecareco'])
        ),
        icon: 'solar:home-smile-bold-duotone',
        color: 'info',
      },
      {
        title: 'Total jobs',
        total: toCount(jobs.total),
        icon: 'solar:case-round-bold-duotone',
        color: 'secondary',
      },
      {
        title: 'Total bookings',
        total: toCount(bookings.total),
        icon: 'solar:calendar-bold-duotone',
        color: 'info',
      },
    ],
    breakdowns: [
      {
        title: 'Users',
        color: 'primary',
        total: toCount(users.total),
        series: statusSeries(users, [
          { key: 'active', label: 'Active', colorKey: 'info' },
          { key: 'pending', label: 'Pending', colorKey: 'warning' },
        ]),
      },
      {
        title: 'Jobs',
        color: 'secondary',
        total: toCount(jobs.total),
        series: statusSeries(jobs, [
          { key: 'active', label: 'Active', colorKey: 'info' },
          { key: 'inactive', label: 'Inactive', colorKey: 'default' },
          { key: 'completed', label: 'Completed', colorKey: 'success' },
        ]),
      },
      {
        title: 'Bookings',
        color: 'info',
        total: toCount(bookings.total),
        series: statusSeries(bookings, [
          { key: 'active', label: 'Scheduled', colorKey: 'info' },
          { key: 'inProgress', label: 'In progress', colorKey: 'primary' },
          { key: 'completed', label: 'Completed', colorKey: 'success' },
          { key: 'cancelled', label: 'Cancelled', colorKey: 'error' },
        ]),
      },
      {
        title: 'Staff',
        color: 'success',
        total: toCount(staff.total),
        series: statusSeries(staff, [
          { key: 'active', label: 'Active', colorKey: 'info' },
          { key: 'pending', label: 'Pending', colorKey: 'warning' },
          { key: 'inactive', label: 'Inactive', colorKey: 'default' },
        ]),
      },
    ],
    usersByType,
    moneyByOrg,
    rateMix,
    jobStatus: labelSeries(data.jobStatus?.series),
    customerSupplier: labelSeries(data.customerSupplier?.series),
    bidsStatus: [
      { label: 'Open', value: toCount(bids.open) },
      { label: 'Accepted', value: toCount(bids.accepted) },
      { label: 'Rejected', value: toCount(bids.rejected) },
      { label: 'Withdrawn', value: toCount(bids.withdrawn) },
    ],
    monthlyActivity: monthlySeries(data.monthlyActivity),
    growthChart: {
      categories: growthCategories,
      series: [
        { name: 'Customers', data: customersGrowth },
        { name: 'Suppliers', data: suppliersGrowth },
      ].filter((item) => item.data.length),
    },
    regionalFillRates: mapRegionalFillRates(data.regionalFillRates),
    regionalHeatMap,
    heatMapChart,
    platformHealth: {
      categories: Array.isArray(health.labels)
        ? health.labels.map((label) => String(label || '').trim())
        : [],
      series: [
        {
          name: 'Score',
          data: Array.isArray(health.series) ? health.series.map(toCount) : [],
        },
      ].filter((item) => item.data.length),
    },
    fillRate: toCount(bookings.fillRate),
    completionRate: toCount(bookings.completionRate),
    healthRows: (Array.isArray(health.labels) ? health.labels : [])
      .map((label, index) => ({
        label: String(label || '').trim(),
        value: toCount(Array.isArray(health.series) ? health.series[index] : 0),
      }))
      .filter((item) => item.label),
    timeline: (Array.isArray(data.timeline) ? data.timeline : []).map((item) => {
      const type = String(item?.type || '').toLowerCase();
      const title = String(item?.title || '').trim();
      const description = String(item?.description || '').trim();

      return {
        id: String(item?.id || `${title}-${item?.createdAt || ''}`),
        title: [title, description].filter(Boolean).join(' · ') || 'Activity',
        time: item?.createdAt || null,
        type: TIMELINE_TYPES[type] || 'order4',
      };
    }),
    topPerformers: (Array.isArray(data.topPerformers) ? data.topPerformers : []).map(
      (item, index) => ({
        id: String(item?._id || item?.id || `${item?.email || item?.name}-${index}`),
        rank: index + 1,
        name: String(item?.name || item?.email || 'Unknown').trim(),
        subtitle: [item?.email, item?.userType].filter(Boolean).join(' · '),
        metric: `${toCount(item?.completedBookings)} completed`,
      })
    ),
    recentActivity: mapActivityItems(data.recentActivity),
  };
}
