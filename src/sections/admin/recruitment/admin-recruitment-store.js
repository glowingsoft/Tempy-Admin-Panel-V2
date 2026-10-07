import { SEED_RECRUITMENT_REQUESTS } from './admin-recruitment-data';
import { RECRUITMENT_STATUS } from './admin-recruitment-constants';

const STORAGE_KEY = 'tempy-admin-recruitment-v1';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStore(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota / private mode
  }
}

export function getRecruitmentRequests() {
  const stored = readStore();
  if (stored?.length) return stored;
  writeStore(SEED_RECRUITMENT_REQUESTS);
  return [...SEED_RECRUITMENT_REQUESTS];
}

export function updateRecruitmentStatus(id, status) {
  const rows = getRecruitmentRequests();
  const next = rows.map((row) =>
    row.id === id
      ? {
          ...row,
          status,
          updatedAt: new Date().toISOString(),
        }
      : row
  );
  writeStore(next);
  return next;
}

export function getRecruitmentSummary(requests = getRecruitmentRequests()) {
  const rows = Array.isArray(requests) ? requests : [];
  const activeTemp = rows.filter((row) => row.status === RECRUITMENT_STATUS.TEMP_ACTIVE).length;
  const offersPending = rows.filter(
    (row) =>
      row.status === RECRUITMENT_STATUS.OFFER_MADE ||
      row.status === RECRUITMENT_STATUS.OFFER_ACCEPTED
  ).length;
  const permanentHired = rows.filter(
    (row) => row.status === RECRUITMENT_STATUS.PERMANENT_HIRED
  ).length;
  const withdrawn = rows.filter((row) => row.status === RECRUITMENT_STATUS.WITHDRAWN).length;
  const eligible = rows.filter((row) => row.status !== RECRUITMENT_STATUS.WITHDRAWN).length;
  const conversionRate = eligible ? Math.round((permanentHired / eligible) * 100) : 0;

  const pipeline = [
    { label: 'On temp assignment', value: activeTemp },
    { label: 'Offer made', value: rows.filter((r) => r.status === RECRUITMENT_STATUS.OFFER_MADE).length },
    {
      label: 'Offer accepted',
      value: rows.filter((r) => r.status === RECRUITMENT_STATUS.OFFER_ACCEPTED).length,
    },
    { label: 'Permanent hire', value: permanentHired },
    { label: 'Withdrawn', value: withdrawn },
  ].filter((item) => item.value > 0);

  const recent = [...rows]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5);

  return {
    total: rows.length,
    activeTemp,
    offersPending,
    permanentHired,
    withdrawn,
    conversionRate,
    pipeline,
    recent,
  };
}
