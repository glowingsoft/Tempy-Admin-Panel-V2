import { store } from 'src/store/store';

import { adminAllegationsApi } from 'src/store/Reducer/admin-allegations-api';
import { adminDashboardApi } from 'src/store/Reducer/admin-dashboard-api';
import { adminJobRolesApi } from 'src/store/Reducer/admin-job-roles-api';
import { adminTransactionsApi } from 'src/store/Reducer/admin-transactions-api';
import { adminUsersApi } from 'src/store/Reducer/admin-users-api';
import { agencyAvailabilityApi } from 'src/store/Reducer/agency-availability-api';
import { agencyBidsApi } from 'src/store/Reducer/agency-bids-api';
import { agencyBranchesApi } from 'src/store/Reducer/agency-branches-api';
import { agencyDashboardApi } from 'src/store/Reducer/agency-dashboard-api';
import { agencyJobsApi } from 'src/store/Reducer/agency-jobs-api';
import { agencyStaffApi } from 'src/store/Reducer/agency-staff-api';
import { authApi } from 'src/store/Reducer/auth';
import { bookingPaymentsApi } from 'src/store/Reducer/booking-payments-api';
import { careHomeBranchesApi } from 'src/store/Reducer/care-home-branches-api';
import { careHomeDashboardApi } from 'src/store/Reducer/care-home-dashboard-api';
import { careHomeJobsApi } from 'src/store/Reducer/care-home-jobs-api';
import { careTutorApi } from 'src/store/Reducer/care-tutor-api';
import { categoriesApi } from 'src/store/Reducer/categories-api';
import { conversationsApi } from 'src/store/Reducer/conversations-api';
import { dashboardSettingsApi } from 'src/store/Reducer/dashboard-settings-api';
import { earningsApi } from 'src/store/Reducer/earnings-api';
import { faqsApi } from 'src/store/Reducer/faqs-api';
import { favoritesApi } from 'src/store/Reducer/favorites-api';
import { gocardlessApi } from 'src/store/Reducer/gocardless-api';
import { homeCareCompanyAvailabilityApi } from 'src/store/Reducer/home-care-company-availability-api';
import { homeCareCompanyBidsApi } from 'src/store/Reducer/home-care-company-bids-api';
import { homeCareCompanyBranchesApi } from 'src/store/Reducer/home-care-company-branches-api';
import { homeCareCompanyDashboardApi } from 'src/store/Reducer/home-care-company-dashboard-api';
import { homeCareCompanyJobsApi } from 'src/store/Reducer/home-care-company-jobs-api';
import { homeCareCompanyStaffApi } from 'src/store/Reducer/home-care-company-staff-api';
import { hospitalBranchesApi } from 'src/store/Reducer/hospital-branches-api';
import { hospitalDashboardApi } from 'src/store/Reducer/hospital-dashboard-api';
import { hospitalJobsApi } from 'src/store/Reducer/hospital-jobs-api';
import { jobAttendanceApi } from 'src/store/Reducer/job-attendance-api';
import { localAuthorityBranchesApi } from 'src/store/Reducer/local-authority-branches-api';
import { localAuthorityDashboardApi } from 'src/store/Reducer/local-authority-dashboard-api';
import { localAuthorityJobsApi } from 'src/store/Reducer/local-authority-jobs-api';
import { notificationsApi } from 'src/store/Reducer/notifications-api';
import { nurseAvailabilityApi } from 'src/store/Reducer/nurse-availability-api';
import { nurseBidsApi } from 'src/store/Reducer/nurse-bids-api';
import { nurseBookingsApi } from 'src/store/Reducer/nurse-bookings-api';
import { nurseBranchesApi } from 'src/store/Reducer/nurse-branches-api';
import { nurseDashboardApi } from 'src/store/Reducer/nurse-dashboard-api';
import { nurseJobsApi } from 'src/store/Reducer/nurse-jobs-api';
import { nurseStaffRequestsApi } from 'src/store/Reducer/nurse-staff-requests-api';
import { reviewsApi } from 'src/store/Reducer/reviews-api';
import { sidebarCountsApi } from 'src/store/Reducer/sidebar-counts-api';
import { staffApi } from 'src/store/Reducer/staff-api';
import { supplierJobRolesApi } from 'src/store/Reducer/supplier-job-roles-api';
import { supplierRelationshipsApi } from 'src/store/Reducer/supplier-relationships-api';
import { supportApi } from 'src/store/Reducer/support-api';
import { userBranchesApi } from 'src/store/Reducer/user-branches-api';
import { userDashboardApi } from 'src/store/Reducer/user-dashboard-api';
import { userJobsApi } from 'src/store/Reducer/user-jobs-api';
import { usersApi } from 'src/store/Reducer/users-api';
import { walletsApi } from 'src/store/Reducer/wallets-api';

