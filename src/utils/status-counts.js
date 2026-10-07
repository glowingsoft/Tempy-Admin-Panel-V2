export function isDeletedStatus(status) {
  const raw = String(status || '').toLowerCase();
  return raw === 'deleted' || raw === 'delete';
}

/** Count exactly what the current list contains. `all` = list length. */
export function countByStatus(list = [], { statusKey = 'status', fallback = 'active' } = {}) {
  const counts = { all: list.length };

  list.forEach((item) => {
    const status = String(item?.[statusKey] || fallback).toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

export function countForStatusTab(list = [], status, { statusKey = 'status', fallback = 'active' } = {}) {
  if (status === 'all') return list.length;
  return list.filter((item) => String(item?.[statusKey] || fallback).toLowerCase() === status).length;
}

function pickMetaCounts(meta = {}) {
  const source =
    meta.BranchCount ||
    meta.branchCount ||
    meta.StaffCount ||
    meta.staffCount ||
    meta.AgreedRatesCount ||
    meta.AgreedRateCount ||
    meta.statusCount ||
    null;

  if (!source || typeof source !== 'object') return {};

  const mapped = {};
  Object.entries(source).forEach(([key, value]) => {
    const normalized = String(key).toLowerCase();
    const countKey = normalized === 'total' || normalized === 'totalrecords' ? 'all' : String(key);
    mapped[countKey] = Number(value) || 0;
  });
  return mapped;
}

/**
 * Freeze tab numbers from API.
 * - On All: snapshot the full list + meta.totalRecords
 * - On a status click: only update that tab's number; keep the rest
 */
export function mergeStatusCounts(
  prev = {},
  { list = [], status = 'all', totalRecords, meta } = {}
) {
  const fromList = countByStatus(list);
  const fromMeta = pickMetaCounts(meta);
  const total = Number(totalRecords);

  if (!status || status === 'all') {
    return {
      ...prev,
      ...fromList,
      ...fromMeta,
      all: Number.isFinite(total) ? total : fromMeta.all ?? fromList.all,
    };
  }

  return {
    ...prev,
    [status]: Number.isFinite(total) ? total : fromList[status] ?? list.length,
  };
}
