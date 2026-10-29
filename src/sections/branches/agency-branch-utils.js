/** MongoDB ObjectId: 24 hex chars. */
export function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function pickId(...candidates) {
  for (const value of candidates) {
    if (isMongoObjectId(value)) return value;
    if (value != null && typeof value === 'object') {
      const nested = pickId(value._id, value.id);
      if (nested) return nested;
    }
  }
  return null;
}

/** Resolve a usable agency branch Mongo id from a list/local row. */
export function getAgencyBranchMongoId(branch) {
  if (!branch) return null;
  return pickId(branch._id, branch.id, branch.branchId);
}

/** Pull `_id` from common create/update API response shapes. */
export function extractAgencyBranchIdFromResponse(response) {
  if (!response) return null;

  return pickId(
    response._id,
    response.id,
    response.data,
    response.data?._id,
    response.data?.id,
    response.data?.branch,
    response.data?.data,
    response.result,
    response.payload
  );
}

/** PUT body — status only (active | inactive | deleted). */
export function buildAgencyBranchStatusPayload(status) {
  return { status: String(status || '').trim() };
}

/** Normalize upload field values → URL strings for API payloads. */
export function normalizeUploadUrls(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.fileUrl || item.url || item.preview || item.file || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function asStringList(value) {
  if (Array.isArray(value)) return normalizeUploadUrls(value);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

/** First usable URL from any upload field value (string | object | array). */
function firstUploadUrl(...candidates) {
  for (const candidate of candidates) {
    const [url] = normalizeUploadUrls(candidate);
    if (url) return url;
  }
  return '';
}

/** Read a nested key off cqc / insurance, which may still arrive as a plain string. */
function nestedValue(value, key) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[key] || '').trim();
  }
  return '';
}

/** `YYYY-MM-DD` for the API; accepts a date input value or an ISO string. */
function toApiDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

/**
 * Profile + compliance fields shared across branch create/update payloads.
 * API contract: `profileIcon` is a URL string, `cqc` and `insurance` are objects.
 */
export function buildBranchProfilePayload(data = {}) {
  const images = normalizeUploadUrls(data.images);
  const certifications = normalizeUploadUrls(data.certifications);
  const insuranceCertificates = normalizeUploadUrls(data.insuranceCertificates);

  const profileIcon = firstUploadUrl(data.profileIcon, images);
  const cqcCertificate = firstUploadUrl(
    data.cqcCertificate,
    nestedValue(data.cqc, 'certificate'),
    certifications
  );
  const insuranceCertificate = firstUploadUrl(
    data.insuranceCertificate,
    nestedValue(data.insurance, 'certificate'),
    insuranceCertificates
  );

  const websiteRaw = String(data.website || '').trim();
  const website = websiteRaw
    ? websiteRaw.includes('://')
      ? websiteRaw
      : `https://${websiteRaw}`
    : '';

  return {
    bio: String(data.bio || '').trim(),
    ...(website ? { website } : {}),
    images,
    certifications,
    cqcRegistered: Boolean(data.cqcRegistered),
    cqcRating: String(data.cqcRating || '').trim(),
    insuranceCertificates,
    profileIcon,
    cqc: {
      registrationNumber: String(
        data.cqcRegistrationNumber || nestedValue(data.cqc, 'registrationNumber') || ''
      ).trim(),
      certificate: cqcCertificate,
    },
    insurance: {
      certificate: insuranceCertificate,
      expiryDate: toApiDate(data.insuranceExpiryDate || nestedValue(data.insurance, 'expiryDate')),
    },
  };
}

/** Pull branch/address rows from common API list shapes. */
export function extractBranchesList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.branches)) return raw.branches;
  if (Array.isArray(raw?.addresses)) return raw.addresses;
  if (Array.isArray(raw?.list)) return raw.list;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(response)) return response;
  return [];
}

