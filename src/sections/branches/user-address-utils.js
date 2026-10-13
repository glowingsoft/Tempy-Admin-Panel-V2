import {
  buildBranchProfilePayload,
  getAgencyBranchMongoId,
  mapAgencyBranchFromApi,
} from './agency-branch-utils';
import { toApiCoordinates } from './geo-coordinates';


export function mapUserAddressFromApi(item) {
  if (!item || typeof item !== 'object') return null;

  const mapped = mapAgencyBranchFromApi({
    ...item,
    name: item.title || item.name || '',
  });

  const title = String(item.title || mapped.name || '').trim();
  const id = getAgencyBranchMongoId(item) || mapped.id || '';

  return {
    ...mapped,
    id,
    _id: id,
    title,
    name: title || mapped.name,
    branchName: title || mapped.branchName,
    status: String(item.status || 'active').toLowerCase(),
    isActive: String(item.status || 'active').toLowerCase() !== 'inactive',
  };
}


export function buildUserAddressPayload(data) {
  const title = String(data.name || data.title || data.locationName || '').trim();

  return {
    title,
    location: buildUserAddressLocation(data),
    status: resolveUserAddressStatus(data.status),
    ...buildBranchProfilePayload(data),
  };
}


export function buildUserAddressUpdatePayload(data) {
  return {
    location: buildUserAddressLocation(data),
    status: resolveUserAddressStatus(data.status),
    ...buildBranchProfilePayload(data),
  };
}

function resolveUserAddressStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'inactive') return 'inactive';
  if (raw === 'deleted' || raw === 'delete') return 'deleted';
  if (raw === 'active') return 'active';
  return 'pending'; // backend default
}

function buildUserAddressLocation(data) {
  const postalRaw = data.postalCode;
  const postalCode =
    postalRaw === '' || postalRaw == null
      ? ''
      : Number.isFinite(Number(postalRaw)) && String(postalRaw).trim() !== ''
        ? Number(postalRaw)
        : String(postalRaw).trim();

  return {
    coordinates: toApiCoordinates(Number(data.latitude) || 0, Number(data.longitude) || 0),
    fullAddress: String(data.fullAddress || '').trim(),
    city: String(data.city || '').trim(),
    country: String(data.country || '').trim(),
    state: String(data.state || '').trim(),
    postalCode,
  };
}

export function extractUserAddressesList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.addresses)) return raw.addresses;
  if (Array.isArray(raw?.list)) return raw.list;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(response)) return response;
  return [];
}
