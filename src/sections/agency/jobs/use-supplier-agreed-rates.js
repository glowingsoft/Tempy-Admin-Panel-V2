import { useSelector } from 'react-redux';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';
import { useGetCurrentAgreedRateQuery } from 'src/store/Reducer/supplier-relationships-api';
import { useGetNurseJobByIdQuery } from 'src/store/Reducer/nurse-jobs-api';
import { getRoleApiBase } from 'src/sections/supplier-relationship/supplier-relationship-utils';

import { readHasAgreedRate, readJobCustomerId, readJobRoleId } from './agency-job-api-utils';

const SUPPLIER_RATE_BASES = new Set(['/web/agency', '/web/home-care-company', '/web/nurse']);

function mongoId(value) {
  const text = String(value ?? '').trim();
  return /^[a-fA-F0-9]{24}$/.test(text) ? text : '';
}

function resolveJobTypeTitle(job) {
  const raw = job?.raw || {};
  const type = raw.type && typeof raw.type === 'object' ? raw.type : job?.jobType;
  return String(job?.role || job?.jobTypeTitle || type?.title || type?.name || '').trim();
}

function jobHasAgreedRate(job, shiftRow) {
  const raw = job?.raw || {};
  const shifts = [
    ...(Array.isArray(raw.shift) ? raw.shift : []),
    ...(Array.isArray(raw.shifts) ? raw.shifts : []),
  ];
  const shiftId = String(shiftRow?.id || shiftRow?._id || '');
  const matched = shiftId
    ? shifts.find((shift) => String(shift?._id || shift?.id || '') === shiftId)
    : null;

  return [job, raw, shiftRow, matched, ...shifts].some((item) => readHasAgreedRate(item));
}

function toMinutes(value) {
  const [hours, minutes] = String(value || '')
    .slice(0, 5)
    .split(':')
    .map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function shiftHours(shiftRow, job) {
  const start = toMinutes(shiftRow?.startTime || job?.shiftStartTime || job?.startTime);
  const end = toMinutes(shiftRow?.endTime || job?.shiftEndTime || job?.endTime);
  if (start == null || end == null) return Number(job?.hours) || 0;
  const length = end > start ? end - start : end - start + 24 * 60;
  const breakMin = Number(shiftRow?.breakMin ?? job?.breakMin) || 0;
  return Math.max(0, (length - breakMin) / 60);
}

export function bidTotalForRate(rate, hours) {
  const total = hours > 0 ? Number(rate) * hours : Number(rate);
  return String(Math.round(total * 100) / 100);
}

/** New bid: first rate. Edit: the rate that matches the amount already saved. */
export function pickAgreedRateOption(options, { amount = 0, hourlyRate, hours = 0 } = {}) {
  if (!Array.isArray(options) || !options.length) return null;

  const total = Number(amount) || 0;
  const hourly = Number(hourlyRate) || (hours > 0 && total > 0 ? total / hours : 0);

  const exact = options.find((option) => {
    const optionTotal = Number(bidTotalForRate(option.rate, hours));
    return (
      (hourly > 0 && Math.abs(Number(option.rate) - hourly) < 0.05) ||
      (total > 0 && Math.abs(optionTotal - total) < 0.05)
    );
  });
  if (exact) return exact;

  if (hourly > 0) {
    return [...options].sort(
      (left, right) => Math.abs(Number(left.rate) - hourly) - Math.abs(Number(right.rate) - hourly)
    )[0];
  }

  return options[0];
}

/**
 * Logged-in supplier prefix for GET /web/{supplier}/agreed-rates/current.
 * Nurse, agency, and home care company each use their own route.
 */
export function useSupplierAgreedRates({ open, job, shiftRow = null, rateApiBase = '' }) {
  const { user } = useSelector((state) => state.user);
  const loginBase = getRoleApiBase(user);
  const apiBase = SUPPLIER_RATE_BASES.has(loginBase) ? loginBase : rateApiBase;
  const isAgreed = job?.hasAgreedRate === true || jobHasAgreedRate(job, shiftRow);
  const listedCustomerId = readJobCustomerId(job);
  const listedJobTypeId = readJobRoleId(job);
  const jobTypeTitle = resolveJobTypeTitle(job);
  const role = resolveDashboardRole(user);
  const needsJobDetail = open && isAgreed && apiBase === '/web/nurse' && (!listedCustomerId || !listedJobTypeId);
  const { data: jobDetail, isFetching: jobDetailLoading } = useGetNurseJobByIdQuery(job?.id, {
    skip: !needsJobDetail || !job?.id,
  });
  const customerId = listedCustomerId || readJobCustomerId(jobDetail);
  const jobTypeIdFromJob = listedJobTypeId || readJobRoleId(jobDetail);
  const { data: roleJobTypes = [], isFetching: roleTypesLoading } = useRoleJobTypes(role, {
    skip: !open || !isAgreed || !SUPPLIER_RATE_BASES.has(apiBase) || Boolean(jobTypeIdFromJob),
  });
  const matchedRoleId = mongoId(
    roleJobTypes.find((item) => {
      const title = String(item?.title || item?.name || '').trim().toLowerCase();
      return title && title === jobTypeTitle.toLowerCase();
    })?.id
  );
  const jobTypeId = jobTypeIdFromJob || matchedRoleId;
  const canCheckAgreedRate = open && isAgreed && SUPPLIER_RATE_BASES.has(apiBase) && Boolean(customerId && jobTypeId);
  const resolvingJobType =
    (needsJobDetail && jobDetailLoading) ||
    (open && isAgreed && SUPPLIER_RATE_BASES.has(apiBase) && Boolean(customerId) && !jobTypeIdFromJob && roleTypesLoading && !jobTypeId);

  const { data: agreedRates = [], isFetching: agreedRatesLoading, isError: agreedRatesError } = useGetCurrentAgreedRateQuery(
    { base: apiBase, customer: customerId, jobType: jobTypeId },
    { skip: !canCheckAgreedRate, refetchOnMountOrArgChange: true }
  );

  const rateOptions = isAgreed && Array.isArray(agreedRates) ? agreedRates : [];
  const checkingAgreedRate = resolvingJobType || (canCheckAgreedRate && agreedRatesLoading && !rateOptions.length);

  return {
    apiBase,
    isAgreed,
    rateOptions,
    checkingAgreedRate,
    agreedRatesError,
  };
}
