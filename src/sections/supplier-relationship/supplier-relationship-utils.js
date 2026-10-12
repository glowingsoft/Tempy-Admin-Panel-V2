import { format, isValid } from 'date-fns';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

// ----------------------------------------------------------------------

/** Suppliers: agency, home care company, solo nurse. Customers: care home, individual. */
export const SUPPLIER_ROLES = ['agency', 'homeCareCompany', 'nurse'];
export const CUSTOMER_ROLES = ['careHome', 'user'];

export const CUSTOMER_TYPE_OPTIONS = [
  { value: 'careHome', label: 'Care home' },
  { value: 'user', label: 'Individual' },
];

const ROLE_API_PREFIX = {
  agency: 'agency',
  homeCareCompany: 'home-care-company',
  nurse: 'nurse',
  careHome: 'care-home',
  user: 'user',
};

/** e.g. /web/agency — contracts, agreed rates and permanent hires live under each role's router. */
export function getRoleApiBase(user) {
  const prefix = ROLE_API_PREFIX[resolveDashboardRole(user)];
  return prefix ? `/web/${prefix}` : '';
}

export function getRelationshipSide(user) {
  const role = resolveDashboardRole(user);
  if (SUPPLIER_ROLES.includes(role)) return 'supplier';
  if (CUSTOMER_ROLES.includes(role)) return 'customer';
  return null;
}

export const CONTRACT_STATUS = {
  none: { label: 'No contract', color: 'default' },
  awaitingCustomer: { label: 'Waiting for customer to sign', color: 'warning' },
  awaitingSupplier: { label: 'Waiting for supplier to countersign', color: 'info' },
  signed: { label: 'Signed', color: 'success' },
};

function pickId(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
}

const PARTY_TYPE_LABELS = {
  agency: 'Agency',
  homeCareCompany: 'Home care company',
  nurse: 'Solo nurse',
  careHome: 'Care home',
  user: 'Individual',
  hospital: 'Hospital',
  localAuthority: 'Local authority',
};

function mapParty(party) {
  const obj = party && typeof party === 'object' ? party : {};
  const type = obj.accountState?.userType || obj.userType || '';
  return {
    id: pickId(party),
    name: obj.name || obj.email || '—',
    email: obj.email || '',
    phone: obj.phoneNumber || obj.phone || '',
    avatarUrl: resolveProfileAssetUrl(obj.profileIcon),
    typeLabel: PARTY_TYPE_LABELS[type] || '',
  };
}

/** GET /contracts item → table row */
export function mapRelationshipFromApi(item = {}) {
  const contract = item.contract || {};
  return {
    id: pickId(item),
    supplier: mapParty(item.supplier),
    customer: mapParty(item.customer),
    status: contract.status || 'none',
    documentUrl: resolveProfileAssetUrl(contract.document),
    signedDocumentUrl: resolveProfileAssetUrl(contract.signedDocument),
    customerSignature: contract.customerSignature || '',
    customerSignedAt: contract.customerSignedAt || '',
    supplierSignature: contract.supplierSignature || '',
    supplierSignedAt: contract.supplierSignedAt || '',
    updatedAt: item.updatedAt || '',
  };
}

/** GET users?userType= item → { id, name, email } option */
export function mapUserOption(item = {}) {
  const basic = item.basicInfo || item;
  return {
    id: pickId(basic._id ? basic : item),
    name: basic.name || basic.email || 'Unnamed',
    email: basic.email || '',
  };
}

// ----------------------------------------------------------------------

export const RATE_STATUS = {
  pending: { label: 'Waiting for customer', color: 'warning' },
  reviewRequested: { label: 'Review requested', color: 'info' },
  accepted: { label: 'Accepted', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  withdrawn: { label: 'Withdrawn', color: 'default' },
};

/** Supplier can still change or withdraw it; customer can still respond. */
export const OPEN_RATE_STATUSES = ['pending', 'reviewRequested'];

export const RATE_SLOTS = [
  { key: 'day', label: 'Day' },
  { key: 'night', label: 'Night' },
  { key: 'weekend', label: 'Weekend' },
];

/** Supplier-named extra days (Christmas, …) with their own hourly rate. */
function mapSpecialDays(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      name: String(item?.name || '').trim(),
      date: String(item?.date || '').slice(0, 10),
      repeatsYearly: item?.repeatsYearly === true,
      rate: Number(item?.rate) || 0,
    }))
    .filter((item) => item.name && item.date);
}

function mapRates(rates = {}) {
  return {
    day: Number(rates.day) || 0,
    night: Number(rates.night) || 0,
    weekend: Number(rates.weekend) || 0,
    specialDays: mapSpecialDays(rates.specialDays),
  };
}

/** "25 Dec, every year" or "3 Jan 2027". */
export function formatSpecialDayDate(specialDay) {
  const date = new Date(`${specialDay.date}T00:00:00`);
  if (!isValid(date)) return specialDay.date;
  return specialDay.repeatsYearly ? `${format(date, 'd MMM')}, every year` : format(date, 'd MMM yyyy');
}

const AGREED_RATE_SLOTS = [
  { key: 'day', label: 'Day rate' },
  { key: 'night', label: 'Night rate' },
  { key: 'weekend', label: 'Weekend rate' },
];

