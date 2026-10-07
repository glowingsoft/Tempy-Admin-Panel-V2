import { paths } from 'src/routes/paths';
import { resolveProfileAssetUrl, toApiUploadedFileName } from 'src/store/Reducer/upload-api';

const STORAGE_PREFIX = 'tempy-admin-org-profile';

export const ADMIN_ORG_PROFILE_KINDS = {
  agencies: {
    label: 'Agency / Supplier',
    group: 'Supplier',
    listPath: paths.adminDashboard.agencies,
  },
  'care-homes': {
    label: 'Care Home',
    group: 'Customer',
    listPath: paths.adminDashboard.careHomes,
  },
  hospitals: {
    label: 'Hospital / NHS',
    group: 'Customer',
    listPath: paths.adminDashboard.hospitals,
  },
  'local-authority': {
    label: 'Local Authority',
    group: 'Customer',
    listPath: paths.adminDashboard.localAuthority,
  },
  'individual-home-care': {
    label: 'Individual (Home Care)',
    group: 'Customer',
    listPath: paths.adminDashboard.individualHomeCare,
  },
  'home-care-companies': {
    label: 'Home Care Company',
    group: 'Supplier',
    listPath: paths.adminDashboard.homeCareCompanies,
  },
  'staff-members': {
    label: 'Staff Member',
    group: 'Supplier',
    listPath: paths.adminDashboard.staffMembers,
  },
};

export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending', label: 'Awaiting confirmation', color: 'warning' },
  { value: 'agreed', label: 'Agreed', color: 'success' },
];

export const SERVICE_LEVEL_OPTIONS = [
  { value: 'standard', label: 'Standard cover' },
  { value: 'enhanced', label: 'Enhanced / complex care' },
  { value: 'emergency', label: 'Emergency / out of hours' },
  { value: 'framework', label: 'Framework / block contract' },
  { value: 'custom', label: 'Custom' },
];

export const EMPTY_CONTRACT = {
  status: 'draft',
  hourlyRate: '',
  dailyRate: '',
  serviceLevel: 'standard',
  serviceLevelDetail: '',
  startDate: '',
  endDate: '',
  ratesConfirmed: false,
  slaConfirmed: false,
  notes: '',
  files: [],
};

export const EMPTY_ORG_PROFILE_EXTRAS = {
  bio: '',
  instructions: '',
  images: [],
  documents: [],
  contract: { ...EMPTY_CONTRACT },
};

export function getContractStatusMeta(status) {
  return CONTRACT_STATUSES.find((item) => item.value === status) || CONTRACT_STATUSES[0];
}

export function normalizeContract(contract) {
  const source = contract && typeof contract === 'object' ? contract : {};
  return {
    ...EMPTY_CONTRACT,
    ...source,
    files: Array.isArray(source.files) ? source.files : [],
    ratesConfirmed: Boolean(source.ratesConfirmed),
    slaConfirmed: Boolean(source.slaConfirmed),
  };
}

export function mergeOrgProfileExtras(extras) {
  const source = extras && typeof extras === 'object' ? extras : {};
  return {
    ...EMPTY_ORG_PROFILE_EXTRAS,
    bio: String(source.bio || ''),
    instructions: String(source.instructions || ''),
    images: Array.isArray(source.images) ? source.images : [],
    documents: Array.isArray(source.documents) ? source.documents : [],
    contract: normalizeContract(source.contract),
  };
}

function storageKey(kind, id) {
  return `${STORAGE_PREFIX}:${kind}:${id}`;
}

export function openAdminOrgProfile(router, kind, row) {
  router.push(paths.adminDashboard.orgProfile(kind, row.id), { state: { row } });
}

function pickProfileText(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'string') {
      const text = value.trim();
      if (text && text !== '[object Object]') return text;
    }
  }
  return '';
}

function formatApiPhone(phone) {
  if (!phone) return '';
  if (typeof phone === 'string') return phone.trim();
  if (typeof phone !== 'object') return '';
  const code = String(phone.code || phone.dialCode || '').trim();
  const number = String(phone.number || phone.phone || '').trim();
  return `${code}${number}`.trim();
}

function flattenAssetLists(lists = []) {
  return lists.flatMap((item) => {
    if (!item) return [];
    if (Array.isArray(item)) return item.filter(Boolean);
    return [item];
  });
}

function isDefaultProfileIcon(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  return !raw || raw === 'default.png' || /\/default\.png(\?|$)/i.test(raw);
}

function collectApiDocuments(raw = {}, basic = {}) {
  return flattenAssetLists([raw.validationDocument, raw.validationDocuments, raw.documents, raw.files, raw.attachments, basic.documents, raw.document]);
}

function collectApiImages(raw = {}, basic = {}) {
  return flattenAssetLists([raw.images, raw.photos, raw.gallery, basic.images]);
}

