
import { supplierRelationshipsApi } from './Reducer/supplier-relationships-api';
import { agencyAvailabilityApi } from './Reducer/agency-availability-api';
import { agencyBidsApi } from './Reducer/agency-bids-api';
import { agencyBranchesApi } from './Reducer/agency-branches-api';
import { agencyDashboardApi } from './Reducer/agency-dashboard-api';
import { earningsApi } from './Reducer/earnings-api';
import { bookingPaymentsApi } from './Reducer/booking-payments-api';
import { adminTransactionsApi } from './Reducer/admin-transactions-api';
import { sidebarCountsApi } from './Reducer/sidebar-counts-api';
import { agencyJobsApi } from './Reducer/agency-jobs-api';
import { agencyStaffApi } from './Reducer/agency-staff-api';
import { careHomeBranchesApi } from './Reducer/care-home-branches-api';
import { careHomeDashboardApi } from './Reducer/care-home-dashboard-api';
import { careHomeJobsApi } from './Reducer/care-home-jobs-api';
import { conversationsApi } from './Reducer/conversations-api';
import { favoritesApi } from './Reducer/favorites-api';
import { homeCareCompanyAvailabilityApi } from './Reducer/home-care-company-availability-api';
import { homeCareCompanyBidsApi } from './Reducer/home-care-company-bids-api';
import { homeCareCompanyBranchesApi } from './Reducer/home-care-company-branches-api';
import { homeCareCompanyDashboardApi } from './Reducer/home-care-company-dashboard-api';
import { homeCareCompanyJobsApi } from './Reducer/home-care-company-jobs-api';
import { homeCareCompanyStaffApi } from './Reducer/home-care-company-staff-api';
import { hospitalBranchesApi } from './Reducer/hospital-branches-api';
import { hospitalDashboardApi } from './Reducer/hospital-dashboard-api';
import { hospitalJobsApi } from './Reducer/hospital-jobs-api';
import { localAuthorityBranchesApi } from './Reducer/local-authority-branches-api';
import { localAuthorityDashboardApi } from './Reducer/local-authority-dashboard-api';
import { localAuthorityJobsApi } from './Reducer/local-authority-jobs-api';
import { notificationsApi } from './Reducer/notifications-api';
import { nurseAvailabilityApi } from './Reducer/nurse-availability-api';
import { nurseBidsApi } from './Reducer/nurse-bids-api';
import { nurseBookingsApi } from './Reducer/nurse-bookings-api';
import { jobAttendanceApi } from './Reducer/job-attendance-api';
import { supplierJobRolesApi } from './Reducer/supplier-job-roles-api';
import { nurseBranchesApi } from './Reducer/nurse-branches-api';
import { nurseDashboardApi } from './Reducer/nurse-dashboard-api';
import { nurseJobsApi } from './Reducer/nurse-jobs-api';
import { nurseStaffRequestsApi } from './Reducer/nurse-staff-requests-api';
import { reviewsApi } from './Reducer/reviews-api';
import { staffApi } from './Reducer/staff-api';
import { supportApi } from './Reducer/support-api';
import { userBranchesApi } from './Reducer/user-branches-api';
import { userDashboardApi } from './Reducer/user-dashboard-api';
import { userJobsApi } from './Reducer/user-jobs-api';
import { walletsApi } from './Reducer/wallets-api';
import { gocardlessApi } from './Reducer/gocardless-api';

const ROLE_APIS = [
  supplierRelationshipsApi,
  agencyAvailabilityApi,
  agencyBidsApi,
  agencyBranchesApi,
  agencyDashboardApi,
  agencyJobsApi,
  earningsApi,
  bookingPaymentsApi,
  adminTransactionsApi,
  sidebarCountsApi,
  agencyStaffApi,
  careHomeBranchesApi,
  careHomeDashboardApi,
  careHomeJobsApi,
  conversationsApi,
  favoritesApi,
  homeCareCompanyAvailabilityApi,
  homeCareCompanyBidsApi,
  homeCareCompanyBranchesApi,
  homeCareCompanyDashboardApi,
  homeCareCompanyJobsApi,
  homeCareCompanyStaffApi,
  hospitalBranchesApi,
  hospitalDashboardApi,
  hospitalJobsApi,
  localAuthorityBranchesApi,
  localAuthorityDashboardApi,
  localAuthorityJobsApi,
  notificationsApi,
  nurseAvailabilityApi,
  nurseBidsApi,
  nurseBookingsApi,
  jobAttendanceApi,
  supplierJobRolesApi,
  nurseBranchesApi,
  nurseDashboardApi,
  nurseJobsApi,
  nurseStaffRequestsApi,
  reviewsApi,
  staffApi,
  supportApi,
  userBranchesApi,
  userDashboardApi,
  userJobsApi,
  walletsApi,
  gocardlessApi,
];

const CROSS_USER_LOCAL_KEYS = [
  'agency-bids',
  'care-home-jobs',
  'individual-home-care-jobs',
  'care-home-job-types',
  'agency-incoming-job-requests',
  'agency-staff-availability-blocks',
  'tempy-staff-shift-cancellations',
  'tempy-staff-shift-alerts',
  'tempy-supplier-job-care-details',
  'tempy-employer-shift-payments-v2',
];

const CROSS_USER_LOCAL_PREFIXES = ['tempy-dashboard-invoices:', 'tempy-company-roster:'];

const CROSS_USER_SESSION_PREFIXES = ['nurse:', 'agency:', 'hcc:', 'nurse-', 'agency-', 'hcc-'];

export function clearCrossUserBrowserSeeds() {
  if (typeof window === 'undefined') return;

  try {
    CROSS_USER_LOCAL_KEYS.forEach((key) => window.localStorage.removeItem(key));

    const localKeys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key) localKeys.push(key);
    }
    localKeys.forEach((key) => {
      if (CROSS_USER_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
  }

  try {
    const sessionKeys = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key) sessionKeys.push(key);
    }
    sessionKeys.forEach((key) => {
      if (CROSS_USER_SESSION_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.sessionStorage.removeItem(key);
      }
    });
  } catch {
  }
}

export function resetRoleApiCaches(dispatch) {
  if (!dispatch) return;

  ROLE_APIS.forEach((api) => {
    try {
      dispatch(api.util.resetApiState());
    } catch {
    }
  });
}

export function resetAccountScopedState(dispatch) {
  resetRoleApiCaches(dispatch);
  clearCrossUserBrowserSeeds();
}
