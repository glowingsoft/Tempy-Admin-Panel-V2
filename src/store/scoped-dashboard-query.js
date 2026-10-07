/** Shared query args helper so dashboard RTK cache keys differ per account. */
export function buildScopedDashboardQuery(url, arg = {}) {
  const userId = String(
    (arg && typeof arg === 'object' ? arg.userId : arg) || ''
  ).trim();

  return {
    url,
    method: 'GET',
    ...(userId ? { params: { userId } } : {}),
  };
}
