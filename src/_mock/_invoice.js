import { fSub, fAdd } from 'src/utils/format-time';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const INVOICE_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'draft', label: 'Draft' },
];

/** Agency / care-home style line items (staffing cover between organisations). */
export const INVOICE_SERVICE_OPTIONS = [
  { id: _mock.id(1), name: 'Staffing hours', price: 360 },
  { id: _mock.id(2), name: 'Agency cover', price: 520 },
  { id: _mock.id(3), name: 'Compliance support', price: 280 },
  { id: _mock.id(4), name: 'Medication management', price: 190 },
];

/** Home care company / individual home care — client care packages. */
export const HOME_CARE_INVOICE_SERVICE_OPTIONS = [
  { id: _mock.id(11), name: 'Home care visits', price: 280 },
  { id: _mock.id(12), name: 'Overnight support', price: 420 },
  { id: _mock.id(13), name: 'Personal care package', price: 310 },
  { id: _mock.id(14), name: 'Companionship visits', price: 180 },
];

const CARE_HOME_NAMES = [
  'Rosewood Care Home',
  'Oakfield Manor',
  'Linden House',
  'Maple Grove Care',
  'Harbour View Lodge',
  'Willowbrook House',
  'Sunnydale Residential',
  'Cedar Court Care',
];

const HOME_CARE_CLIENTS = [
  { name: 'Margaret Ellis', relation: 'Client', email: 'margaret.ellis@email.com' },
  { name: 'David Chen', relation: 'Client', email: 'david.chen@email.com' },
  { name: 'Sarah Ellis', relation: 'Next of kin', email: 'sarah.ellis@email.com' },
  { name: 'Susan Walsh', relation: 'Client', email: 'susan.walsh@email.com' },
  { name: 'James Walsh', relation: 'Next of kin', email: 'james.walsh@email.com' },
  { name: 'Peter Grant', relation: 'Client', email: 'peter.grant@email.com' },
  { name: 'Priya Grant', relation: 'Next of kin', email: 'priya.grant@email.com' },
  { name: 'Helen Morris', relation: 'Client', email: 'helen.morris@email.com' },
];

const HOSPITAL_WARDS = [
  'Ward B — Acute Care',
  'A&E Cover Desk',
  'Paediatric Unit',
  'Discharge Lounge',
  'Theatre Recovery',
  'Stroke Unit',
  'ICU Bank Desk',
  'Outpatients Clinic',
];

function buildItems(serviceOptions, titles, descriptions) {
  return [...Array(3)].map((__, index) => {
    const selectedService = serviceOptions[index % serviceOptions.length];
    const quantity = [5, 2, 1][index] ?? 1;
    const total = selectedService.price * quantity;

    return {
      id: _mock.id(index + 40),
      total,
      title: titles[index] ?? selectedService.name,
      description: descriptions[index] ?? 'Care support',
      price: selectedService.price,
      service: selectedService.name,
      quantity,
    };
  });
}

const AGENCY_ITEMS = buildItems(
  INVOICE_SERVICE_OPTIONS,
  ['Night shift staffing', 'Weekend agency cover', 'CQC compliance review'],
  [
    'Resident support cover for the week',
    'Temporary nurse cover for weekend demand',
    'Documentation and audit preparation',
  ]
);

const HOME_CARE_ITEMS = buildItems(
  HOME_CARE_INVOICE_SERVICE_OPTIONS,
  ['Weekday home visits', 'Overnight carer cover', 'Personal care package'],
  [
    'Scheduled visits at the client\'s home',
    'Overnight support for the household',
    'Washing, dressing and meal support',
  ]
);

function buildInvoiceSet({
  count = 12,
  names,
  invoicePrefix,
  invoiceFrom,
  invoiceToCompany,
  items,
  getInvoiceTo,
}) {
  return [...Array(count)].map((_, index) => {
    const taxes = _mock.number.price(index + 2);
    const discount = _mock.number.price(index + 1);
    const shipping = _mock.number.price(index + 3);
    const subtotal = items.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0);
    const totalAmount = subtotal - shipping - discount + taxes;
    const status =
      (index % 2 === 0 && 'paid') ||
      (index % 3 === 0 && 'pending') ||
      (index % 5 === 0 && 'overdue') ||
      'draft';

    const party = typeof getInvoiceTo === 'function' ? getInvoiceTo(index) : null;
    const displayName = party?.name || names[index % names.length];

    return {
      id: `${invoicePrefix.toLowerCase()}-${_mock.id(index)}`,
      taxes,
      status,
      discount,
      shipping,
      subtotal,
      totalAmount,
      items: items.map((item, itemIndex) => ({
        ...item,
        id: `${item.id}-${invoicePrefix}-${index}-${itemIndex}`,
      })),
      invoiceNumber: `${invoicePrefix}-${String(index + 1).padStart(2, '0')}`,
      invoiceFrom,
      invoiceTo: {
        name: displayName,
        company: party?.company || invoiceToCompany,
        email: party?.email || 'accounts@example.co.uk',
        phone: party?.phone || '+44 20 7946 0958',
        address: party?.address || '12 Willow Lane, Leeds LS2 9PR',
      },
      sent: [2, 3, 1, 4][index % 4],
      createDate: fSub({ days: index + 1 }),
      dueDate: fAdd({ days: index + 16, hours: index }),
    };
  });
}

