import { ADMIN_AGENCIES_LIST } from './_admin-agencies';
import { _staffList, getStaffSpecialtyLabel } from './_staff';

// ----------------------------------------------------------------------

export const AGREED_RATE_PARTNER_TYPES = [
  { value: 'agency', label: 'Agency' },
  { value: 'individual', label: 'Individual' },
  { value: 'localAuthority', label: 'Local Authority' },
  { value: 'careHome', label: 'Care Home' },
];

export const AGREED_RATE_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'paused', label: 'Paused', color: 'warning' },
];

/** Partners sourced from project agency + staff mocks (not free-text). */
export const AGREED_RATE_PARTNERS = [
  ...ADMIN_AGENCIES_LIST.filter((agency) => agency.status === 'active').map((agency) => ({
    id: agency.id,
    partnerType: 'agency',
    name: agency.name,
    email: agency.email,
    location: agency.location,
    subtitle: `${agency.location} · ${agency.staffCount} staff · ${agency.activeJobs} active jobs`,
  })),
  ..._staffList.slice(0, 6).map((staff) => ({
    id: staff.id,
    partnerType: 'individual',
    name: staff.name,
    email: staff.email,
    location: staff.location,
    specialty: staff.specialty,
    subtitle: `${getStaffSpecialtyLabel(staff.specialty)} · ${staff.location}`,
  })),
];

export function getAgreedRatePartnerById(partnerId) {
  return AGREED_RATE_PARTNERS.find((partner) => partner.id === partnerId) || null;
}

export function getAgreedRatePartnersByType(partnerType) {
  return AGREED_RATE_PARTNERS.filter((partner) => partner.partnerType === partnerType);
}

function buildAgreedRate({
  id,
  partnerId,
  jobType,
  hourlyRate,
  autoAssign = true,
  status = 'active',
  updatedAt = 'Just now',
}) {
  const partner = getAgreedRatePartnerById(partnerId);

  return {
    id,
    partnerId,
    partnerType: partner?.partnerType || 'agency',
    partnerName: partner?.name || '',
    partnerSubtitle: partner?.subtitle || '',
    jobType,
    hourlyRate,
    autoAssign,
    status,
    updatedAt,
  };
}

export const _agreedRates = [
  buildAgreedRate({
    id: 'rate-001',
    partnerId: 'ag-001', // CarePlus Agency
    jobType: 'Senior Care',
    hourlyRate: 22.5,
    autoAssign: true,
    status: 'active',
    updatedAt: '2 days ago',
  }),
  buildAgreedRate({
    id: 'rate-002',
    partnerId: 'ag-002', // Prime Health Services
    jobType: 'Nurse',
    hourlyRate: 28,
    autoAssign: true,
    status: 'active',
    updatedAt: '5 hours ago',
  }),
  buildAgreedRate({
    id: 'rate-003',
    partnerId: 'N001', // Ayesha Khan (staff)
    jobType: 'Senior Care',
    hourlyRate: 26.67,
    autoAssign: false,
    status: 'active',
    updatedAt: '1 day ago',
  }),
  buildAgreedRate({
    id: 'rate-004',
    partnerId: 'ag-003', // Jaosh Care Agency
    jobType: 'Carer',
    hourlyRate: 17.5,
    autoAssign: true,
    status: 'paused',
    updatedAt: '1 week ago',
  }),
];
