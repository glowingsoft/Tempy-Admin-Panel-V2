function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const source = asObject(value);
  return asText(source._id || source.id);
}

function partyName(value) {
  const source = asObject(value);
  return asText(source.name || source.fullName || source.companyName || source.email) || asText(value);
}

function locationLabel(item, customer) {
  if (typeof item.location === 'string') return item.location;
  const location = asObject(item.location || customer.location || item.branch);
  return asText(location.city || location.address || location.name || item.city) || '—';
}

const TYPE_LABELS = {
  agency: 'Agency',
  homeCareCompany: 'Home care company',
  home_care_company: 'Home care company',
  nurse: 'Solo nurse',
  careHome: 'Care home',
  care_home: 'Care home',
  user: 'Individual',
  hospital: 'Hospital',
  hospital_nhs: 'Hospital',
  localAuthority: 'Local authority',
  local_authority: 'Local authority',
};

function typeLabel(value) {
  const raw = asText(value);
  return TYPE_LABELS[raw] || raw.replace(/[_-]+/g, ' ');
}

export function mapAdminPermanentHire(item = {}, listStatus = 'accepted') {
  const worker = asObject(item.worker || item.nurse || item.staff);
  const customer = asObject(item.customer || item.employer || item.careHome);
  const jobType = asObject(item.jobType || item.role);
  const status = asText(item.status).toLowerCase() || listStatus;

  return {
    id: pickId(item._id || item.id || item.hireId),
    workerName: partyName(worker) || asText(item.workerName) || '—',
    workerEmail: asText(worker.email || item.workerEmail),
    employerName: partyName(customer) || asText(item.employerName || item.customerName) || '—',
    employerType: typeLabel(
      customer.userType || customer.accountState?.userType || item.customerType || item.employerType
    ),
    role: asText(jobType.title || jobType.name || item.role || item.jobTitle) || '—',
    location: locationLabel(item, customer),
    supplierType: typeLabel(item.supplierType || worker.accountState?.userType || worker.modelType),
    shiftsWorked: Number(item.shiftsWorked ?? item.tempShiftsCompleted ?? item.shifts) || 0,
    tempShiftsCompleted: Number(item.shiftsWorked ?? item.tempShiftsCompleted ?? item.shifts) || 0,
    fee: Number(item.fee) || 0,
    status: status === 'permanent_hired' ? 'hired' : status,
    offerDate: item.createdAt || item.offerDate || '',
    startDate: item.startDate || item.hiredAt || item.respondedAt || '',
    respondedAt: item.respondedAt || '',
    endedAt: item.endedAt || '',
    updatedAt: item.updatedAt || item.respondedAt || item.createdAt || '',
  };
}

export function mapAdminPermanentHirePage(response, listStatus) {
  const data = extractList(response)
    .map((item) => mapAdminPermanentHire(item, listStatus))
    .filter((row) => row.id);
  const meta = asObject(response?.meta);

  return {
    data,
    totalRecords: Number(meta.totalRecords ?? data.length) || 0,
    currentPage: Number(meta.currentPage) || 1,
    totalPages: Number(meta.totalPages) || 1,
    limit: Number(meta.limit) || 10,
  };
}

function extractList(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.hires)) return data.hires;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.permanentHires)) return data.permanentHires;
  return [];
}
