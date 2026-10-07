export const DASHBOARD_OVERVIEW_CHART = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { name: 'Shifts', data: [42, 38, 55, 48, 62, 58, 70, 65, 72, 68, 80, 76] },
    { name: 'Staff hours', data: [120, 110, 145, 130, 160, 150, 175, 168, 180, 172, 190, 185] },
  ],
};

export const CARE_HOME_DASHBOARD_STATS = [
  { title: 'Shifts this week', total: 48, percent: 4.2 },
  { title: 'Active staff', total: 24, percent: 1.8 },
  { title: 'Unread messages', total: 5, percent: -12 },
  { title: 'Pending invoices', total: 6, percent: 0 },
];

export const CARE_HOME_DASHBOARD_MODULES = [
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

export const CARE_HOME_RECENT_ACTIVITY = [
  { id: 1, label: 'Rota published for next fortnight', time: '2h ago', icon: 'solar:calendar-bold' },
  { id: 2, label: 'New bid received on Senior Care job', time: '4h ago', icon: 'solar:document-text-bold' },
  { id: 3, label: 'Sarah Mitchell added to staff', time: '1d ago', icon: 'solar:user-plus-bold' },
  { id: 4, label: 'Invoice #INV-2041 sent', time: '2d ago', icon: 'solar:bill-list-bold' },
];

// Agency dashboard overview mock data

export const AGENCY_DASHBOARD_STATS = [
  { title: 'Active shifts', total: 32, percent: 6.1 },
  { title: 'Staff on roster', total: 18, percent: 2.4 },
  { title: 'New jobs', total: 5, percent: 15 },
  { title: 'Earnings this month', total: 24500, percent: 8.3, isCurrency: true },
];

export const AGENCY_DASHBOARD_MODULES = [
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

export const AGENCY_RECENT_ACTIVITY = [
  { id: 1, label: 'Bid accepted on Senior Care shift', time: '1h ago', icon: 'solar:check-circle-bold' },
  { id: 2, label: 'New job posted in Springfield', time: '3h ago', icon: 'solar:case-round-bold' },
  { id: 3, label: 'David Beattie shift confirmed', time: '6h ago', icon: 'solar:calendar-bold' },
  { id: 4, label: 'Payment received — £1,240', time: '1d ago', icon: 'solar:wallet-money-bold' },
];

// ----------------------------------------------------------------------
// Shared analytics for customer dashboards (Care Home style)
// ----------------------------------------------------------------------

export const CUSTOMER_DASHBOARD_ANALYTICS = {
  widgets: [
    {
      title: 'Open jobs',
      total: 14,
      percent: 8.2,
      color: 'primary',
      series: [8, 10, 9, 12, 11, 13, 14, 16],
    },
    {
      title: 'Filled shifts',
      total: 96,
      percent: 5.4,
      color: 'secondary',
      series: [40, 48, 52, 55, 60, 68, 74, 80],
    },
    {
      title: 'Pending bids',
      total: 23,
      percent: 12.1,
      color: 'warning',
      series: [10, 14, 12, 18, 16, 20, 19, 23],
    },
    {
      title: 'Spend this month',
      total: 18400,
      percent: 3.6,
      color: 'error',
      series: [8, 10, 12, 11, 14, 15, 16, 18],
    },
  ],
  pie: {
    title: 'Jobs by status',
    series: [
      { label: 'Open', value: 14 },
      { label: 'Filled', value: 28 },
      { label: 'Closed', value: 11 },
      { label: 'Draft', value: 5 },
    ],
  },
  bar: {
    title: 'Jobs & bids activity',
    subheader: 'Last 12 months',
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        { name: 'Jobs posted', data: [12, 15, 14, 18, 20, 22, 19, 24, 21, 26, 23, 28] },
        { name: 'Bids received', data: [28, 32, 30, 38, 42, 45, 40, 48, 44, 52, 49, 56] },
      ],
    },
  },
  donut: {
    title: 'Staff mix',
    subheader: 'By role type',
    series: [
      { label: 'Carers', value: 42 },
      { label: 'Nurses', value: 18 },
      { label: 'Senior care', value: 24 },
      { label: 'Other', value: 8 },
    ],
  },
  conversion: {
    title: 'Fill rate by day',
    subheader: 'Shift coverage this fortnight',
    chart: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        { name: 'Covered %', data: [92, 88, 95, 90, 86, 78, 74] },
        { name: 'Agency cover %', data: [40, 35, 42, 38, 45, 52, 48] },
      ],
    },
  },
  radar: {
    title: 'Operations health',
    chart: {
      categories: ['Jobs', 'Bids', 'Staff', 'Compliance', 'Invoices', 'Shifts'],
      series: [
        { name: 'This month', data: [82, 76, 90, 70, 84, 88] },
        { name: 'Last month', data: [74, 68, 85, 65, 78, 80] },
      ],
    },
  },
};

