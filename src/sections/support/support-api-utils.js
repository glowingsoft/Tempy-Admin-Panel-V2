import { AUTH_PUBLIC_LOGIN_ROLE_OPTIONS } from 'src/sections/auth/jwt/auth-role-options';

// ----------------------------------------------------------------------

/**
 * Map dashboard accountType → API_ROUTES support keys.
 * Keep list/create separate so each dashboard can diverge later.
 */
export const SUPPORT_ROUTE_KEYS_BY_ACCOUNT = {
  care_home: { list: 'CARE_HOME_SUPPORT', create: 'CARE_HOME_SUPPORT_CREATE' },
  careHome: { list: 'CARE_HOME_SUPPORT', create: 'CARE_HOME_SUPPORT_CREATE' },
  hospital_nhs: { list: 'HOSPITAL_SUPPORT', create: 'HOSPITAL_SUPPORT_CREATE' },
  hospital: { list: 'HOSPITAL_SUPPORT', create: 'HOSPITAL_SUPPORT_CREATE' },
  local_authority: { list: 'LOCAL_AUTHORITY_SUPPORT', create: 'LOCAL_AUTHORITY_SUPPORT_CREATE' },
  localAuthority: { list: 'LOCAL_AUTHORITY_SUPPORT', create: 'LOCAL_AUTHORITY_SUPPORT_CREATE' },
  individual_home_care: {
    list: 'INDIVIDUAL_HOME_CARE_SUPPORT',
    create: 'INDIVIDUAL_HOME_CARE_SUPPORT_CREATE',
  },
  agency: { list: 'AGENCY_SUPPORT', create: 'AGENCY_SUPPORT_CREATE' },
  home_care_company: {
    list: 'HOME_CARE_COMPANY_SUPPORT',
    create: 'HOME_CARE_COMPANY_SUPPORT_CREATE',
  },
  homeCareCompany: {
    list: 'HOME_CARE_COMPANY_SUPPORT',
    create: 'HOME_CARE_COMPANY_SUPPORT_CREATE',
  },
  staff_member: { list: 'STAFF_MEMBER_SUPPORT', create: 'STAFF_MEMBER_SUPPORT_CREATE' },
  nurse: { list: 'STAFF_MEMBER_SUPPORT', create: 'STAFF_MEMBER_SUPPORT_CREATE' },
};

export function resolveSupportAccountKey(user) {
  const accountType =
    user?.accountState?.accountType || user?.accountType || user?.userType || '';
  const permission = Number(user?.permission);

  if (SUPPORT_ROUTE_KEYS_BY_ACCOUNT[accountType]) return accountType;

  // Permission fallbacks (same as dashboard layout)
  if (permission === 2) return 'care_home';
  if (permission === 3) return 'agency';
  if (permission === 4) return 'hospital_nhs';
  if (permission === 5) return 'local_authority';
  if (permission === 6) return 'individual_home_care';
  if (permission === 7) return 'home_care_company';
  if (permission === 8) return 'staff_member';

  return '';
}

export function mapSupportFromApi(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  // Some APIs nest the ticket under data / support / ticket
  const nested =
    (item.support && typeof item.support === 'object' && item.support) ||
    (item.ticket && typeof item.ticket === 'object' && item.ticket) ||
    null;
  const source = nested || item;

  const user =
    (source.user && typeof source.user === 'object' && source.user) ||
    (item.user && typeof item.user === 'object' && item.user) ||
    {};
  const basic =
    (user.basicInfo && typeof user.basicInfo === 'object' && user.basicInfo) ||
    (source.basicInfo && typeof source.basicInfo === 'object' && source.basicInfo) ||
    {};

  const id = source._id || source.id || item._id || item.id || `support-${index}`;
  const name = String(
    source.name ||
      basic.name ||
      user.name ||
      item.name ||
      source.userName ||
      ''
  ).trim();
  const email = String(
    source.email || basic.email || user.email || item.email || ''
  ).trim();
  const phone = String(
    source.phone ||
      source.phoneNumber ||
      basic.phoneNumber ||
      user.phoneNumber ||
      item.phone ||
      ''
  ).trim();
  const avatar = String(
    source.avatar ||
      source.avatarUrl ||
      basic.profileIcon ||
      user.profileIcon ||
      item.avatar ||
      ''
  ).trim();

  return {
    id: String(id),
    _id: String(id),
    name: name || '—',
    email,
    phone,
    avatar,
    type: String(
      source.type ||
        item.type ||
        source.userType ||
        item.userType ||
        source.accountType ||
        item.accountType ||
        user.accountState?.userType ||
        user.userType ||
        basic.userType ||
        ''
    ).trim(),
    subject: String(
      source.subject || source.title || source.heading || source.question || item.subject || ''
    ).trim(),
    message: String(
      source.message ||
        source.description ||
        source.detail ||
        source.content ||
        source.answer ||
        item.message ||
        ''
    ).trim(),
    response: String(
      source.response || source.adminResponse || source.reply || item.response || ''
    ).trim(),
    status: String(source.status || item.status || 'open').toLowerCase(),
    createdAt: source.createdAt || item.createdAt || source.updatedAt || item.updatedAt || '',
    updatedAt: source.updatedAt || item.updatedAt || source.createdAt || item.createdAt || '',
    receivedAt: source.createdAt || item.createdAt || '',
    raw: item,
  };
}

/** Admin form → POST/PUT /admin/support body */
export function buildSupportPayload({
  subject = '',
  message = '',
  status = 'open',
  response = '',
  includeResponse = false,
} = {}) {
  const body = {
    subject: String(subject || '').trim(),
    message: String(message || '').trim(),
  };
  const resolvedStatus = String(status || '').trim().toLowerCase();
  if (resolvedStatus) body.status = resolvedStatus;
  // PUT /admin/support/:id requires `response` (admin reply)
  if (includeResponse) {
    body.response = String(response || '').trim();
  }
  return body;
}

/** Same pagination / wrap shapes used across Tempy list APIs. */
export function extractSupportList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.docs)) return response.data.docs;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.supports)) return response.data.supports;
  if (Array.isArray(response?.data?.support)) return response.data.support;
  if (Array.isArray(response?.data?.tickets)) return response.data.tickets;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.list)) return response.data.list;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.docs)) return response.docs;
  if (Array.isArray(response?.supports)) return response.supports;
  if (Array.isArray(response?.tickets)) return response.tickets;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.result)) return response.result;

  const single = response?.data;
  if (single && typeof single === 'object' && (single._id || single.id || single.subject || single.message)) {
    return [single];
  }

  return [];
}

export function normalizeSupportListResponse(response) {
  const list = extractSupportList(response);
  const data = list
    .map(mapSupportFromApi)
    .filter((item) => item && item.id && item.status !== 'deleted' && item.status !== 'delete');

  return {
    data,
    meta: response?.meta || response?.data?.meta || {},
    message: response?.message || '',
  };
}

export function buildSupportCreatePayload({ subject = '', message = '' } = {}) {
  return {
    subject: String(subject || '').trim(),
    message: String(message || '').trim(),
  };
}

/** Display label for dashboard account type (nav / support copy). */
export function getSupportTypeLabel(type) {
  const match = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.find((option) => option.value === type);
  return match?.label || type || '—';
}