function unwrapCurrentAgreedRate(response) {
  const root = response?.data ?? response;
  if (root == null) return [];
  if (Array.isArray(root)) return root;
  if (typeof root !== 'object') return [];

  const nested =
    root.agreedRate ||
    root.agreedRates ||
    root.current ||
    root.currentAgreedRate ||
    root.agreement ||
    root.rate;
  if (nested && typeof nested === 'object') {
    return Array.isArray(nested) ? nested : [nested];
  }

  return [root];
}

function readRateAmount(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'object') {
    return Number(value.rate ?? value.amount ?? value.hourlyRate ?? value.price ?? value.value);
  }
  return Number(value);
}

/**
 * GET /agreed-rates/current → dropdown options for the bid form.
 * One agreement can expose day, night, weekend and special-day rates.
 */
export function mapCurrentAgreedRateOptions(response) {
  const records = unwrapCurrentAgreedRate(response);
  const options = [];

  records.forEach((record, recordIndex) => {
    if (!record || typeof record !== 'object') return;

    const rateBlock = record.rates && typeof record.rates === 'object' ? record.rates : record.rate && typeof record.rate === 'object' ? record.rate : record;
    const rates = rateBlock;
    const recordId = String(record?._id || record?.id || recordIndex);

    const push = (key, label, value) => {
      const rate = readRateAmount(value);
      if (!(rate > 0)) return;
      options.push({ id: `${recordId}-${key}`, label, rate });
    };

    if (Array.isArray(rates)) {
      rates.forEach((item, index) => {
        const typeKey = String(item?.type || item?.key || item?.name || item?.label || '').toLowerCase();
        const slot = AGREED_RATE_SLOTS.find((entry) => typeKey.includes(entry.key));
        const label = slot?.label || String(item?.name || item?.label || 'Agreed rate').trim() || 'Agreed rate';
        push(slot?.key || `item-${index}`, label, item?.rate ?? item?.amount ?? item?.hourlyRate ?? item?.price ?? item);
      });
    } else if (rates && typeof rates === 'object') {
      AGREED_RATE_SLOTS.forEach((slot) =>
        push(
          slot.key,
          slot.label,
          rates[slot.key] ?? rates[`${slot.key}Rate`] ?? rates[`${slot.key}HourlyRate`] ?? rates[`${slot.key}Price`]
        )
      );
      const specials = Array.isArray(rates.specialDays)
        ? rates.specialDays
        : Array.isArray(rates.specialDayRates)
          ? rates.specialDayRates
          : [];
      specials.forEach((day, index) => {
        const name = String(day?.name || '').trim();
        push(`special-${index}`, name ? `${name} rate` : 'Special day rate', day?.rate ?? day?.amount ?? day?.hourlyRate);
      });
    }

    if (!options.some((option) => option.id.startsWith(`${recordId}-`))) {
      const typeKey = String(record.type || record.name || record.label || record.title || '').toLowerCase();
      const slot = AGREED_RATE_SLOTS.find((entry) => typeKey.includes(entry.key));
      const label = slot?.label || String(record.name || record.label || record.title || 'Agreed rate').trim() || 'Agreed rate';
      push(slot?.key || 'rate', label, record?.rate ?? record?.hourlyRate ?? record?.amount ?? record?.price);
    }
  });

  return options;
}

/** GET /agreed-rates item → table row */
export function mapAgreedRateFromApi(item = {}) {
  const jobType = item.jobType && typeof item.jobType === 'object' ? item.jobType : {};
  const review = item.review || {};
  return {
    id: pickId(item),
    supplier: mapParty(item.supplier),
    customer: mapParty(item.customer),
    jobTypeId: pickId(item.jobType),
    jobType: jobType.title || jobType.name || '—',
    jobTypeDepartment: jobType.department || '',
    rates: mapRates(item.rates),
    effectiveFrom: item.effectiveFrom || '',
    status: item.status || 'pending',
    reviewNote: review.note || '',
    reviewRates: review.requestedRates ? mapRates(review.requestedRates) : null,
    reviewRequestedAt: review.requestedAt || '',
    respondedAt: item.respondedAt || '',
    createdAt: item.createdAt || '',
  };
}

// ----------------------------------------------------------------------

export const HIRE_STATUS = {
  pending: { label: 'Waiting for supplier', color: 'warning' },
  accepted: { label: 'Hired', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

/** GET /permanent-hires/eligible item → worker the care home could hire */
export function mapEligibleWorkerFromApi(item = {}) {
  const worker = mapParty(item.worker);
  const supplier = item.supplier ? mapParty(item.supplier) : null;
  return {
    id: `${worker.id}-${supplier?.id || 'nurse'}`,
    worker,
    supplier,
    supplierType: item.supplierType || (supplier ? 'agency' : 'nurse'),
    shiftsWorked: Number(item.shiftsWorked) || 0,
  };
}

/** GET /permanent-hires item → table row */
export function mapPermanentHireFromApi(item = {}) {
  const source = item && typeof item === 'object' ? item : {};
  const status = String(source.status || 'pending').toLowerCase();
  return {
    id: pickId(source._id || source.id || source.hireId),
    customer: mapParty(source.customer || source.employer || source.careHome),
    supplier: mapParty(source.supplier || source.agency),
    worker: mapParty(source.worker || source.nurse || source.staff),
    supplierType: source.supplierType || '',
    shiftsWorked: Number(source.shiftsWorked ?? source.tempShiftsCompleted ?? source.shifts) || 0,
    fee: Number(source.fee) || 0,
    status: status === 'permanent_hired' ? 'accepted' : status,
    createdAt: source.createdAt || '',
    respondedAt: source.respondedAt || '',
  };
}
