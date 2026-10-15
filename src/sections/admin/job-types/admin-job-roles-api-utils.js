
function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = pickId(value._id, value.id);
      if (nested) return nested;
      continue;
    }
    return String(value);
  }
  return '';
}

/** API may send `earnings: { amount, formatted, hours, bookings }` or a bare number. */
function pickMoney(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = pickMoney(
        value.amount,
        value.total,
        value.value,
        value.earned,
        value.earnings
      );
      if (nested != null) return nested;
      continue;
    }
    const n = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickCount(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = pickCount(value.bookings, value.count, value.total, value.hours);
      if (nested != null) return nested;
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function buildJobRoleLabel(department, title) {
  const dept = String(department || '').trim();
  const name = String(title || '').trim();
  if (dept && name) return `${dept} · ${name}`;
  return name || dept || '';
}

export function mapAdminJobRoleFromApi(item = {}) {
  const id = pickId(item._id, item.id);
  const department = String(item.department || item.category || '').trim();
  const title = String(item.title || item.name || '').trim();
  const earningsBlock =
    item.earnings && typeof item.earnings === 'object' ? item.earnings : null;

  const jobsCount =
    pickCount(
      item.jobsCount,
      item.jobCount,
      item.totalJobs,
      item.bookingsCount,
      earningsBlock?.bookings
    ) ?? 0;
  const billed = pickMoney(item.billed, item.billedAmount, item.totalBilled) ?? 0;
  const earned =
    pickMoney(item.earned, item.earnedAmount, item.totalEarned, item.earnings, earningsBlock) ?? 0;
  const avgRate =
    pickMoney(
      item.avgHourlyRate,
      item.averageRate,
      item.hourlyRate,
      item.ratePerHour
    ) ?? 0;
  const hours = pickCount(earningsBlock?.hours, item.hours, item.totalHours) ?? 0;

  return {
    id,
    category: department,
    name: title,
    label: buildJobRoleLabel(department, title) || id,
    department,
    title,
    description: String(item.description || '').trim(),
    status: normalizeAdminJobRoleStatus(item.status),
    jobsCount,
    billed,
    earned,
    hours,
    avgRate,
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || '',
    raw: item,
  };
}

export const ADMIN_JOB_ROLE_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'delete', label: 'Deleted', color: 'default' },
];

export function normalizeAdminJobRoleStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'inactive') return 'inactive';
  if (raw === 'delete' || raw === 'deleted') return 'delete';
  return 'active';
}

export function buildAdminJobRolePayload({
  category = '',
  name = '',
  department = '',
  title = '',
  description = '',
  status = '',
} = {}) {
  const payload = {
    department: String(department || category || '').trim(),
    title: String(title || name || '').trim(),
    description: String(description || '').trim(),
  };

  if (status) {
    payload.status = normalizeAdminJobRoleStatus(status);
  }

  return payload;
}

export function extractAdminJobRolesList(response) {
  const raw = response?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(response)) return response;
  return [];
}
