
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

function staticEarningForRole(seed) {
  const text = String(seed || 'role');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return 12500 + (hash % 355) * 100;
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

  const jobsCount = Number(
    item.jobsCount ?? item.jobCount ?? item.totalJobs ?? item.bookingsCount ?? 0
  );
  const billed = Number(item.billed ?? item.billedAmount ?? item.totalBilled ?? 0);
  const earnedFromApi = Number(item.earned ?? item.earnedAmount ?? item.totalEarned ?? item.earnings ?? 0);
  const avgRate = Number(
    item.avgHourlyRate ?? item.averageRate ?? item.hourlyRate ?? item.ratePerHour ?? 0
  );
  const earned =
    Number.isFinite(earnedFromApi) && earnedFromApi > 0
      ? earnedFromApi
      : staticEarningForRole(id || `${department}-${title}`);

  return {
    id,
    category: department,
    name: title,
    label: buildJobRoleLabel(department, title) || id,
    department,
    title,
    description: String(item.description || '').trim(),
    status: normalizeAdminJobRoleStatus(item.status),
    jobsCount: Number.isFinite(jobsCount) ? jobsCount : 0,
    billed: Number.isFinite(billed) ? billed : 0,
    earned,
    avgRate: Number.isFinite(avgRate) ? avgRate : 0,
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
