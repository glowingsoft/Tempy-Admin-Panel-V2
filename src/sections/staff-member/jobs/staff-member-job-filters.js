const ALL_ROLES_FILTER = { value: 'all', label: 'All roles' };

/**
 * Role chips from GET {prefix}/job-roles?status=active (see useGetSupplierJobRoleChoicesQuery).
 * `jobRoles`: [{ id, title, label }] → [{ value: 'all' }, { value: id, label, title }].
 */
export function buildStaffJobRoleFilters(jobRoles = []) {
  return [ALL_ROLES_FILTER, ...jobRoles.filter((role) => role?.id).map((role) => ({ value: role.id, label: role.label || role.title, title: role.title || '' }))];
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function pickId(value) {
  if (value && typeof value === 'object') return String(value._id || value.id || '').trim();
  return String(value || '').trim();
}

/** Ids the job may carry for its job type (populated `type`, bare `type` id or `jobRole`). */
function jobRoleIds(job = {}) {
  const raw = job.raw || {};
  return [job.jobType, raw.type, raw.jobType, raw.jobRole].map(pickId).filter(Boolean);
}

function jobRoleTitles(job = {}) {
  return [job.jobTypeTitle, job.jobType?.title, job.jobType?.name, job.raw?.type?.title, job.raw?.type?.name].map(normalize).filter(Boolean);
}

export function matchesStaffJobRoleFilter(job, roleFilter = 'all', filters = []) {
  if (!roleFilter || roleFilter === 'all') return true;
  if (jobRoleIds(job).includes(roleFilter)) return true;

  // Jobs without a type id still match on the job type title.
  const title = normalize(filters.find((filter) => filter.value === roleFilter)?.title);
  return Boolean(title) && jobRoleTitles(job).includes(title);
}

export function getStaffJobRateValue(job = {}) {
  const rate = Number(job.hourlyRate ?? job.totalPay ?? job.shiftRows?.[0]?.hourlyRate ?? job.raw?.hourlyRate ?? job.raw?.rate ?? 0);
  return Number.isFinite(rate) ? rate : 0;
}

export function filterStaffJobsByRole(jobs = [], roleFilter = 'all', filters = []) {
  return jobs.filter((job) => matchesStaffJobRoleFilter(job, roleFilter, filters));
}

export function countStaffJobsByRole(jobs = [], filters = []) {
  return filters.reduce((acc, filter) => {
    acc[filter.value] = filter.value === 'all' ? jobs.length : jobs.filter((job) => matchesStaffJobRoleFilter(job, filter.value, filters)).length;
    return acc;
  }, {});
}
