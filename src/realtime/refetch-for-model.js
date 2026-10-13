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

function touchJobs() {
  touch(agencyJobsApi, ['AgencyJob']);
  touch(homeCareCompanyJobsApi, ['HomeCareCompanyJob']);
  touch(nurseJobsApi, ['NurseJob']);
  touch(careHomeJobsApi, ['CareHomeJob', 'CareHomeJobType']);
  touch(hospitalJobsApi, ['HospitalJob', 'HospitalJobType']);
  touch(userJobsApi, ['UserJob', 'UserJobType']);
  touch(localAuthorityJobsApi, ['LocalAuthorityJob', 'LocalAuthorityJobType']);
  touch(sidebarCountsApi, ['SidebarCounts']);
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
  touch(sidebarCountsApi, ['SidebarCounts']);
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
  touch(sidebarCountsApi, ['SidebarCounts']);
  touchDashboards();
}

function touchUsers() {
  touch(usersApi, ['UserProfile']);
  touch(adminUsersApi, ['AdminUser']);
  touch(authApi, ['profile']);
}

const MODEL_REFETCH = {
  job: touchJobs,
  booking: touchBookings,
  bid: touchBids,
  agreedrate: () => touch(supplierRelationshipsApi, ['AgreedRate']),
  availability: () => {
    touch(agencyAvailabilityApi, ['AgencyAvailability', 'AgencyJobType']);
    touch(nurseAvailabilityApi, ['NurseAvailability', 'NurseJobType']);
    touch(homeCareCompanyAvailabilityApi, ['HomeCareCompanyAvailability', 'HomeCareCompanyJobType']);
  },
  permanenthire: () => {
    touch(supplierRelationshipsApi, ['PermanentHire']);
    touch(dashboardSettingsApi, ['TempToPerm', 'AdminPermanentHire']);
  },
  user: touchUsers,
  staff: () => {
    touch(staffApi, ['DashboardStaff', 'AvailableStaff']);
    touch(agencyStaffApi, ['AgencyStaff', 'AgencyNurse']);
    touch(homeCareCompanyStaffApi, ['HomeCareCompanyStaff', 'HomeCareCompanyNurse']);
    touch(nurseStaffRequestsApi, ['NurseStaffRequest']);
  },
  branches: () => {
    touch(agencyBranchesApi, ['AgencyBranch']);
    touch(careHomeBranchesApi, ['CareHomeBranch']);
    touch(hospitalBranchesApi, ['HospitalBranch']);
    touch(localAuthorityBranchesApi, ['LocalAuthorityBranch']);
    touch(homeCareCompanyBranchesApi, ['HomeCareCompanyBranch']);
    touch(nurseBranchesApi, ['NurseBranch']);
    touch(userBranchesApi, ['UserBranch']);
  },
  address: () => touch(userBranchesApi, ['UserBranch']),
  supplierrelationship: () => touch(supplierRelationshipsApi, ['Contract']),
  favorite: () => touch(favoritesApi, ['Favorite']),
  review: () => touch(reviewsApi, ['Review']),
  verification: touchUsers,
  allegation: () => touch(adminAllegationsApi, ['AdminAllegation']),
  jobrole: () => {
    touch(adminJobRolesApi, ['AdminJobRole']);
    touch(supplierJobRolesApi, ['SupplierJobRoleChoices', 'SupplierJobRolesMine']);
  },
  faq: () => touch(faqsApi, ['Faq', 'AdminFaq']),
  adminsettings: () => touch(dashboardSettingsApi, ['SettingsContent', 'AdminLegal', 'TermsStatus']),
  supportrequest: () => touch(supportApi, ['Support', 'AdminSupport']),
  contactus: () => touch(supportApi, ['Support', 'AdminSupport']),
  notificationpreferences: () => {
    touch(notificationsApi, ['Notification']);
    touchUsers();
  },
  notification: () => {
    touch(notificationsApi, ['Notification']);
    touch(sidebarCountsApi, ['SidebarCounts']);
  },
  usersstripeaccounts: () => {
    touch(walletsApi, ['Wallet']);
    touch(adminTransactionsApi, ['AdminTransaction', 'AdminPlatformFee']);
    touch(bookingPaymentsApi, ['BookingPayments']);
  },
  gocardlessmandate: () => touch(gocardlessApi, ['GoCardlessMandate', 'AdminPayout']),
  usergoogleintegration: touchUsers,
};

function normalizeModel(model) {
  return String(model || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function readDataChanges(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.changes)) return payload.changes;
  if (payload?.model) return [payload];
  return [];
}

export function refetchForModel(model) {
  const run = MODEL_REFETCH[normalizeModel(model)];
  if (run) run();
}

export function queueModelRefetch(model) {
  const key = normalizeModel(model);
  if (!key || !MODEL_REFETCH[key]) return;
  pendingModels.add(key);
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    const models = [...pendingModels];
    pendingModels.clear();
    models.forEach(refetchForModel);
  }, DEBOUNCE_MS);
}

export function refetchMainLists() {
  ['Job', 'Booking', 'Bid', 'Notification', 'User'].forEach(queueModelRefetch);
}
