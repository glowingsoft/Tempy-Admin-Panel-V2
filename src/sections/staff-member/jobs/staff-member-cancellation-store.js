const STORAGE_KEY = 'tempy-staff-shift-cancellations';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') {
      return { total: 0, late: 0, items: [] };
    }
    return {
      total: Number(parsed.total) || 0,
      late: Number(parsed.late) || 0,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { total: 0, late: 0, items: [] };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function getLocalCancellationStats() {
  const store = readStore();
  return {
    total: store.total,
    late: store.late,
    hasCancelledBefore: store.total > 0,
  };
}

export function getLocalCancellationItems() {
  return readStore().items;
}

export function recordLocalCancellation({ within24Hours = false, jobId = '', bookingId = '' } = {}) {
  const store = readStore();
  const next = {
    total: store.total + 1,
    late: store.late + (within24Hours ? 1 : 0),
    items: [
      {
        jobId: String(jobId || '').trim(),
        bookingId: String(bookingId || '').trim(),
        within24Hours: Boolean(within24Hours),
        cancelledAt: new Date().toISOString(),
      },
      ...store.items,
    ].slice(0, 50),
  };
  writeStore(next);
  return {
    total: next.total,
    late: next.late,
    hasCancelledBefore: next.total > 0,
  };
}