const DEBOUNCE_MS = 300;

const pendingModels = new Set();
let debounceTimer = null;

/** UI subscribers (local state that RTK invalidate alone cannot refresh). */
const modelListeners = new Set();

/** Backend may emit PascalCase, snake_case, plural, or role-prefixed model names. */
const MODEL_ALIASES = {
  jobs: 'job',
  jobpost: 'job',
  jobposts: 'job',
  shiftjob: 'job',
  agencyjob: 'job',
  agencyjobs: 'job',
  homecarecompanyjob: 'job',
  homecarecompanyjobs: 'job',
  nursejob: 'job',
  nursejobs: 'job',
  carehomejob: 'job',
  carehomejobs: 'job',
  hospitaljob: 'job',
  hospitaljobs: 'job',
  localauthorityjob: 'job',
  localauthorityjobs: 'job',
  userjob: 'job',
  userjobs: 'job',

  bookings: 'booking',
  book: 'booking',
  assignment: 'booking',
  assignments: 'booking',
  attendance: 'booking',
  checkin: 'booking',
  checkout: 'booking',
  agencybooking: 'booking',
  agencybookings: 'booking',
  nursebooking: 'booking',
  nursebookings: 'booking',
  homecarecompanybooking: 'booking',
  carehomebooking: 'booking',
  hospitalbooking: 'booking',
  localauthoritybooking: 'booking',
  userbooking: 'booking',

  bids: 'bid',
  offer: 'bid',
  offers: 'bid',
  agencybid: 'bid',
  agencybids: 'bid',
  nursebid: 'bid',
  nursebids: 'bid',
  homecarecompanybid: 'bid',
  carehomejobbid: 'bid',
  hospitaljobbid: 'bid',
  userjobbid: 'bid',
  localauthorityjobbid: 'bid',

  agencystaff: 'staff',
  homecarecompanystaff: 'staff',
  nursestaff: 'staff',
  staffmember: 'staff',
  staffmembers: 'staff',
  staffs: 'staff',
  staffrequest: 'staff',
  staffrequests: 'staff',
  nursestaffrequest: 'staff',
  nursestaffrequests: 'staff',
  worker: 'staff',
  workers: 'staff',
  nurse: 'staff',
  nurses: 'staff',

  branch: 'branches',
  branches: 'branches',
  agencybranch: 'branches',
  carehomebranch: 'branches',
  hospitalbranch: 'branches',
  localauthoritybranch: 'branches',
  homecarecompanybranch: 'branches',
  nursebranch: 'branches',
  userbranch: 'branches',
  location: 'branches',
  locations: 'branches',

  leave: 'availability',
  leaves: 'availability',
  busy: 'availability',
  shift: 'availability',
  shifts: 'availability',
  rota: 'availability',
  calendar: 'availability',
  agencyavailability: 'availability',
  nurseavailability: 'availability',
  homecarecompanyavailability: 'availability',

  notifications: 'notification',
  users: 'user',
  profile: 'user',
  account: 'user',
  accountstate: 'user',

  agreedrates: 'agreedrate',
  rate: 'agreedrate',
  rates: 'agreedrate',
  permanenthires: 'permanenthire',
  temptoperm: 'permanenthire',
  favorites: 'favorite',
  reviews: 'review',
  rating: 'review',
  ratings: 'review',

  allegations: 'allegation',
  jobroles: 'jobrole',
  jobtype: 'jobrole',
  jobtypes: 'jobrole',
  faqs: 'faq',
  settings: 'adminsettings',
  setting: 'adminsettings',
  legal: 'adminsettings',
  terms: 'adminsettings',
  privacy: 'adminsettings',
  about: 'adminsettings',

  support: 'supportrequest',
  supportrequests: 'supportrequest',
  supportticket: 'supportrequest',
  supporttickets: 'supportrequest',
  ticket: 'supportrequest',
  tickets: 'supportrequest',
  contact: 'contactus',
  contacts: 'contactus',

  chat: 'conversation',
  chats: 'conversation',
  conversations: 'conversation',
  message: 'conversation',
  messages: 'conversation',

  training: 'caretutor',
  trainings: 'caretutor',
  caretutortraining: 'caretutor',
  caretutors: 'caretutor',

  categories: 'category',
  wallet: 'usersstripeaccounts',
  wallets: 'usersstripeaccounts',
  stripe: 'usersstripeaccounts',
  stripeaccount: 'usersstripeaccounts',
  payment: 'usersstripeaccounts',
  payments: 'usersstripeaccounts',
  transaction: 'usersstripeaccounts',
  transactions: 'usersstripeaccounts',
  // Payouts must not refetch GET /gocardless/mandate (was spamming Network).
  payout: 'adminpayout',
  payouts: 'adminpayout',
  mandate: 'gocardlessmandate',
  mandates: 'gocardlessmandate',
  gocardless: 'gocardlessmandate',
  gocardlessmandate: 'gocardlessmandate',

  earning: 'earnings',
  earnings: 'earnings',
  finance: 'earnings',

  contract: 'supplierrelationship',
  contracts: 'supplierrelationship',
  supplierrelationships: 'supplierrelationship',

  language: 'adminsettings',
  languages: 'adminsettings',
};

