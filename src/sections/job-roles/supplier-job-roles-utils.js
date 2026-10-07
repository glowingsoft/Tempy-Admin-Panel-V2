// ----------------------------------------------------------------------

/** Dashboard roles that supply staff and keep their own list of job types. */
export const SUPPLIER_ROLES = ['agency', 'homeCareCompany', 'nurse'];

const SUPPLIER_API_PREFIX = {
  agency: '/web/agency',
  homeCareCompany: '/web/home-care-company',
  nurse: '/web/nurse',
};

export function isSupplierRole(role) {
  return SUPPLIER_ROLES.includes(role);
}

export function getSupplierApiPrefix(role) {
  return SUPPLIER_API_PREFIX[role] || SUPPLIER_API_PREFIX.agency;
}

function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return String(value._id || value.id || '').trim();
  return String(value).trim();
}

/** `{ _id, department, title }` → `{ id, department, title, label }` (label matches calendar keys). */
export function mapJobRoleFromApi(item = {}) {
  const role = item && typeof item === 'object' ? item : { _id: item };
  const department = String(role.department || '').trim();
  const title = String(role.title || role.name || '').trim();
  return {
    id: pickId(role._id || role.id || role.jobRole),
    department,
    title,
    label: [department, title].filter(Boolean).join(' ') || title || department,
    status: String(role.status || 'active').toLowerCase(),
  };
}

/** List from `{ data: [...] }`, `{ data: { jobRoles: [...] } }`, `{ jobRoles }` or a bare array. */
export function extractJobRolesList(response) {
  const candidates = [response, response?.data, response?.data?.jobRoles, response?.data?.data, response?.jobRoles];
  return candidates.find(Array.isArray) || [];
}

/** Choices grouped by department, both sorted A–Z. */
export function groupJobRolesByDepartment(roles = []) {
  const groups = new Map();
  roles.forEach((role) => {
    const key = role.department || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(role);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, items]) => ({
      department,
      items: [...items].sort((a, b) => a.title.localeCompare(b.title)),
    }));
}