// ----------------------------------------------------------------------
// Shared analytics for supplier dashboards (Agency style)
// ----------------------------------------------------------------------

export const SUPPLIER_DASHBOARD_ANALYTICS = {
  widgets: [
    {
      title: 'Month earnings',
      total: 24500,
      percent: 8.3,
      color: 'primary',
      series: [12, 16, 18, 20, 22, 24, 26, 28],
    },
    {
      title: 'Active shifts',
      total: 32,
      percent: 6.1,
      color: 'secondary',
      series: [14, 16, 18, 20, 22, 24, 28, 32],
    },
    {
      title: 'Bids won',
      total: 18,
      percent: 11.4,
      color: 'warning',
      series: [4, 6, 8, 7, 10, 12, 14, 16],
    },
    {
      title: 'Open jobs nearby',
      total: 27,
      percent: 4.8,
      color: 'error',
      series: [10, 12, 14, 16, 18, 20, 22, 24],
    },
  ],
  pie: {
    title: 'Bid outcomes',
    series: [
      { label: 'Won', value: 18 },
      { label: 'Pending', value: 12 },
      { label: 'Lost', value: 9 },
      { label: 'Withdrawn', value: 4 },
    ],
  },
  bar: {
    title: 'Shifts & earnings',
    subheader: 'Last 12 months',
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        { name: 'Shifts filled', data: [18, 22, 20, 26, 28, 30, 27, 32, 29, 34, 31, 36] },
        { name: 'Earnings (£k)', data: [12, 14, 13, 16, 18, 19, 17, 21, 20, 23, 22, 25] },
      ],
    },
  },
  donut: {
    title: 'Shift status',
    subheader: 'Current roster',
    series: [
      { label: 'Upcoming', value: 14 },
      { label: 'Completed', value: 48 },
      { label: 'Needs fill', value: 8 },
      { label: 'Replacement', value: 3 },
    ],
  },
  conversion: {
    title: 'Win rate by region',
    subheader: 'Bid success vs coverage',
    chart: {
      categories: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol'],
      series: [
        { name: 'Win rate %', data: [62, 54, 58, 49, 51] },
        { name: 'Fill rate %', data: [88, 82, 85, 76, 80] },
      ],
    },
  },
  radar: {
    title: 'Agency performance',
    chart: {
      categories: ['Bids', 'Shifts', 'Staff', 'Earnings', 'Response', 'Rating'],
      series: [
        { name: 'This month', data: [78, 85, 80, 88, 72, 90] },
        { name: 'Last month', data: [70, 78, 76, 82, 68, 86] },
      ],
    },
  },
};

// Admin platform overview

export const ADMIN_DASHBOARD_STATS = [
  { title: 'Total agencies', total: 48, percent: 5.2 },
  { title: 'Care homes', total: 126, percent: 3.1 },
  { title: 'Active jobs', total: 214, percent: 8.4 },
  { title: 'Platform revenue', total: 89200, percent: 12.5, isCurrency: true },
];

export const ADMIN_DASHBOARD_MODULES = [
  {
    title: 'Agency/Supplier',
    description: 'View and manage supplier agencies',
    value: '48',
    icon: 'solar:buildings-2-bold-duotone',
    color: 'primary',
  },
  {
    title: 'Care Home',
    description: 'Customer care home accounts',
    value: '126',
    icon: 'solar:home-smile-bold-duotone',
    color: 'info',
  },
  {
    title: 'Jobs',
    description: 'All open and active jobs',
    value: '214',
    icon: 'solar:case-round-bold-duotone',
    color: 'secondary',
  },
  {
    title: 'Bids',
    description: 'Platform-wide bid activity',
    value: '89',
    icon: 'solar:document-text-bold-duotone',
    color: 'warning',
  },
  {
    title: 'Staff',
    description: 'Registered carers and nurses',
    value: '1.2k',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'success',
  },
  {
    title: 'Payments',
    description: 'Payouts and reconciliation',
    value: '£89k',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'error',
  },
];