/** Strip role prefixes so "AgencyJob" / "NurseBooking" still map. */
const ROLE_PREFIX =
  /^(agency|homecarecompany|nurse|carehome|hospital|localauthority|user|admin)+/;

function touch(api, tags) {
  store.dispatch(api.util.invalidateTags(tags));
}

function touchDashboards() {
  touch(adminDashboardApi, ['AdminDashboard']);
  touch(agencyDashboardApi, ['AgencyDashboard']);
  touch(nurseDashboardApi, ['NurseDashboard']);
  touch(homeCareCompanyDashboardApi, ['HomeCareCompanyDashboard']);
  touch(careHomeDashboardApi, ['CareHomeDashboard']);
  touch(hospitalDashboardApi, ['HospitalDashboard']);
  touch(localAuthorityDashboardApi, ['LocalAuthorityDashboard']);
  touch(userDashboardApi, ['UserDashboard']);
}

function touchSidebar() {
  touch(sidebarCountsApi, ['SidebarCounts']);
}

function touchJobs() {
  touch(agencyJobsApi, ['AgencyJob']);
  touch(homeCareCompanyJobsApi, ['HomeCareCompanyJob']);
  touch(nurseJobsApi, ['NurseJob']);
  touch(careHomeJobsApi, ['CareHomeJob', 'CareHomeJobType']);
  touch(hospitalJobsApi, ['HospitalJob', 'HospitalJobType']);
  touch(userJobsApi, ['UserJob', 'UserJobType']);
  touch(localAuthorityJobsApi, ['LocalAuthorityJob', 'LocalAuthorityJobType']);
  touchSidebar();
  touchDashboards();
}

function touchBookings() {
  touch(nurseBookingsApi, ['NurseBooking', 'NurseBookingLog']);
  touch(jobAttendanceApi, ['JobAttendance']);
  touch(agencyAvailabilityApi, ['AgencyBookingCalendar']);
  touch(nurseAvailabilityApi, ['NurseBookingCalendar']);
  touch(homeCareCompanyAvailabilityApi, ['HomeCareCompanyBookingCalendar']);
  touch(careHomeJobsApi, ['CareHomeBookingCalendar']);
  touch(hospitalJobsApi, ['HospitalBookingCalendar']);
  touch(userJobsApi, ['UserBookingCalendar']);
  touch(localAuthorityJobsApi, ['LocalAuthorityBookingCalendar']);
  touch(bookingPaymentsApi, ['BookingPayments']);
  touch(earningsApi, ['Earnings']);
  touchSidebar();
  touchDashboards();
}

function touchBids() {
  touch(agencyBidsApi, ['AgencyBid']);
  touch(nurseBidsApi, ['NurseBid']);
  touch(homeCareCompanyBidsApi, ['HomeCareCompanyBid']);
  touch(careHomeJobsApi, ['CareHomeJobBid']);
  touch(hospitalJobsApi, ['HospitalJobBid']);
  touch(userJobsApi, ['UserJobBid']);
  touch(localAuthorityJobsApi, ['LocalAuthorityJobBid']);
  touchSidebar();
  touchDashboards();
}

function touchUsers() {
  touch(usersApi, ['UserProfile']);
  touch(adminUsersApi, ['AdminUser']);
  touch(authApi, ['profile']);
}