/** Map GET `/web/agency/branches` item → UI row. */
export function mapAgencyBranchFromApi(item) {
  if (!item || typeof item !== 'object') return null;

  const id = getAgencyBranchMongoId(item) || item?._id || item?.id || '';
  if (!id) return null;

  const location = item?.location && typeof item.location === 'object' ? item.location : {};
  const status = String(item?.status || 'active').toLowerCase();
  const locationName =
    location.name ||
    location.title ||
    location.locationName ||
    location.label ||
    item?.locationName ||
    '';

  const profile = item?.profile && typeof item.profile === 'object' ? item.profile : {};
  const compliance =
    item?.compliance && typeof item.compliance === 'object' ? item.compliance : {};

  const rawCqc = item?.cqc || compliance.cqc || '';
  const rawInsurance = item?.insurance || compliance.insurance || '';
  const cqcCertificate =
    nestedValue(rawCqc, 'certificate') || (typeof rawCqc === 'string' ? rawCqc.trim() : '');
  const insuranceCertificate =
    nestedValue(rawInsurance, 'certificate') ||
    (typeof rawInsurance === 'string' ? rawInsurance.trim() : '');

  const name = String(
    item?.name || item?.title || item?.branchName || locationName || ''
  ).trim();

  return {
    id: String(id),
    _id: String(id),
    name,
    branchName: name,
    title: name,
    locationName,
    status,
    isActive: !['deleted', 'delete', 'inactive'].includes(status),
    createdAt: item?.createdAt || null,
    updatedAt: item?.updatedAt || null,
    user: item?.user || null,
    bio: item?.bio || profile.bio || '',
    website: String(item?.website || profile.website || location.website || '').trim(),
    images: asStringList(item?.images || profile.images),
    certifications: asStringList(
      item?.certifications || profile.certifications || cqcCertificate
    ),
    profileIcon: item?.profileIcon || profile.profileIcon || '',
    cqc: rawCqc,
    insurance: rawInsurance,
    cqcCertificate,
    insuranceCertificate,
    insuranceExpiryDate: toApiDate(nestedValue(rawInsurance, 'expiryDate')),
    cqcRegistered: Boolean(
      item?.cqcRegistered ??
        compliance.cqcRegistered ??
        item?.isCqcRegistered ??
        Boolean(nestedValue(rawCqc, 'registrationNumber'))
    ),
    cqcRegistrationNumber:
      item?.cqcRegistrationNumber ||
      compliance.cqcRegistrationNumber ||
      nestedValue(rawCqc, 'registrationNumber') ||
      item?.cqcNumber ||
      '',
    cqcRating: item?.cqcRating || compliance.cqcRating || '',
    insuranceCertificates: asStringList(
      item?.insuranceCertificates ||
        compliance.insuranceCertificates ||
        item?.insuranceCerts ||
        insuranceCertificate
    ),
    location: {
      name: locationName,
      title: location.title || locationName,
      locationName,
      coordinates: Array.isArray(location.coordinates) ? location.coordinates : [0, 0],
      fullAddress: location.fullAddress || '',
      city: location.city || '',
      country: location.country || '',
      state: location.state || '',
      postalCode: location.postalCode || '',
      type: location.type || '',
    },
  };
}

export function getAgencyBranchLocationLabel(branch) {
  const location = branch?.location;
  if (typeof location === 'string') return location || '—';
  if (location && typeof location === 'object') {
    return (
      location.name ||
      location.title ||
      location.locationName ||
      branch?.locationName ||
      location.fullAddress ||
      [location.city, location.state, location.country].filter(Boolean).join(', ') ||
      '—'
    );
  }
  return branch?.locationName || '—';
}

/** Staff Location dropdown label — same for Add and Edit; avoid "Name — Name". */
export function getAgencyStaffLocationOptionLabel(branch) {
  const name = String(branch?.name || branch?.branchName || '').trim();
  const locationLabel = String(getAgencyBranchLocationLabel(branch) || '').trim();

  if (!locationLabel || locationLabel === '—') return name || String(branch?.id || 'Location');
  if (!name) return locationLabel;
  if (name.toLowerCase() === locationLabel.toLowerCase()) return name;

  return `${name} — ${locationLabel}`;
}
