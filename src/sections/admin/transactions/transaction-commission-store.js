const STORAGE_KEY = 'tempy-admin-transaction-commission';
export const DEFAULT_COMMISSION_PERCENT = 6;

export function loadCommissionPercent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return DEFAULT_COMMISSION_PERCENT;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) return DEFAULT_COMMISSION_PERCENT;
    return value;
  } catch {
    return DEFAULT_COMMISSION_PERCENT;
  }
}

export function saveCommissionPercent(percent) {
  const value = Number(percent);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Commission must be a number between 0 and 100');
  }
  localStorage.setItem(STORAGE_KEY, String(value));
  return value;
}

export function calcCommissionAmount(transactionAmount, percent = loadCommissionPercent()) {
  const amount = Number(transactionAmount) || 0;
  const rate = Number(percent) || 0;
  return Math.round(((amount * rate) / 100) * 100) / 100;
}
