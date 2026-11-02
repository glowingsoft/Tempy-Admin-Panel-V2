export function buildScopedDashboardQuery(url, arg = {}) {
  const source = arg && typeof arg === 'object' ? arg : { userId: arg };
  const userId = String(source.userId || '').trim();
  const branch = String(source.branch || source.branchId || '').trim();

  const params = {};
  if (userId) params.userId = userId;
  if (branch && branch !== 'all') params.branch = branch;

  return {
    url,
    method: 'GET',
    ...(Object.keys(params).length ? { params } : {}),
  };
}
