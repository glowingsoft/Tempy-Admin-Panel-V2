const STORAGE_KEY = 'tempy-supplier-job-care-details';
const LEGACY_STORAGE_KEY = 'tempy-hcc-job-care-details';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // Migrate older HCC-only key if present
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw);
    if (legacy && typeof legacy === 'object') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
      return legacy;
    }
    return {};
  } catch {
    return {};
  }
}

function writeAll(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getEmptyJobCareDetails() {
  return {
    notes: '',
    instructions: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    documents: [],
    updatedAt: '',
  };
}

export function getJobCareDetails(jobId) {
  const id = String(jobId || '').trim();
  if (!id) return getEmptyJobCareDetails();
  const all = readAll();
  const row = all[id];
  if (!row || typeof row !== 'object') return getEmptyJobCareDetails();
  return {
    ...getEmptyJobCareDetails(),
    ...row,
    documents: Array.isArray(row.documents) ? row.documents : [],
  };
}

export function saveJobCareDetails(jobId, details) {
  const id = String(jobId || '').trim();
  if (!id) return getEmptyJobCareDetails();

  const nextRow = {
    ...getEmptyJobCareDetails(),
    ...details,
    documents: Array.isArray(details?.documents) ? details.documents : [],
    updatedAt: new Date().toISOString(),
  };

  const all = readAll();
  all[id] = nextRow;
  writeAll(all);
  return nextRow;
}

export function hasJobCareDetails(jobId) {
  const row = getJobCareDetails(jobId);
  return Boolean(
    row.notes ||
      row.instructions ||
      row.contactName ||
      row.contactPhone ||
      row.contactEmail ||
      row.emergencyName ||
      row.emergencyPhone ||
      row.emergencyRelation ||
      (row.documents && row.documents.length)
  );
}

export function hasJobCareDetailsFromJob(job = {}) {
  if (!job || typeof job !== 'object') return false;

  return Boolean(
    job.careNotes ||
      job.instructions ||
      job.contactName ||
      job.contactPhone ||
      job.contactEmail ||
      job.emergencyName ||
      job.emergencyPhone ||
      job.emergencyRelation ||
      (Array.isArray(job.careDocuments) && job.careDocuments.length)
  );
}

export function buildMapsUrl(job = {}) {
  const address = String(job.address || '').trim();
  const lat = Number(job.latitude);
  const lng = Number(job.longitude);
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

  // Demo/seed street names (e.g. "Cummerata Lake") often are not real places.
  // When coords exist, open the pin — that always resolves in Google Maps.
  if (hasCoords) {
    return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;
  }

  if (address && address !== '—') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return '';
}
