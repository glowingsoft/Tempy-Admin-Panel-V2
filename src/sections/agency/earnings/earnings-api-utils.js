import { format, isValid } from 'date-fns';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';


export const PAYMENT_STATUSES = ['paid', 'processing', 'pending', 'refunded', 'failed'];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toNumberList(list) {
  return Array.isArray(list) ? list.map(toNumber) : [];
}

function mapBlock(block) {
  const source = asObject(block);
  return {
    amount: toNumber(source.amount),
    hours: toNumber(source.hours),
    bookings: toNumber(source.bookings),
  };
}

function mapSummary(summary) {
  const source = asObject(summary);
  return {
    total: mapBlock(source.total),
    ...Object.fromEntries(PAYMENT_STATUSES.map((status) => [status, mapBlock(source[status])])),
  };
}

function personName(person) {
  const source = asObject(person);
  return String(source.companyName || source.name || '').trim();
}

function mapDaily(daily) {
  if (!daily || typeof daily !== 'object') return null;
  const series = Array.isArray(daily.series) ? daily.series : [];
  const byName = (name) =>
    toNumberList(series.find((item) => String(item?.name).toLowerCase() === name)?.data);

  return {
    categories: Array.isArray(daily.categories) ? daily.categories.map(String) : [],
    dates: Array.isArray(daily.dates) ? daily.dates.map(String) : [],
    earned: byName('earned'),
    paid: byName('paid'),
    pending: byName('pending'),
    bookings: toNumberList(daily.bookings),
  };
}

function isEmployerPayee(employer) {
  const source = asObject(employer);
  const type = String(source.userType || source.accountType || source.role || '').toLowerCase();
  return type.includes('agency') || type.includes('home_care') || type.includes('homecare');
}

const PAYMENT_STATUS_ALIASES = {
  paid_out: 'paid',
  pending_submission: 'processing',
  submitted: 'processing',
  confirmed: 'processing',
  customer_approval_denied: 'failed',
  charged_back: 'failed',
  cancelled: 'failed',
};

function mapPaymentStatus(row, payment) {
  const refund = asObject(payment.refund || row?.refund);
  const raw = String(payment.status || row?.paymentStatus || '').trim().toLowerCase();
  if (String(refund.status || '').toLowerCase() === 'pending' && raw !== 'refunded') return 'refund_pending';
  if (String(refund.status || '').toLowerCase() === 'paid') return 'refunded';
  return PAYMENT_STATUS_ALIASES[raw] || raw;
}

function mapHistoryRow(row) {
  const shift = asObject(row?.shift);
  const location = asObject(row?.location);
  const worker = asObject(row?.worker);
  const payment = asObject(row?.payment);
  const shiftDate = shift.date ? new Date(shift.date) : null;
  const hasDate = shiftDate && isValid(shiftDate);
  const gross = toNumber(payment.amount ?? row?.amount);
  const platformFee = toNumber(row?.platformFee ?? payment.platformFee);
  const supplierEarns =
    payment.totalAmount == null && row?.totalAmount == null
      ? gross
      : toNumber(payment.totalAmount ?? row?.totalAmount);

  return {
    id: String(row?._id || row?.reference || ''),
    reference: String(row?.reference || ''),
    jobName: String(row?.jobName || '').trim(),
    date: hasDate ? format(shiftDate, 'd MMM yyyy') : '',
    time: [shift.startTime, shift.endTime].filter(Boolean).join(' – '),
    location: String(location.name || '').trim(),
    address: String(location.address || '').trim(),
    worker: {
      id: String(worker._id || ''),
      name: String(worker.name || '').trim(),
      avatarUrl: resolveProfileAssetUrl(worker.profileIcon),
      jobRole: String(worker.jobRole || '').trim(),
    },
    customerName: personName(row?.customer),
    employerName: personName(row?.employer),
    creditedToEmployer: isEmployerPayee(row?.employer),
    hours: toNumber(row?.hours),
    rate: toNumber(row?.rate),
    amount: gross,
    gross,
    platformFee,
    totalAmount: supplierEarns,
    payoutStatus: String(row?.payoutStatus || payment.payoutStatus || '').toLowerCase(),
    paymentStatus: mapPaymentStatus(row, payment),
  };
}

function mapTopWorkers(list) {
  if (!Array.isArray(list)) return null;
  return list.map((item, index) => {
    const worker = asObject(item?.worker);
    return {
      id: String(worker._id || ''),
      rank: index + 1,
      name: String(worker.name || '').trim() || 'Staff',
      avatarUrl: resolveProfileAssetUrl(worker.profileIcon),
      jobRole: String(worker.jobRole || '').trim(),
      amount: toNumber(item?.amount),
      hours: toNumber(item?.hours),
      bookings: toNumber(item?.bookings),
      share: toNumber(item?.sharePercent),
    };
  });
}

/** Map GET /web/:role/booking/earnings into the Earnings screen's shape. */
export function mapEarningsFromApi(response) {
  const data = asObject(response?.data ?? response);
  const summarySource = asObject(data.summary);
  const meta = asObject(response?.meta);
  const agencySupplied = data.agencySupplied ? mapBlock(data.agencySupplied) : null;
  const breakdown = data.breakdown
    ? {
        platformFee: toNumber(data.breakdown.platformFee),
        paidToSuppliers: toNumber(data.breakdown.paidToSuppliers),
      }
    : null;

  return {
    type: data.type === 'spend' ? 'spend' : 'earning',
    role: String(data.role || ''),
    summary: mapSummary(data.summary ? summarySource : { total: data.total }),
    previous: summarySource.previous ? mapSummary(summarySource.previous) : null,
    daily: mapDaily(data.daily),
    topWorkers: mapTopWorkers(data.topWorkers),
    history: (Array.isArray(data.history) ? data.history : []).map(mapHistoryRow),
    agencySupplied: agencySupplied?.bookings ? agencySupplied : null,
    breakdown,
    meta: {
      page: toNumber(meta.currentPage) || 1,
      totalPages: toNumber(meta.totalPages),
      totalRecords: toNumber(meta.totalRecords),
      limit: toNumber(meta.limit),
    },
  };
}
