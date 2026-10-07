import { STAFF_COMPLIANCE } from 'src/sections/care-home/compliance/care-home-compliance-data';

import {
  CARE_TUTOR_CONNECTION_STATUS,
  DEFAULT_TRAINING_COMMISSION_PERCENT,
} from './care-tutor-constants';

const SETTINGS_PREFIX = 'tempy-care-tutor-settings-v1';
const STAFF_PREFIX = 'tempy-care-tutor-staff-v1';

function settingsKey(orgId) {
  return `${SETTINGS_PREFIX}:${orgId || 'default'}`;
}

function staffKey(orgId) {
  return `${STAFF_PREFIX}:${orgId || 'default'}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function seedStaffFromMock() {
  return STAFF_COMPLIANCE.reduce((acc, row) => {
    const certificates = Object.entries(row.careTutor?.courses || {})
      .filter(([, status]) => status === 'green')
      .map(([courseTitle]) => ({
        id: `cert-${row.id}-${courseTitle}`.replace(/\s+/g, '-').toLowerCase(),
        courseTitle,
        status: 'verified',
        verifiedAt: '2026-07-15T10:00:00.000Z',
        expiresAt: '2027-07-15T10:00:00.000Z',
        certificateId: `CT-${String(row.id).slice(-3).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        provider: 'CareTutor',
      }));

    acc[row.id] = {
      staffId: row.id,
      staffName: row.name,
      overall: row.careTutor?.overall || 'grey',
      completed: row.careTutor?.completed ?? 0,
      total: row.careTutor?.total ?? 0,
      overdue: row.careTutor?.overdue ?? 0,
      courses: { ...(row.careTutor?.courses || {}) },
      certificates,
    };
    return acc;
  }, {});
}

export function getCareTutorSettings(orgId) {
  const stored = readJson(settingsKey(orgId));
  return {
    connectionStatus: stored?.connectionStatus || CARE_TUTOR_CONNECTION_STATUS.CONNECTED,
    commissionPercent:
      Number(stored?.commissionPercent ?? DEFAULT_TRAINING_COMMISSION_PERCENT) ||
      DEFAULT_TRAINING_COMMISSION_PERCENT,
    lastSync: stored?.lastSync || '28 min ago',
    accountLinked: stored?.accountLinked !== false,
  };
}

export function saveCareTutorSettings(orgId, patch = {}) {
  const current = getCareTutorSettings(orgId);
  const next = { ...current, ...patch };
  if (!writeJson(settingsKey(orgId), next)) {
    throw new Error('Could not save Care Tutor settings.');
  }
  return next;
}

export function getCareTutorStaffMap(orgId) {
  const stored = readJson(staffKey(orgId));
  if (stored && typeof stored === 'object' && Object.keys(stored).length) {
    return stored;
  }
  const seeded = seedStaffFromMock();
  writeJson(staffKey(orgId), seeded);
  return seeded;
}

export function getCareTutorStaffRecord(orgId, staffId) {
  const map = getCareTutorStaffMap(orgId);
  return map[String(staffId || '')] || null;
}

export function getCareTutorStaffList(orgId) {
  return Object.values(getCareTutorStaffMap(orgId));
}

function recomputeSummary(record) {
  const courses = record.courses || {};
  const values = Object.values(courses);
  const total = values.length;
  const completed = values.filter((s) => s === 'green').length;
  const overdue = values.filter((s) => s === 'red').length;
  let overall = 'grey';
  if (overdue > 0) overall = 'red';
  else if (values.some((s) => s === 'amber')) overall = 'amber';
  else if (completed === total && total > 0) overall = 'green';
  else if (completed > 0) overall = 'amber';

  return { ...record, completed, total, overdue, overall };
}

export function saveCareTutorStaffRecord(orgId, staffId, patch = {}) {
  const map = getCareTutorStaffMap(orgId);
  const key = String(staffId || '');
  const existing = map[key] || {
    staffId: key,
    staffName: patch.staffName || 'Staff',
    overall: 'grey',
    completed: 0,
    total: 0,
    overdue: 0,
    courses: {},
    certificates: [],
  };

  const next = recomputeSummary({
    ...existing,
    ...patch,
    staffId: key,
    courses: { ...existing.courses, ...(patch.courses || {}) },
    certificates: patch.certificates ?? existing.certificates ?? [],
  });

  map[key] = next;
  if (!writeJson(staffKey(orgId), map)) {
    throw new Error('Could not save Care Tutor training record.');
  }
  return next;
}

export function enrolStaffInCourse(orgId, { staffId, staffName, courseTitle, coursePrice, commissionPercent }) {
  const percent = Number(commissionPercent) || DEFAULT_TRAINING_COMMISSION_PERCENT;
  const price = Number(coursePrice) || 0;
  const platformFee = Math.round(((price * percent) / 100) * 100) / 100;
  const caretutorPayout = Math.round((price - platformFee) * 100) / 100;

  const record = getCareTutorStaffRecord(orgId, staffId) || {
    staffId,
    staffName,
    courses: {},
    certificates: [],
  };

  const courses = { ...record.courses, [courseTitle]: 'amber' };

  const payment = {
    id: `pay-${Date.now()}`,
    courseTitle,
    amount: price,
    platformFee,
    caretutorPayout,
    commissionPercent: percent,
    status: 'paid',
    paidAt: new Date().toISOString(),
  };

  const updated = saveCareTutorStaffRecord(orgId, staffId, {
    staffName: staffName || record.staffName,
    courses,
    lastPayment: payment,
  });

  return { record: updated, payment };
}

/** Demo: mark course verified after Care Tutor webhook would fire. */
export function verifyStaffCourse(orgId, staffId, courseTitle) {
  const record = getCareTutorStaffRecord(orgId, staffId);
  if (!record) return null;

  const courses = { ...record.courses, [courseTitle]: 'green' };
  const now = new Date().toISOString();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const certificates = [
    ...(record.certificates || []).filter((c) => c.courseTitle !== courseTitle),
    {
      id: `cert-${staffId}-${courseTitle}`.replace(/\s+/g, '-').toLowerCase(),
      courseTitle,
      status: 'verified',
      verifiedAt: now,
      expiresAt: expires.toISOString().slice(0, 10),
      certificateId: `CT-${Date.now().toString(36).toUpperCase()}`,
      provider: 'CareTutor',
    },
  ];

  return saveCareTutorStaffRecord(orgId, staffId, { courses, certificates });
}

export function calculateTrainingCheckout(price, commissionPercent) {
  const amount = Number(price) || 0;
  const percent = Number(commissionPercent) || DEFAULT_TRAINING_COMMISSION_PERCENT;
  const platformFee = Math.round(((amount * percent) / 100) * 100) / 100;
  const caretutorPayout = Math.round((amount - platformFee) * 100) / 100;
  return { amount, platformFee, caretutorPayout, commissionPercent: percent, total: amount };
}
