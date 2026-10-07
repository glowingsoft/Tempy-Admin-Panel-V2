import { fDate } from 'src/utils/format-time';

import { TRAFFIC_LIGHT_META } from 'src/sections/care-home/compliance/care-home-compliance-data';

// ----------------------------------------------------------------------

export function mapCareTutorCertificateFromApi(item = {}) {
  return {
    id: String(item._id || item.id || ''),
    courseTitle: String(item.courseTitle || item.title || item.course || ''),
    status: String(item.status || 'verified').toLowerCase(),
    verifiedAt: item.verifiedAt || item.completedAt || '',
    expiresAt: item.expiresAt || item.expiryDate || '',
    certificateId: String(item.certificateId || item.reference || ''),
    certificateUrl: String(item.certificateUrl || item.url || ''),
    provider: 'CareTutor',
  };
}

export function mapCareTutorStaffTrainingFromApi(item = {}) {
  const courses =
    item.courses && typeof item.courses === 'object' && !Array.isArray(item.courses)
      ? item.courses
      : {};

  const certificates = Array.isArray(item.certificates)
    ? item.certificates.map(mapCareTutorCertificateFromApi)
    : [];

  return {
    staffId: String(item.staffId || item.staff || item.workerId || item._id || ''),
    staffName: String(item.staffName || item.name || ''),
    overall: String(item.overall || item.overallStatus || 'grey'),
    completed: Number(item.completed ?? 0) || 0,
    total: Number(item.total ?? 0) || 0,
    overdue: Number(item.overdue ?? 0) || 0,
    courses,
    certificates,
  };
}

export function getTrafficLightMeta(status) {
  return TRAFFIC_LIGHT_META[status] || TRAFFIC_LIGHT_META.grey;
}

export function formatCertificateDate(value) {
  if (!value) return '—';
  try {
    return fDate(value);
  } catch {
    return String(value).slice(0, 10);
  }
}

export function getVerifiedCertificates(record) {
  if (!record) return [];
  return (record.certificates || []).filter((c) => c.status === 'verified' && c.courseTitle);
}