const TEMPY_FROM = {
  name: 'Tempy Care Operations',
  company: 'Tempy',
  email: 'billing@tempy.co.uk',
  phone: '+44 20 7946 0958',
  address: '24 Temple Street, Manchester M1 1AA',
};

/** Default / agency-facing list (billed to care homes). */
export const _invoices = buildInvoiceSet({
  names: CARE_HOME_NAMES,
  invoicePrefix: 'INV-CH',
  invoiceFrom: TEMPY_FROM,
  invoiceToCompany: 'Care Home',
  items: AGENCY_ITEMS,
});

/** Home care company & individual home care — billed to clients / next of kin. */
export const _homeCareInvoices = buildInvoiceSet({
  names: HOME_CARE_CLIENTS.map((c) => c.name),
  invoicePrefix: 'INV-HC',
  invoiceFrom: {
    name: 'Oakwood Home Care',
    company: 'Home Care Provider',
    email: 'billing@oakwoodcare.co.uk',
    phone: '+44 161 555 0142',
    address: '18 King Street, Manchester M2 4WQ',
  },
  invoiceToCompany: 'Private client',
  items: HOME_CARE_ITEMS,
  getInvoiceTo: (index) => {
    const client = HOME_CARE_CLIENTS[index % HOME_CARE_CLIENTS.length];
    return {
      name: client.name,
      company: client.relation,
      email: client.email,
      phone: '+44 7700 900123',
      address: 'Client home address on file',
    };
  },
});

export const _hospitalInvoices = buildInvoiceSet({
  names: HOSPITAL_WARDS,
  invoicePrefix: 'INV-HS',
  invoiceFrom: TEMPY_FROM,
  invoiceToCompany: 'NHS Trust',
  items: AGENCY_ITEMS,
});

export const _localAuthorityInvoices = buildInvoiceSet({
  names: [
    'Adult Social Care — North',
    'Brokerage Team',
    'Reablement Service',
    'Learning Disability Team',
    'Mental Health Commissioning',
    'Direct Payments Desk',
    'Safeguarding Unit',
    'Homecare Contracts',
  ],
  invoicePrefix: 'INV-LA',
  invoiceFrom: TEMPY_FROM,
  invoiceToCompany: 'Local Authority',
  items: HOME_CARE_ITEMS,
});

export function getInvoiceSeedForRole(roleKey = 'default') {
  switch (roleKey) {
    case 'homeCareCompany':
    case 'individualHomeCare':
      return _homeCareInvoices;
    case 'hospital':
      return _hospitalInvoices;
    case 'localAuthority':
      return _localAuthorityInvoices;
    case 'agency':
    case 'staffMember':
    case 'careHome':
    default:
      return _invoices;
  }
}

export function getInvoiceServiceOptionsForRole(roleKey = 'default') {
  if (roleKey === 'homeCareCompany' || roleKey === 'individualHomeCare' || roleKey === 'localAuthority') {
    return HOME_CARE_INVOICE_SERVICE_OPTIONS;
  }
  return INVOICE_SERVICE_OPTIONS;
}

export function getInvoiceOverviewCopy(roleKey = 'default') {
  if (roleKey === 'homeCareCompany' || roleKey === 'individualHomeCare') {
    return {
      title: 'Billing overview',
      subtitle:
        'Invoices for private clients and next of kin — home visits, overnight support, and care packages.',
    };
  }
  if (roleKey === 'localAuthority') {
    return {
      title: 'Billing overview',
      subtitle: 'Follow care package and placement invoices linked to your authority.',
    };
  }
  if (roleKey === 'hospital') {
    return {
      title: 'Billing overview',
      subtitle: 'Track ward cover, bank staffing, and temporary clinical support invoices.',
    };
  }
  return {
    title: 'Billing overview',
    subtitle: 'Follow staffing, agency support, and compliance invoices in one place.',
  };
}

export function getInvoiceNumberPrefix(roleKey = 'default') {
  switch (roleKey) {
    case 'homeCareCompany':
    case 'individualHomeCare':
      return 'INV-HC';
    case 'hospital':
      return 'INV-HS';
    case 'localAuthority':
      return 'INV-LA';
    default:
      return 'INV-CH';
  }
}
