/** Helpers only — agreed rates list/create come from API (no localStorage). */

export function findActiveAgreedRate(rates, { partnerName, jobType, objectName } = {}) {
  if (!rates?.length) return null;
  const partner = String(partnerName || objectName || '').toLowerCase();
  const type = String(jobType || '').toLowerCase();

  return (
    rates.find(
      (rate) =>
        rate.status === 'active' &&
        String(rate.partnerName || rate.objectName || '').toLowerCase() === partner &&
        String(rate.jobType || '').toLowerCase() === type
    ) ||
    rates.find(
      (rate) =>
        rate.status === 'active' &&
        String(rate.partnerName || rate.objectName || '').toLowerCase() === partner
    ) ||
    null
  );
}

export function findAgreedRateForJobType(rates, jobType) {
  if (!rates?.length) return null;
  const type = String(jobType || '').toLowerCase();
  return (
    rates.find(
      (rate) => rate.status === 'active' && String(rate.jobType || '').toLowerCase() === type
    ) || null
  );
}
