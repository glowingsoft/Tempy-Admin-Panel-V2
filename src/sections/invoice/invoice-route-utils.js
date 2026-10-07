import { paths } from 'src/routes/paths';

const ROLE_INVOICE_BASES = [
  ['/dashboard/individual-home-care', paths.dashboard.individualHomeCare.invoices, 'individualHomeCare'],
  ['/dashboard/home-care-company', paths.dashboard.homeCareCompany.invoices, 'homeCareCompany'],
  ['/dashboard/local-authority', paths.dashboard.localAuthority.invoices, 'localAuthority'],
  ['/dashboard/staff-member', paths.dashboard.staffMember.invoices, 'staffMember'],
  ['/dashboard/hospital', paths.dashboard.hospital.invoices, 'hospital'],
  ['/dashboard/agency', paths.dashboard.agency.invoices, 'agency'],
];

/** Employers do not create invoices — they only see automatic shift payments. */
export const EMPLOYER_INVOICE_ROLES = [
  'careHome',
  'hospital',
  'localAuthority',
  'individualHomeCare',
];

export function isEmployerInvoiceRole(roleKey = '') {
  return EMPLOYER_INVOICE_ROLES.includes(roleKey);
}

export function getInvoiceRoleKey(pathname = '') {
  const roleHit = ROLE_INVOICE_BASES.find(([prefix]) => pathname.startsWith(prefix));
  if (roleHit) return roleHit[2];
  if (pathname.startsWith('/dashboard') && !pathname.includes('/agency')) {
    // Default care-home dashboard invoices
    return 'careHome';
  }
  return 'default';
}

export function getInvoicePaths(pathname = '') {
  const roleHit = ROLE_INVOICE_BASES.find(([prefix]) => pathname.startsWith(prefix));
  const list = roleHit ? roleHit[1] : paths.dashboard.invoice.root;
  const dashboard = roleHit ? roleHit[0] : paths.dashboard.root;

  return {
    dashboard,
    list,
    new: `${list}/new`,
    details: (id) => `${list}/${id}`,
    edit: (id) => `${list}/${id}/edit`,
    roleKey: roleHit ? roleHit[2] : getInvoiceRoleKey(pathname),
  };
}
