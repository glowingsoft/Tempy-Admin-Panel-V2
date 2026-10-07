const STORAGE_KEY = 'tempy-staff-professional-profile';

export const DBS_STATUS_OPTIONS = [
  { value: 'clear', label: 'Clear' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
];

export const RTW_STATUS_OPTIONS = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'time_limited', label: 'Time-limited' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

export const TRAINING_STATUS_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'overdue', label: 'Overdue' },
];

const LEGACY_DEFAULT_BIO =
  'Registered nurse with experience in elderly and community care. Comfortable with medication support, personal care and family updates.';

export const PERSONAL_SUMMARY_WORD_LIMIT = 100;

export function countWords(text = '') {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function clampToWordLimit(text = '', limit = PERSONAL_SUMMARY_WORD_LIMIT) {
  const words = String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= limit) return String(text);
  return words.slice(0, limit).join(' ');
}

export const DEFAULT_STAFF_PROFESSIONAL_PROFILE = {
  bio: '',
  training: [
    { id: 't1', name: 'Moving & handling', status: 'valid', expiresOn: '2027-03-12' },
    { id: 't2', name: 'Medication administration', status: 'valid', expiresOn: '2026-11-08' },
    { id: 't3', name: 'Safeguarding adults', status: 'due_soon', expiresOn: '2026-09-20' },
  ],
  dbs: {
    status: 'clear',
    certificateNumber: '001234567890',
    issueDate: '2025-04-18',
    expiryDate: '2028-04-18',
  },
  rtw: {
    status: 'continuous',
    documentType: 'British passport',
    expiryDate: '',
  },
  certificates: {
    governmentId: [],
    nursingDegree: [],
    professionalCerts: [],
    dbsCertificate: [],
    rightToWork: [],
    other: [],
  },
  qualifications: [],
};

export function createQualification(overrides = {}) {
  return {
    id: `q-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: '',
    files: [],
    ...overrides,
  };
}

export function qualificationHasCertificate(item) {
  return Array.isArray(item?.files) && item.files.length > 0;
}

export function getVisibleQualifications(profile) {
  return (profile?.qualifications || []).filter(
    (item) => String(item.title || '').trim() && qualificationHasCertificate(item)
  );
}

function storageKeyFor(userId) {
  return `${STORAGE_KEY}:${userId || 'anon'}`;
}

export function loadStaffProfessionalProfile(userId) {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId));
    if (!raw) return { ...DEFAULT_STAFF_PROFESSIONAL_PROFILE };
    const parsed = JSON.parse(raw);
    const bio =
      String(parsed.bio || '').trim() === LEGACY_DEFAULT_BIO ? '' : parsed.bio;
    return {
      ...DEFAULT_STAFF_PROFESSIONAL_PROFILE,
      ...parsed,
      bio,
      training: Array.isArray(parsed.training)
        ? parsed.training
        : DEFAULT_STAFF_PROFESSIONAL_PROFILE.training,
      dbs: { ...DEFAULT_STAFF_PROFESSIONAL_PROFILE.dbs, ...(parsed.dbs || {}) },
      rtw: { ...DEFAULT_STAFF_PROFESSIONAL_PROFILE.rtw, ...(parsed.rtw || {}) },
      certificates: {
        ...DEFAULT_STAFF_PROFESSIONAL_PROFILE.certificates,
        ...(parsed.certificates || {}),
      },
      qualifications: Array.isArray(parsed.qualifications)
        ? parsed.qualifications.map((item) => ({
            id: item.id || createQualification().id,
            title: String(item.title || '').trim(),
            files: Array.isArray(item.files) ? item.files : [],
          }))
        : [],
    };
  } catch {
    return { ...DEFAULT_STAFF_PROFESSIONAL_PROFILE };
  }
}

export function saveStaffProfessionalProfile(userId, profile) {
  window.localStorage.setItem(storageKeyFor(userId), JSON.stringify(profile));
}

export function isStaffMemberAccount(user) {
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    Number(user?.permission) === 8 ||
    accountType === 'staff_member' ||
    accountType === 'nurse'
  );
}
