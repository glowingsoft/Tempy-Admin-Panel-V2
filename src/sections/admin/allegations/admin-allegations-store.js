import { SEED_ALLEGATIONS } from './admin-allegations-data';
import {
  ALLEGATION_STATUS,
  SHIFT_ACTION_STATUS,
} from './admin-allegations-constants';

const STORAGE_KEY = 'tempy-admin-allegations-v1';
const SUSPENSIONS_KEY = 'tempy-admin-worker-suspensions-v1';

function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function readAllegations() {
  const stored = readJson(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length) return stored;
  writeJson(STORAGE_KEY, SEED_ALLEGATIONS);
  return [...SEED_ALLEGATIONS];
}

function writeAllegations(rows) {
  writeJson(STORAGE_KEY, rows);
}

function readSuspensions() {
  const stored = readJson(SUSPENSIONS_KEY);
  return stored && typeof stored === 'object' ? stored : {};
}

function writeSuspensions(map) {
  writeJson(SUSPENSIONS_KEY, map);
}

function buildMockShifts(worker, employerName, count = 2) {
  const shifts = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    shifts.push({
      id: `shift-${Date.now()}-${index}`,
      ref: `SH-${1000 + Math.floor(Math.random() * 9000)}`,
      date: date.toISOString(),
      startTime: index % 2 === 0 ? '08:00' : '14:00',
      endTime: index % 2 === 0 ? '16:00' : '22:00',
      role: worker.role || 'Healthcare Assistant',
      location: worker.location || employerName || '—',
      employerName: employerName || '—',
      status: SHIFT_ACTION_STATUS.NEEDS_REALLOCATION,
      replacementWorkerId: null,
      replacementWorkerName: null,
    });
  }
  return shifts;
}

export function getAllegations() {
  return readAllegations();
}

export function getWorkerSuspension(workerId) {
  if (!workerId) return null;
  return readSuspensions()[String(workerId)] || null;
}

export function isWorkerSuspended(workerId) {
  return Boolean(getWorkerSuspension(workerId)?.suspendedAt);
}

export function getAllegationsSummary(allegations = getAllegations()) {
  const rows = Array.isArray(allegations) ? allegations : [];
  const open = rows.filter((row) => row.status === ALLEGATION_STATUS.OPEN).length;
  const underReview = rows.filter((row) => row.status === ALLEGATION_STATUS.UNDER_REVIEW).length;
  const suspendedWorkers = Object.keys(readSuspensions()).length;

  const pendingShifts = rows.reduce((total, row) => {
    const shifts = Array.isArray(row.affectedShifts) ? row.affectedShifts : [];
    return (
      total +
      shifts.filter((shift) => shift.status === SHIFT_ACTION_STATUS.NEEDS_REALLOCATION).length
    );
  }, 0);

  const recent = [...rows]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5);

  return {
    total: rows.length,
    open,
    underReview,
    suspendedWorkers,
    pendingShifts,
    recent,
  };
}

export function raiseAllegationAndSuspend({
  workerId,
  workerName,
  workerEmail,
  employerName,
  allegationType,
  description,
  futureShiftCount = 2,
}) {
  const now = new Date().toISOString();
  const worker = {
    id: workerId,
    name: workerName,
    email: workerEmail,
    role: 'Healthcare Assistant',
    location: employerName,
  };

  const allegation = {
    id: `alg-${Date.now()}`,
    workerId: String(workerId),
    workerName: String(workerName || '').trim(),
    workerEmail: String(workerEmail || '').trim(),
    employerName: String(employerName || '').trim(),
    allegationType,
    description: String(description || '').trim(),
    status: ALLEGATION_STATUS.OPEN,
    suspendedAt: now,
    createdAt: now,
    updatedAt: now,
    affectedShifts: buildMockShifts(worker, employerName, futureShiftCount),
  };

  const rows = readAllegations();
  rows.unshift(allegation);
  writeAllegations(rows);

  const suspensions = readSuspensions();
  suspensions[String(workerId)] = {
    workerId: String(workerId),
    workerName: allegation.workerName,
    allegationId: allegation.id,
    reason: allegationType,
    suspendedAt: now,
  };
  writeSuspensions(suspensions);

  return allegation;
}

export function updateAllegationStatus(id, status) {
  const rows = readAllegations();
  const next = rows.map((row) =>
    row.id === id
      ? {
          ...row,
          status,
          updatedAt: new Date().toISOString(),
        }
      : row
  );
  writeAllegations(next);
  return next;
}

export function reallocateShift(allegationId, shiftId, replacementWorker) {
  const rows = readAllegations();
  const next = rows.map((row) => {
    if (row.id !== allegationId) return row;
    return {
      ...row,
      updatedAt: new Date().toISOString(),
      affectedShifts: (row.affectedShifts || []).map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              status: SHIFT_ACTION_STATUS.REALLOCATED,
              replacementWorkerId: replacementWorker.id,
              replacementWorkerName: replacementWorker.name,
            }
          : shift
      ),
    };
  });
  writeAllegations(next);
  return next;
}

export function republishShift(allegationId, shiftId) {
  const rows = readAllegations();
  const next = rows.map((row) => {
    if (row.id !== allegationId) return row;
    return {
      ...row,
      updatedAt: new Date().toISOString(),
      affectedShifts: (row.affectedShifts || []).map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              status: SHIFT_ACTION_STATUS.REPUBLISHED,
              replacementWorkerId: null,
              replacementWorkerName: null,
            }
          : shift
      ),
    };
  });
  writeAllegations(next);
  return next;
}

export function liftSuspension(workerId) {
  const suspensions = readSuspensions();
  delete suspensions[String(workerId)];
  writeSuspensions(suspensions);
}
