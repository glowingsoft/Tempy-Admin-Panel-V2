import { AUTH_PUBLIC_LOGIN_ROLE_OPTIONS } from 'src/sections/auth/jwt/auth-role-options';

// ----------------------------------------------------------------------

/**
 * Map dashboard accountType → API_ROUTES FAQ keys.
 * Keep per-dashboard so paths can diverge later (same as Support).
 */
export const FAQ_ROUTE_KEYS_BY_ACCOUNT = {
  care_home: 'CARE_HOME_FAQS',
  careHome: 'CARE_HOME_FAQS',
  hospital_nhs: 'HOSPITAL_FAQS',
  hospital: 'HOSPITAL_FAQS',
  local_authority: 'LOCAL_AUTHORITY_FAQS',
  localAuthority: 'LOCAL_AUTHORITY_FAQS',
  individual_home_care: 'INDIVIDUAL_HOME_CARE_FAQS',
  agency: 'AGENCY_FAQS',
  home_care_company: 'HOME_CARE_COMPANY_FAQS',
  homeCareCompany: 'HOME_CARE_COMPANY_FAQS',
  staff_member: 'STAFF_MEMBER_FAQS',
  nurse: 'STAFF_MEMBER_FAQS',
};

export function resolveFaqAccountKey(user) {
  const accountType =
    user?.accountState?.accountType || user?.accountType || user?.userType || '';
  const permission = Number(user?.permission);

  if (FAQ_ROUTE_KEYS_BY_ACCOUNT[accountType]) return accountType;

  if (permission === 2) return 'care_home';
  if (permission === 3) return 'agency';
  if (permission === 4) return 'hospital_nhs';
  if (permission === 5) return 'local_authority';
  if (permission === 6) return 'individual_home_care';
  if (permission === 7) return 'home_care_company';
  if (permission === 8) return 'staff_member';

  return '';
}

export function mapFaqFromApi(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  const id = item._id || item.id || `faq-${index}`;

  return {
    id: String(id),
    value: item.value || `panel-${id}`,
    type: item.type || item.userType || item.accountType || item.role || '',
    heading: item.heading || item.question || item.title || '',
    detail: item.detail || item.answer || item.description || item.content || '',
    status: String(item.status || '').toLowerCase(),
    raw: item,
  };
}

/** Map UI account key or apiUserType → backend Faq/Support type enum */
export function resolveFaqApiType(type = '') {
  const raw = String(type || '').trim();
  if (!raw) return '';
  const match = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.find(
    (option) => option.apiUserType === raw || option.value === raw
  );
  return match?.apiUserType || raw;
}

/** Admin form → POST/PUT /admin/faqs body */
export function buildFaqPayload({ type = '', heading = '', detail = '' } = {}) {
  return {
    type: resolveFaqApiType(type),
    question: String(heading || '').trim(),
    answer: String(detail || '').trim(),
  };
}

export function normalizeFaqsResponse(response) {
  const raw = response?.data ?? response;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.faqs)
      ? raw.faqs
      : Array.isArray(raw?.docs)
        ? raw.docs
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

  const data = list
    .map(mapFaqFromApi)
    .filter((item) => item && item.id && item.status !== 'deleted' && item.status !== 'delete');

  return {
    data,
    meta: response?.meta || {},
    message: response?.message || '',
  };
}