function touchStaff() {
  touch(staffApi, ['DashboardStaff', 'AvailableStaff']);
  touch(agencyStaffApi, ['AgencyStaff', 'AgencyNurse']);
  touch(homeCareCompanyStaffApi, ['HomeCareCompanyStaff', 'HomeCareCompanyNurse']);
  touch(nurseStaffRequestsApi, ['NurseStaffRequest']);
  touchSidebar();
}

function touchAvailability() {
  touch(agencyAvailabilityApi, ['AgencyAvailability', 'AgencyJobType', 'AgencyBookingCalendar']);
  touch(nurseAvailabilityApi, ['NurseAvailability', 'NurseJobType', 'NurseBookingCalendar']);
  touch(homeCareCompanyAvailabilityApi, [
    'HomeCareCompanyAvailability',
    'HomeCareCompanyJobType',
    'HomeCareCompanyBookingCalendar',
  ]);
  touchSidebar();
}

function touchBranches() {
  touch(agencyBranchesApi, ['AgencyBranch']);
  touch(careHomeBranchesApi, ['CareHomeBranch']);
  touch(hospitalBranchesApi, ['HospitalBranch']);
  touch(localAuthorityBranchesApi, ['LocalAuthorityBranch']);
  touch(homeCareCompanyBranchesApi, ['HomeCareCompanyBranch']);
  touch(nurseBranchesApi, ['NurseBranch']);
  touch(userBranchesApi, ['UserBranch']);
}

function touchPayments() {
  touch(walletsApi, ['Wallet']);
  touch(adminTransactionsApi, ['AdminTransaction', 'AdminPlatformFee']);
  touch(bookingPaymentsApi, ['BookingPayments']);
  touch(earningsApi, ['Earnings']);
  // Admin payouts list only — do not invalidate GoCardlessMandate here.
  // Wallet/payment/transaction socket noise was refetching GET /gocardless/mandate in a loop.
  touch(gocardlessApi, ['AdminPayout']);
  touchDashboards();
}

const MODEL_REFETCH = {
  // Buttons / status chips come from jobs + bids (+ booking fields on those lists).
  job: () => {
    touchJobs();
    touchBids();
    touchBookings();
  },
  booking: () => {
    touchBookings();
    touchJobs();
    touchBids();
  },
  bid: () => {
    touchBids();
    touchJobs();
  },
  agreedrate: () => {
    touch(supplierRelationshipsApi, ['AgreedRate']);
    touchJobs();
  },
  availability: () => {
    touchAvailability();
    touchBookings();
  },
  permanenthire: () => {
    touch(supplierRelationshipsApi, ['PermanentHire']);
    touch(dashboardSettingsApi, ['TempToPerm', 'AdminPermanentHire']);
  },
  user: touchUsers,
  staff: () => {
    touchStaff();
    // Assign-staff pickers / rota often show staff status on open job screens.
    touchAvailability();
  },
  branches: touchBranches,
  address: () => touch(userBranchesApi, ['UserBranch']),
  supplierrelationship: () => touch(supplierRelationshipsApi, ['Contract']),
  favorite: () => touch(favoritesApi, ['Favorite']),
  review: () => {
    touch(reviewsApi, ['Review']);
    touchUsers();
  },
  verification: touchUsers,
  allegation: () => touch(adminAllegationsApi, ['AdminAllegation']),
  jobrole: () => {
    touch(adminJobRolesApi, ['AdminJobRole']);
    touch(supplierJobRolesApi, ['SupplierJobRoleChoices', 'SupplierJobRolesMine']);
    touch(agencyAvailabilityApi, ['AgencyJobType']);
    touch(nurseAvailabilityApi, ['NurseJobType']);
    touch(homeCareCompanyAvailabilityApi, ['HomeCareCompanyJobType']);
    touch(careHomeJobsApi, ['CareHomeJobType']);
    touch(hospitalJobsApi, ['HospitalJobType']);
    touch(userJobsApi, ['UserJobType']);
    touch(localAuthorityJobsApi, ['LocalAuthorityJobType']);
  },
  faq: () => touch(faqsApi, ['Faq', 'AdminFaq']),
  adminsettings: () =>
    touch(dashboardSettingsApi, ['SettingsContent', 'AdminLegal', 'TermsStatus']),
  supportrequest: () => {
    touch(supportApi, ['Support', 'AdminSupport']);
    touchSidebar();
  },
  contactus: () => {
    touch(supportApi, ['Support', 'AdminSupport']);
    touchSidebar();
  },
  notificationpreferences: () => {
    touch(notificationsApi, ['Notification']);
    touchUsers();
  },
  notification: () => {
    touch(notificationsApi, ['Notification']);
    touchSidebar();
  },
  usersstripeaccounts: touchPayments,
  adminpayout: () => {
    touch(gocardlessApi, ['AdminPayout']);
    touchDashboards();
  },
  gocardlessmandate: () => {
    // Only real mandate model events should refresh the customer DD status.
    touch(gocardlessApi, ['GoCardlessMandate']);
  },
  usergoogleintegration: touchUsers,
  conversation: () => touch(conversationsApi, ['Conversation', 'ConversationMessage']),
  caretutor: () => touch(careTutorApi, ['CareTutorTraining', 'CareTutorSettings']),
  category: () => touch(categoriesApi, ['category']),
  earnings: () => {
    touch(earningsApi, ['Earnings']);
    touchDashboards();
  },
};

