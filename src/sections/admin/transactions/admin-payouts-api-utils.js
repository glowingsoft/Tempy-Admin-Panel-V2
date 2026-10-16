function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return asText(asObject(value)._id || asObject(value).id);
}

function personName(value) {
  const source = asObject(value);
  return asText(source.companyName || source.name || source.fullName) || asText(value);
}

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return asText(value);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mapAdminPayout(item = {}) {
  const payment = asObject(item.payment);
  const supplier = asObject(item.supplier || item.employer || item.worker || item.user || item.payee);
  const bank = asObject(item.bankDetails || supplier.bankDetails || item.bank || supplier.bank);
  const supplierId = asText(item.supplierId) || pickId(item.userId || item.employerId || item.workerId || supplier);

  const bookingIds = Array.isArray(item.bookingIds)
    ? item.bookingIds.map((id) => asText(id) || pickId(id)).filter(Boolean)
    : [];
  const ownBooking = pickId(item.bookingId || item.booking);
  if (!bookingIds.length && ownBooking) bookingIds.push(ownBooking);

  const sortCode = asText(bank.sortCode || item.sortCode || supplier.sortCode);
  const accountNumber = asText(
    bank.accountNumber || bank.accountNo || item.accountNumber || supplier.accountNumber
  );
  const bankDetailsMissing =
    item.bankDetailsMissing === true ||
    (!asText(bank.accountHolderName || bank.accountName) && !sortCode && !accountNumber);

  const totalOwed =
    item.totalOwed != null
      ? toNumber(item.totalOwed)
      : toNumber(payment.totalAmount ?? item.totalAmount ?? payment.amount ?? item.amount);

  const payoutReferences = Array.isArray(item.payoutReferences)
    ? item.payoutReferences.map((ref) => asText(ref)).filter(Boolean)
    : asText(item.payoutReference)
      ? [asText(item.payoutReference)]
      : [];

  return {
    supplierId,
    name: asText(item.name) || personName(item.supplierName || supplier) || 'Supplier',
    userType: asText(item.userType || item.payeeType || supplier.userType || supplier.accountType),
    accountHolderName: asText(bank.accountHolderName || bank.accountName || item.accountName),
    sortCode,
    accountNumber,
    bankDetailsMissing,
    totalOwed,
    bookingCount: Number.isFinite(Number(item.bookingCount)) ? Number(item.bookingCount) : bookingIds.length,
    bookingIds,
    payoutStatus: asText(item.payoutStatus || payment.payoutStatus).toLowerCase(),
    lastPaidAt: formatWhen(item.lastPaidAt || item.paidAt || payment.paidAt),
    payoutReferences,
  };
}

function extractRows(response) {
  const data = response?.data;
  const candidates = [
    data,
    data?.payouts,
    data?.suppliers,
    data?.rows,
    data?.items,
    data?.list,
    response?.payouts,
    response?.results,
  ];
  return candidates.find(Array.isArray) || [];
}

function readCountBucket(counts, key) {
  const bucket = asObject(asObject(counts)[key]);
  return {
    suppliers: toNumber(bucket.suppliers ?? bucket.count ?? bucket.total),
    bookings: toNumber(bucket.bookings),
  };
}

/**
 * Map GET /admin/gocardless/payouts (?status=&page=&limit=).
 * Returns rows + pagination meta + status counts from `meta.counts`.
 */
export function extractAdminPayouts(response) {
  const data = asObject(response?.data);
  const metaSource = asObject(response?.meta ?? data.meta);
  const rows = extractRows(response).map(mapAdminPayout).filter((row) => row.supplierId);

  const countsSource = asObject(metaSource.counts || data.counts || response?.counts);
  const owed = readCountBucket(countsSource, 'owed');
  const paid = readCountBucket(countsSource, 'paid');

  const totalRecords = toNumber(
    metaSource.totalRecords ?? metaSource.total ?? metaSource.totalCount ?? data.totalRecords
  );

  return {
    rows,
    meta: {
      page: toNumber(metaSource.currentPage || metaSource.page) || 1,
      totalPages: toNumber(metaSource.totalPages) || 1,
      totalRecords,
      limit: toNumber(metaSource.limit) || rows.length || 10,
      hasTotal: Number.isFinite(Number(metaSource.totalRecords ?? metaSource.total ?? metaSource.totalCount)),
    },
    counts: {
      owed,
      paid,
      allSuppliers: owed.suppliers + paid.suppliers,
      allBookings: owed.bookings + paid.bookings,
    },
  };
}