function isImageAsset(item) {
  if (!item) return false;
  if (typeof item.type === 'string' && item.type.startsWith('image/')) return true;
  const hay = `${item.name || ''} ${item.url || ''} ${item.file || ''}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(hay);
}

function splitProfileMedia(raw = {}, basic = {}, profile = {}) {
  const gallery = uniqueAssets(
    normalizeAssets(flattenAssetLists([collectApiImages(raw, basic), collectApiDocuments(raw, basic), profile.images, profile.validationDocument, raw.validationDocument]))
  ).filter((item) => !isDefaultProfileIcon(item.file) && !isDefaultProfileIcon(item.name) && !isDefaultProfileIcon(item.url));

  return {
    images: gallery.filter(isImageAsset),
    documents: gallery.filter((item) => !isImageAsset(item)),
  };
}

function uniqueAssets(list = []) {
  const seen = new Set();
  return list.filter((item) => {
    const key = item?.url || item.file || item.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toApiFileKeys(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') {
        if (item.startsWith('data:') || item.startsWith('blob:')) return '';
        return toApiUploadedFileName(item, '');
      }
      const fileKey = item.file || item.fileName || '';
      if (typeof fileKey === 'string' && fileKey && !fileKey.startsWith('data:') && !fileKey.startsWith('blob:')) {
        return toApiUploadedFileName(fileKey, '');
      }
      const url = String(item.fileUrl || item.url || '');
      if (url.startsWith('data:') || url.startsWith('blob:')) return '';
      return toApiUploadedFileName(fileKey || url || item.name, '');
    })
    .filter(Boolean);
}

/** Map POST /upload/aws result into a profile asset. */
export function createAssetFromUpload(file, result = {}) {
  const fileKey = toApiUploadedFileName(result.file || result.fileUrl || file?.name, '');
  const fileUrl = String(result.fileUrl || '').trim() || resolveProfileAssetUrl(fileKey);
  if (!fileKey && !fileUrl) return null;
  return {
    id: fileKey || `${Date.now()}-${file?.name || 'file'}`,
    name: file?.name || fileKey,
    file: fileKey,
    url: fileUrl,
    type: file?.type || '',
  };
}

function nestedProfile(record) {
  const raw = record?.raw && typeof record.raw === 'object' ? record.raw : record || {};
  const basic = raw.basicInfo && typeof raw.basicInfo === 'object' ? raw.basicInfo : {};
  const nestedUser = raw.user && typeof raw.user === 'object' ? raw.user : {};
  return { raw, basic, nestedUser };
}

/** Flatten GET /users (or /users/:id) profile into the admin org record. */
export function recordFromUserProfile(profile) {
  if (!profile) return null;
  try {
    const raw = profile.raw && typeof profile.raw === 'object' ? profile.raw : profile;
    const { basic, nestedUser } = nestedProfile({ raw });
    const phone =
      profile.phoneLabel || formatApiPhone(profile.phoneNumber) || formatApiPhone(raw.phoneNumber) || formatApiPhone(basic.phoneNumber) || pickProfileText(nestedUser.phone);

    const profileIcon = pickProfileText(profile.profileIcon, basic.profileIcon, raw.profileIcon, profile.photoURL);
    const media = splitProfileMedia(raw, basic, profile);
    const primaryAddress = (Array.isArray(raw.addresses) ? raw.addresses : []).map((address) => address?.location).find((addressLocation) => addressLocation?.fullAddress) || {};

    return {
      id: profile.id || pickProfileText(raw._id, raw.id),
      name: pickProfileText(profile.name, basic.name, nestedUser.name, raw.name, raw.companyName),
      companyName: pickProfileText(raw.companyName, basic.companyName),
      registrationNumber: pickProfileText(raw.registrationNumber, basic.registrationNumber),
      type: pickProfileText(raw.type, basic.type),
      gender: pickProfileText(raw.gender, basic.gender),
      dob: pickProfileText(raw.dob, basic.dob),
      email: pickProfileText(profile.email, basic.email, nestedUser.email, raw.email),
      phone,
      location: pickProfileText(profile.fullAddress, profile.address, raw.location?.fullAddress, basic.location?.fullAddress, primaryAddress.fullAddress),
      city: pickProfileText(profile.city, raw.location?.city, basic.location?.city, primaryAddress.city),
      country: pickProfileText(profile.country, raw.location?.country, basic.location?.country, primaryAddress.country),
      avatarUrl: resolveProfileAssetUrl(profile.photoURL) || resolveProfileAssetUrl(profileIcon) || '',
      bio: pickProfileText(raw.summary, raw.bio, raw.about, basic.bio, basic.about, basic.description, raw.description, nestedUser.bio),
      instructions: pickProfileText(raw.instructions, raw.notes, raw.careInstructions, raw.specialInstructions, basic.instructions, basic.notes),
      images: media.images,
      documents: media.documents,
      contract: raw.contract || raw.agreement,
      spendings: raw.spendings ?? raw.spending ?? basic.spendings,
      earnings: raw.earnings ?? raw.earning ?? basic.earnings,
      jobsPosted: raw.stats?.jobsPosted ?? raw.jobsPosted ?? raw.jobsCount,
      bookings: raw.stats?.totalBookings ?? raw.bookings ?? raw.bookingsCount,
      jobsApplied: raw.jobsApplied,
      completedJobs: raw.stats?.completedJobs ?? raw.completedJobs,
      activeShifts: raw.stats?.activeShifts ?? raw.activeShifts,
      rating: raw.ratingStats?.averageRating ?? raw.averageRating,
      totalReviews: raw.ratingStats?.totalReviews ?? raw.totalReviews,
      raw,
    };
  } catch (error) {
    console.error('Failed to map organisation profile', error);
    return null;
  }
}

export function extrasFromRecord(record) {
  if (!record) return mergeOrgProfileExtras();
  try {
    const { raw, basic } = nestedProfile(record);
    const bio = pickProfileText(raw.summary, record.bio, record.about, raw.bio, raw.about, basic.bio, basic.about, basic.description, raw.description);
    const instructions = pickProfileText(record.instructions, record.notes, raw.instructions, raw.notes, raw.careInstructions, basic.instructions);
    return mergeOrgProfileExtras({
      bio,
      instructions,
      ...splitProfileMedia(raw, basic, record),
      contract: record.contract || record.agreement || raw.contract || raw.agreement,
    });
  } catch (error) {
    console.error('Failed to map organisation extras', error);
    return mergeOrgProfileExtras();
  }
}

function normalizeAssets(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const url = resolveProfileAssetUrl(item) || item;
        return {
          id: `api-${index}`,
          name: item === 'default.png' ? 'Profile image' : item,
          file: item,
          url,
          type: '',
        };
      }
      if (typeof item !== 'object') return null;
      const url = resolveProfileAssetUrl(item.url || item.fileUrl || item.urlPath || item.path || item.file || item.name);
      const name = pickProfileText(item.name, item.fileName, item.file) || `File ${index + 1}`;
      const file = toApiUploadedFileName(item.file || item.fileName || item.url || item.fileUrl || '', '');
      return {
        id: String(item.id || item._id || `api-${index}`),
        name,
        file,
        url,
        type: typeof item.type === 'string' ? item.type : item.mimeType || '',
      };
    })
    .filter((item) => item?.url);
}

export function loadOrgProfileExtras(kind, id) {
  try {
    const raw = window.localStorage.getItem(storageKey(kind, id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return mergeOrgProfileExtras(parsed);
  } catch {
    return null;
  }
}

/** Body for PUT /users/:id — API stores profileIcon + validationDocument filenames. */
export function buildOrgProfileUserPutPayload({ record, extras, usersApiProfile } = {}) {
  const profile = usersApiProfile || {};
  const location = profile.location && typeof profile.location === 'object' ? profile.location : {};
  const extrasSafe = mergeOrgProfileExtras(extras);
  const imageKeys = toApiFileKeys(extrasSafe.images);
  const documentKeys = toApiFileKeys(extrasSafe.documents);
  const existingIcon = toApiUploadedFileName(profile.profileIcon || record?.avatarUrl, 'default.png');

  const payload = {
    name: String(record?.name || profile.name || '').trim(),
    profileIcon: imageKeys[0] || existingIcon || 'default.png',
    validationDocument: [...new Set([...imageKeys, ...documentKeys])],
    location: {
      coordinates: Array.isArray(location.coordinates) ? location.coordinates : [0, 0],
      fullAddress: String(profile.fullAddress || profile.address || record?.location || location.fullAddress || '').trim(),
      country: String(profile.country || location.country || '').trim(),
      city: String(profile.city || location.city || '').trim(),
      state: String(profile.state || location.state || '').trim(),
      postalCode: String(profile.postalCode || profile.zipCode || location.postalCode || '').trim(),
    },
  };

  if (extrasSafe.bio) {
    payload.summary = extrasSafe.bio;
    payload.about = extrasSafe.bio;
    payload.bio = extrasSafe.bio;
  }
  if (extrasSafe.instructions) {
    payload.instructions = extrasSafe.instructions;
    payload.notes = extrasSafe.instructions;
  }
  if (record?.email || profile.email) {
    payload.email = String(record?.email || profile.email).trim();
  }
  if (profile.phoneNumber) {
    payload.phoneNumber = profile.phoneNumber;
  }

  return payload;
}

export function saveOrgProfileExtras(kind, id, extras) {
  window.localStorage.setItem(storageKey(kind, id), JSON.stringify(mergeOrgProfileExtras(extras)));
}

export function readFileAsAsset(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