function normalizeModel(model) {
  const key = String(model || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!key) return '';
  if (MODEL_ALIASES[key]) return MODEL_ALIASES[key];
  if (MODEL_REFETCH[key]) return key;

  const stripped = key.replace(ROLE_PREFIX, '');
  if (stripped && stripped !== key) {
    if (MODEL_ALIASES[stripped]) return MODEL_ALIASES[stripped];
    if (MODEL_REFETCH[stripped]) return stripped;
  }
  return key;
}

function pickModelName(entry) {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry !== 'object') return '';
  return (
    entry.model ||
    entry.Model ||
    entry.entity ||
    entry.Entity ||
    entry.entityType ||
    entry.collection ||
    entry.name ||
    entry.type ||
    ''
  );
}

export function readDataChanges(payload) {
  if (payload == null) return [];
  if (typeof payload === 'string') return [{ model: payload }];
  if (Array.isArray(payload)) {
    return payload.map((row) => (typeof row === 'string' ? { model: row } : row)).filter(Boolean);
  }
  if (typeof payload !== 'object') return [];

  if (Array.isArray(payload.changes)) return payload.changes;
  if (Array.isArray(payload.data?.changes)) return payload.data.changes;
  if (Array.isArray(payload.models)) {
    return payload.models.map((model) => ({ model }));
  }
  if (Array.isArray(payload.data) && (payload.data[0]?.model || typeof payload.data[0] === 'string')) {
    return payload.data.map((row) => (typeof row === 'string' ? { model: row } : row));
  }
  if (pickModelName(payload)) return [payload];
  if (payload.data && pickModelName(payload.data)) return [payload.data];
  return [];
}

export function refetchForModel(model) {
  const run = MODEL_REFETCH[normalizeModel(model)];
  if (run) run();
}

function flushPendingModels() {
  const models = [...pendingModels];
  pendingModels.clear();
  models.forEach((key) => {
    const run = MODEL_REFETCH[key];
    if (run) run();
  });
  if (models.length) {
    modelListeners.forEach((listener) => {
      try {
        listener(models);
      } catch {
        // Subscriber errors must not break realtime.
      }
    });
  }
}

export function queueModelRefetch(model) {
  const raw = typeof model === 'string' ? model : pickModelName(model);
  const key = normalizeModel(raw);
  if (!key) return;

  if (!MODEL_REFETCH[key]) {
    // Unknown model — still refresh the lists that drive buttons/status/data on screen.
    [
      'job',
      'booking',
      'bid',
      'notification',
      'user',
      'staff',
      'branches',
      'availability',
    ].forEach((fallback) => pendingModels.add(fallback));
  } else {
    pendingModels.add(key);
  }

  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(flushPendingModels, DEBOUNCE_MS);
}

/** Subscribe to flushed realtime model keys (e.g. clear local attendance caches). */
export function onRealtimeModels(listener) {
  if (typeof listener !== 'function') return () => {};
  modelListeners.add(listener);
  return () => modelListeners.delete(listener);
}

export function refetchMainLists() {
  [
    'Job',
    'Booking',
    'Bid',
    'Notification',
    'User',
    'Staff',
    'Branches',
    'Availability',
    'SupportRequest',
    'Earnings',
    'UsersStripeAccounts',
  ].forEach(queueModelRefetch);
}
