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
  };
}

function isOwed(row) {
  return !row.payoutStatus || row.payoutStatus === 'owed';
}

export function extractAdminPayouts(response) {
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
  const rows = (candidates.find(Array.isArray) || [])
    .map(mapAdminPayout)
    .filter((row) => row.supplierId && isOwed(row));

  const grouped = new Map();
  rows.forEach((row) => {
    const existing = grouped.get(row.supplierId);
    if (!existing) {
      grouped.set(row.supplierId, { ...row, bookingIds: [...row.bookingIds] });
      return;
    }
    existing.bookingIds = [...new Set([...existing.bookingIds, ...row.bookingIds])];
    existing.totalOwed = Math.round((existing.totalOwed + row.totalOwed) * 100) / 100;
    existing.bookingCount = existing.bookingIds.length || existing.bookingCount + row.bookingCount;
    if (!existing.accountHolderName) existing.accountHolderName = row.accountHolderName;
    if (!existing.sortCode) existing.sortCode = row.sortCode;
    if (!existing.accountNumber) existing.accountNumber = row.accountNumber;
    existing.bankDetailsMissing = !existing.sortCode && !existing.accountNumber;
    if (existing.name === 'Supplier' && row.name !== 'Supplier') existing.name = row.name;
  });

  return [...grouped.values()].sort((a, b) => b.totalOwed - a.totalOwed);
}
