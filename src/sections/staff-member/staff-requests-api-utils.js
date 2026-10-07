function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id;
      if (nested) return String(nested);
      continue;
    }
    return String(value);
  }
  return '';
}

function pickText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function extractStaffRequestsList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.requests)) return raw.requests;
  if (Array.isArray(response)) return response;
  return [];
}

export function normalizeStaffRequestStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (['accepted', 'accept', 'approved', 'active'].includes(raw)) return 'accepted';
  if (['rejected', 'reject', 'declined'].includes(raw)) return 'rejected';
  if (['pending', 'unread', 'new', 'requested'].includes(raw)) return 'pending';
  return raw || 'pending';
}

export function mapStaffRequestFromApi(item = {}) {
  const agency =
    item.agency && typeof item.agency === 'object'
      ? item.agency
      : item.employer && typeof item.employer === 'object'
        ? item.employer
        : item.homeCareCompany && typeof item.homeCareCompany === 'object'
          ? item.homeCareCompany
          : {};

  const id = pickId(item._id, item.id, item.requestId, item.staffRequestId);
  const status = normalizeStaffRequestStatus(item.status || item.state || item.action);
  const agencyName = pickText(
    agency.name,
    agency.companyName,
    item.agencyName,
    item.employerName,
    item.companyName,
    'Agency'
  );

  return {
    id,
    agencyName,
    specialty: pickText(item.speciality, item.specialty, agency.speciality, ''),
    ratePerHour: item.ratePerHour ?? item.rate ?? null,
    platformPercent: item.platformPercent ?? null,
    status,
    canRespond: status === 'pending',
    canAccept: status === 'pending',
    createdAt: item.createdAt || item.created_at || item.date || '',
    message: pickText(
      item.message,
      item.note,
      item.description,
      `${agencyName} invited you to join their staff.`
    ),
  };
}

export function buildStaffRequestRespondPayload(action = 'accept') {
  const normalized = String(action || 'accept').trim().toLowerCase();
  return { action: normalized === 'reject' ? 'reject' : 'accept' };
}

export function buildStaffRequestAcceptPayload() {
  return buildStaffRequestRespondPayload('accept');
}