export const ADMIN_RECENT_ACTIVITY = [
  { id: 1, label: 'CarePlus Agency registered', time: '2h ago', icon: 'solar:buildings-2-bold' },
  { id: 2, label: 'New care home onboarding — Oakwood', time: '5h ago', icon: 'solar:home-smile-bold' },
  { id: 3, label: '12 new jobs posted today', time: '8h ago', icon: 'solar:case-round-bold' },
  { id: 4, label: 'Support ticket resolved #4821', time: '1d ago', icon: 'solar:chat-round-dots-bold' },
  { id: 5, label: '£12.4k payout batch completed', time: '1d ago', icon: 'solar:wallet-money-bold' },
  { id: 6, label: 'Staff member verified — Sarah Mitchell', time: '2d ago', icon: 'solar:user-check-bold' },
];

export const ADMIN_USERS_BY_TYPE = {
  series: [
    { label: 'Care Home', value: 126 },
    { label: 'Agency/Supplier', value: 48 },
    { label: 'Hospitals/NHS', value: 34 },
    { label: 'Local Authority', value: 22 },
    { label: 'Home Care Company', value: 31 },
    { label: 'Individual (Home Care)', value: 18 },
  ],
};

export const ADMIN_JOB_STATUS_DONUT = {
  series: [
    { label: 'Open', value: 86 },
    { label: 'Filled', value: 92 },
    { label: 'Closed', value: 36 },
  ],
};

export const ADMIN_REVENUE_BY_SEGMENT = {
  series: [
    { label: 'Agency fees', value: 38200 },
    { label: 'Care home jobs', value: 28400 },
    { label: 'Hospital contracts', value: 14600 },
    { label: 'Staff placements', value: 8000 },
  ],
};

export const ADMIN_MONTHLY_ACTIVITY = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { name: 'Jobs posted', data: [42, 55, 48, 61, 72, 68, 80, 74, 88, 95, 90, 102] },
    { name: 'Bids placed', data: [68, 82, 75, 94, 110, 105, 128, 118, 140, 152, 145, 168] },
    { name: 'Shifts filled', data: [30, 38, 35, 48, 55, 52, 64, 58, 70, 78, 72, 85] },
  ],
};

export const ADMIN_FILL_RATES_BY_REGION = {
  categories: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Scotland'],
  series: [
    { name: 'Fill rate %', data: [88, 76, 82, 71, 79, 68] },
    { name: 'On-time %', data: [92, 84, 87, 80, 85, 77] },
  ],
};

export const ADMIN_PLATFORM_HEALTH = {
  categories: ['Jobs', 'Bids', 'Staff', 'Compliance', 'Payments', 'Support'],
  series: [
    { name: 'This month', data: [86, 78, 92, 74, 88, 81] },
    { name: 'Last month', data: [72, 70, 85, 68, 80, 75] },
  ],
};

export const ADMIN_EVENT_TIMELINE = [
  {
    id: '1',
    title: 'Platform revenue crossed £89k this month',
    time: Date.now() - 1000 * 60 * 60 * 2,
    type: 'order1',
  },
  {
    id: '2',
    title: '48 new supplier accounts verified',
    time: Date.now() - 1000 * 60 * 60 * 6,
    type: 'order2',
  },
  {
    id: '3',
    title: 'Peak job posting day — 32 jobs live',
    time: Date.now() - 1000 * 60 * 60 * 14,
    type: 'order3',
  },
  {
    id: '4',
    title: 'Compliance alerts cleared for 12 care homes',
    time: Date.now() - 1000 * 60 * 60 * 28,
    type: 'order4',
  },
  {
    id: '5',
    title: 'Weekly payout batch sent to agencies',
    time: Date.now() - 1000 * 60 * 60 * 40,
    type: 'order1',
  },
];

export const ADMIN_TOP_PERFORMERS = [
  { id: 1, name: 'CarePlus Agency', metric: '£18.4k', subtitle: 'Revenue', rank: 1 },
  { id: 2, name: 'Savills Care Home', metric: '42 jobs', subtitle: 'Posted', rank: 2 },
  { id: 3, name: 'Riverside NHS Trust', metric: '11 contracts', subtitle: 'Active', rank: 3 },
  { id: 4, name: 'Sarah Mitchell', metric: '4.9 ★', subtitle: 'Staff rating', rank: 4 },
  { id: 5, name: 'HomeFirst Services', metric: '96%', subtitle: 'Fill rate', rank: 5 },
];

