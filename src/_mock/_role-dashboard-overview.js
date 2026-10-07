
export const HOSPITAL_DASHBOARD_STATS = [
  { title: 'Shifts this week', total: 48, percent: 4.2 },
  { title: 'Active staff', total: 24, percent: 1.8 },
  { title: 'Unread messages', total: 5, percent: -12 },
  { title: 'Pending invoices', total: 6, percent: 0 },
];

export const HOSPITAL_DASHBOARD_MODULES = [
  {
    title: 'Shifts',
    description: 'Manage rotas and schedules',
    value: '48',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
  },
  {
    title: 'Staff',
    description: 'View and manage your team',
    value: '24',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
  },
  {
    title: 'Messages',
    description: 'Chat with staff and agencies',
    value: '5 new',
    icon: 'solar:chat-round-dots-bold-duotone',
    color: 'success',
  },
  {
    title: 'Payments',
    description: 'Track payroll and payouts',
    value: '£12.4k',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'warning',
  },
  {
    title: 'Add Job',
    description: 'Publish open shift requirements',
    value: '3 open',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
  },
  {
    title: 'Job Bids',
    description: 'Review agency bids on jobs',
    value: '7 bids',
    icon: 'solar:document-text-bold-duotone',
    color: 'error',
  },
  {
    title: 'Compliance',
    description: 'Documents and certifications',
    value: '2 due',
    icon: 'solar:shield-check-bold-duotone',
    color: 'primary',
  },
  {
    title: 'Invoices',
    description: 'Billing and invoice history',
    value: '6 pending',
    icon: 'solar:bill-list-bold-duotone',
    color: 'info',
  },
];

export const HOSPITAL_RECENT_ACTIVITY = [
  { id: 1, label: 'Rota published for next fortnight', time: '2h ago', icon: 'solar:calendar-bold' },
  { id: 2, label: 'New bid received on Senior Care job', time: '4h ago', icon: 'solar:document-text-bold' },
  { id: 3, label: 'Sarah Mitchell added to staff', time: '1d ago', icon: 'solar:user-plus-bold' },
  { id: 4, label: 'Invoice #INV-2041 sent', time: '2d ago', icon: 'solar:bill-list-bold' },
];

export const LOCAL_AUTHORITY_DASHBOARD_STATS = HOSPITAL_DASHBOARD_STATS;
export const LOCAL_AUTHORITY_DASHBOARD_MODULES = HOSPITAL_DASHBOARD_MODULES;
export const LOCAL_AUTHORITY_RECENT_ACTIVITY = HOSPITAL_RECENT_ACTIVITY;

export const INDIVIDUAL_HOME_CARE_DASHBOARD_STATS = HOSPITAL_DASHBOARD_STATS;
export const INDIVIDUAL_HOME_CARE_DASHBOARD_MODULES = [
  ...HOSPITAL_DASHBOARD_MODULES.filter((module) => module.title !== 'Staff'),
];
export const INDIVIDUAL_HOME_CARE_RECENT_ACTIVITY = HOSPITAL_RECENT_ACTIVITY;

export const HOME_CARE_COMPANY_DASHBOARD_STATS = [
  { title: 'Active shifts', total: 32, percent: 6.1 },
  { title: 'Staff on roster', total: 18, percent: 2.4 },
  { title: 'New jobs', total: 5, percent: 15 },
  { title: 'Earnings this month', total: 24500, percent: 8.3, isCurrency: true },
];

export const HOME_CARE_COMPANY_DASHBOARD_MODULES = [
  {
    title: 'Shifts',
    description: 'Assigned shifts and rotas',
    value: '32',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
  },
  {
    title: 'Staff',
    description: 'Manage your carers and nurses',
    value: '18',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
  },
  {
    title: 'Messages',
    description: 'Care home conversations',
    value: '3 new',
    icon: 'solar:chat-round-dots-bold-duotone',
    color: 'success',
  },
  {
    title: 'Payments',
    description: 'Invoices and payouts',
    value: '£8.2k',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'warning',
  },
  {
    title: 'Jobs',
    description: 'Browse and bid on new jobs',
    value: '5 new',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
  },
  {
    title: 'Bids',
    description: 'Track submitted bids and outcomes',
    value: '8 active',
    icon: 'solar:document-text-bold-duotone',
    color: 'info',
  },
  {
    title: 'Earnings',
    description: 'Monthly revenue and reports',
    value: '£24.5k',
    icon: 'solar:chart-2-bold-duotone',
    color: 'primary',
  },
];

export const HOME_CARE_COMPANY_RECENT_ACTIVITY = [
  { id: 1, label: 'Bid accepted on Senior Care shift', time: '1h ago', icon: 'solar:check-circle-bold' },
  { id: 2, label: 'New job posted in Springfield', time: '3h ago', icon: 'solar:case-round-bold' },
  { id: 3, label: 'David Beattie shift confirmed', time: '6h ago', icon: 'solar:calendar-bold' },
  { id: 4, label: 'Payment received — £1,240', time: '1d ago', icon: 'solar:wallet-money-bold' },
];

export const STAFF_MEMBER_DASHBOARD_STATS = HOME_CARE_COMPANY_DASHBOARD_STATS;

export const STAFF_MEMBER_DASHBOARD_MODULES = [
  {
    title: 'Shifts',
    description: 'Your assigned shifts',
    value: '32',
    icon: 'solar:calendar-bold-duotone',
    color: 'primary',
  },
  {
    title: 'Messages',
    description: 'Chat with care homes',
    value: '3 new',
    icon: 'solar:chat-round-dots-bold-duotone',
    color: 'success',
  },
  {
    title: 'Payments',
    description: 'Invoices and payouts',
    value: '£8.2k',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'warning',
  },
  {
    title: 'Jobs',
    description: 'Browse and apply for jobs',
    value: '5 new',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
  },
  {
    title: 'Bids',
    description: 'Track your job applications',
    value: '8 active',
    icon: 'solar:document-text-bold-duotone',
    color: 'info',
  },
  {
    title: 'Earnings',
    description: 'Monthly revenue and reports',
    value: '£24.5k',
    icon: 'solar:chart-2-bold-duotone',
    color: 'primary',
  },
];

export const STAFF_MEMBER_RECENT_ACTIVITY = HOME_CARE_COMPANY_RECENT_ACTIVITY;

export {
  CUSTOMER_DASHBOARD_ANALYTICS,
  SUPPLIER_DASHBOARD_ANALYTICS,
} from './_dashboard-overview';

