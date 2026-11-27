import { format, isValid } from 'date-fns';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';


export const SUPPLIER_ROLES = ['agency', 'homeCareCompany', 'nurse'];
export const CUSTOMER_ROLES = ['careHome', 'user', 'localAuthority'];

export const CUSTOMER_TYPE_OPTIONS = [
  { value: 'careHome', label: 'Care home' },
  { value: 'user', label: 'Individual' },
  { value: 'localAuthority', label: 'Local authority' },
];

/** Contract upload customer types (includes LA for agency / nurse suppliers). */
export const CONTRACT_CUSTOMER_TYPE_OPTIONS = CUSTOMER_TYPE_OPTIONS;

export const HOME_CARE_COMPANY_CUSTOMER_TYPE_OPTIONS = [
  { value: 'localAuthority', label: 'Local authority' },
  { value: 'user', label: 'Individual' },
];

export function getAgreedRateCustomerTypeOptions(supplierRole) {
  if (supplierRole === 'homeCareCompany') return HOME_CARE_COMPANY_CUSTOMER_TYPE_OPTIONS;
  return CUSTOMER_TYPE_OPTIONS;
}

const ROLE_API_PREFIX = {
  agency: 'agency',
  homeCareCompany: 'home-care-company',
  nurse: 'nurse',
  careHome: 'care-home',
  user: 'user',
  localAuthority: 'local-authority',
  hospital: 'hospital',
};

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

export function mapUserOption(item = {}) {
  const basic = item.basicInfo || item;
  return {
    id: pickId(basic._id ? basic : item),
    name: basic.name || basic.email || 'Unnamed',
    email: basic.email || '',
  };
}


export const RATE_STATUS = {
  pending: { label: 'Waiting for customer', color: 'warning' },
  reviewRequested: { label: 'Review requested', color: 'info' },
  accepted: { label: 'Accepted', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  withdrawn: { label: 'Withdrawn', color: 'default' },
};

export const OPEN_RATE_STATUSES = ['pending', 'reviewRequested'];

export const RATE_SLOTS = [
  { key: 'day', label: 'Day' },
  { key: 'night', label: 'Night' },
  { key: 'weekend', label: 'Weekend' },
];

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

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function nextFixedCalendarDate(month, day, from = new Date()) {
  const today = startOfLocalDay(from);
  let candidate = new Date(today.getFullYear(), month - 1, day);
  if (candidate < today) {
    candidate = new Date(today.getFullYear() + 1, month - 1, day);
  }
  return toYmd(candidate);
}

export function easterSundayDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function nextEasterOffsetDate(offsetDays, from = new Date()) {
  const today = startOfLocalDay(from);
  let year = today.getFullYear();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const easter = easterSundayDate(year);
    const target = new Date(easter);
    target.setDate(easter.getDate() + offsetDays);
    if (startOfLocalDay(target) >= today) return toYmd(target);
    year += 1;
  }
  return toYmd(today);
}


export const DEFAULT_SPECIAL_DAY_PRESETS = [
  {
    id: 'christmas-day',
    name: 'Christmas Day',
    multiplier: 2,
    repeatsYearly: true,
    resolveDate: () => nextFixedCalendarDate(12, 25),
  },
  {
    id: 'boxing-day',
    name: 'Boxing Day',
    multiplier: 1.5,
    repeatsYearly: true,
    resolveDate: () => nextFixedCalendarDate(12, 26),
  },
  {
    id: 'new-years-day',
    name: "New Year's Day",
    multiplier: 1.5,
    repeatsYearly: true,
    resolveDate: () => nextFixedCalendarDate(1, 1),
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    multiplier: 1.5,
    repeatsYearly: false,
    resolveDate: () => nextEasterOffsetDate(-2),
  },
  {
    id: 'easter-monday',
    name: 'Easter Monday',
    multiplier: 1.5,
    repeatsYearly: false,
    resolveDate: () => nextEasterOffsetDate(1),
  },
];

export function formatMultiplierLabel(multiplier) {
  if (multiplier === 2) return 'double basic rate';
  if (multiplier === 1.5) return '1½ × basic rate';
  return `${multiplier} × basic rate`;
}

export function rateFromBasicMultiplier(basicRate, multiplier) {
  const basic = Number(basicRate);
  const factor = Number(multiplier);
  if (!(basic > 0) || !(factor > 0)) return '';
  return String(Math.round(basic * factor * 100) / 100);
}

export function buildDefaultSpecialDayPresets(basicRate = '') {
  return DEFAULT_SPECIAL_DAY_PRESETS.map((preset) => ({
    presetId: preset.id,
    name: preset.name,
    date: preset.resolveDate(),
    repeatsYearly: preset.repeatsYearly,
    multiplier: preset.multiplier,
    rate: rateFromBasicMultiplier(basicRate, preset.multiplier),
    autoRate: true,
  }));
}

function mapRates(rates = {}) {
  return {
    day: Number(rates.day) || 0,
    night: Number(rates.night) || 0,
    weekend: Number(rates.weekend) || 0,
    specialDays: mapSpecialDays(rates.specialDays),
  };
}

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


export const HIRE_STATUS = {
  pending: { label: 'Waiting for supplier', color: 'warning' },
  accepted: { label: 'Hired', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

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
