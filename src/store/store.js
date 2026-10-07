import { configureStore, createAction } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authApi } from './Reducer/auth';
import userReducer from './slices/userSlice';
import impersonationReducer from './slices/impersonationSlice';
import { walletsApi } from './Reducer/wallets-api';
import { categoriesApi } from './Reducer/categories-api';
import { staffApi } from './Reducer/staff-api';
import { favoritesApi } from './Reducer/favorites-api';
import { reviewsApi } from './Reducer/reviews-api';
import { agencyBranchesApi } from './Reducer/agency-branches-api';
import { careHomeBranchesApi } from './Reducer/care-home-branches-api';
import { hospitalBranchesApi } from './Reducer/hospital-branches-api';
import { localAuthorityBranchesApi } from './Reducer/local-authority-branches-api';
import { homeCareCompanyBranchesApi } from './Reducer/home-care-company-branches-api';
import { userBranchesApi } from './Reducer/user-branches-api';
import { agencyAvailabilityApi } from './Reducer/agency-availability-api';
import { homeCareCompanyAvailabilityApi } from './Reducer/home-care-company-availability-api';
import { nurseAvailabilityApi } from './Reducer/nurse-availability-api';
import { nurseBranchesApi } from './Reducer/nurse-branches-api';
import { agencyStaffApi } from './Reducer/agency-staff-api';
import { homeCareCompanyStaffApi } from './Reducer/home-care-company-staff-api';
import { usersApi } from './Reducer/users-api';
import { agencyJobsApi } from './Reducer/agency-jobs-api';
import { agencyBidsApi } from './Reducer/agency-bids-api';
import { supplierRelationshipsApi } from './Reducer/supplier-relationships-api';
import { careTutorApi } from './Reducer/care-tutor-api';
import { homeCareCompanyJobsApi } from './Reducer/home-care-company-jobs-api';
import { homeCareCompanyBidsApi } from './Reducer/home-care-company-bids-api';
import { nurseJobsApi } from './Reducer/nurse-jobs-api';
import { nurseBidsApi } from './Reducer/nurse-bids-api';
import { nurseBookingsApi } from './Reducer/nurse-bookings-api';
import { jobAttendanceApi } from './Reducer/job-attendance-api';
import { supplierJobRolesApi } from './Reducer/supplier-job-roles-api';
import { faqsApi } from './Reducer/faqs-api';
import { careHomeJobsApi } from './Reducer/care-home-jobs-api';
import { hospitalJobsApi } from './Reducer/hospital-jobs-api';
import { userJobsApi } from './Reducer/user-jobs-api';
import { localAuthorityJobsApi } from './Reducer/local-authority-jobs-api';
import { supportApi } from './Reducer/support-api';
import { dashboardSettingsApi } from './Reducer/dashboard-settings-api';
import { adminJobRolesApi } from './Reducer/admin-job-roles-api';
import { uploadApi } from './Reducer/upload-api';
import { adminUsersApi } from './Reducer/admin-users-api';
import { adminAllegationsApi } from './Reducer/admin-allegations-api';
import { gocardlessApi } from './Reducer/gocardless-api';
import { adminDashboardApi } from './Reducer/admin-dashboard-api';
import { notificationsApi } from './Reducer/notifications-api';
import { conversationsApi } from './Reducer/conversations-api';
import { careHomeDashboardApi } from './Reducer/care-home-dashboard-api';
import { localAuthorityDashboardApi } from './Reducer/local-authority-dashboard-api';
import { hospitalDashboardApi } from './Reducer/hospital-dashboard-api';
import { userDashboardApi } from './Reducer/user-dashboard-api';
import { agencyDashboardApi } from './Reducer/agency-dashboard-api';
import { earningsApi } from './Reducer/earnings-api';
import { sidebarCountsApi } from './Reducer/sidebar-counts-api';
import { homeCareCompanyDashboardApi } from './Reducer/home-care-company-dashboard-api';
import { nurseDashboardApi } from './Reducer/nurse-dashboard-api';
import { publicStaffApi } from './Reducer/public-staff-api';
import { nurseStaffRequestsApi } from './Reducer/nurse-staff-requests-api';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'],
};

export const resetApiState = createAction('api/resetApiState');

const persistedUserReducer = persistReducer(persistConfig, userReducer);

export const store = configureStore({
  reducer: {
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [walletsApi.reducerPath]: walletsApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [favoritesApi.reducerPath]: favoritesApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [agencyBranchesApi.reducerPath]: agencyBranchesApi.reducer,
    [careHomeBranchesApi.reducerPath]: careHomeBranchesApi.reducer,
    [hospitalBranchesApi.reducerPath]: hospitalBranchesApi.reducer,
    [localAuthorityBranchesApi.reducerPath]: localAuthorityBranchesApi.reducer,
    [homeCareCompanyBranchesApi.reducerPath]: homeCareCompanyBranchesApi.reducer,
    [userBranchesApi.reducerPath]: userBranchesApi.reducer,
    [agencyAvailabilityApi.reducerPath]: agencyAvailabilityApi.reducer,
    [homeCareCompanyAvailabilityApi.reducerPath]: homeCareCompanyAvailabilityApi.reducer,
    [nurseAvailabilityApi.reducerPath]: nurseAvailabilityApi.reducer,
    [nurseBranchesApi.reducerPath]: nurseBranchesApi.reducer,
    [agencyStaffApi.reducerPath]: agencyStaffApi.reducer,
    [homeCareCompanyStaffApi.reducerPath]: homeCareCompanyStaffApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [agencyJobsApi.reducerPath]: agencyJobsApi.reducer,
    [agencyBidsApi.reducerPath]: agencyBidsApi.reducer,
    [supplierRelationshipsApi.reducerPath]: supplierRelationshipsApi.reducer,
    [careTutorApi.reducerPath]: careTutorApi.reducer,
    [homeCareCompanyJobsApi.reducerPath]: homeCareCompanyJobsApi.reducer,
    [homeCareCompanyBidsApi.reducerPath]: homeCareCompanyBidsApi.reducer,
    [nurseJobsApi.reducerPath]: nurseJobsApi.reducer,
    [nurseBidsApi.reducerPath]: nurseBidsApi.reducer,
    [nurseBookingsApi.reducerPath]: nurseBookingsApi.reducer,
    [jobAttendanceApi.reducerPath]: jobAttendanceApi.reducer,
    [supplierJobRolesApi.reducerPath]: supplierJobRolesApi.reducer,
    [faqsApi.reducerPath]: faqsApi.reducer,
    [careHomeJobsApi.reducerPath]: careHomeJobsApi.reducer,
    [hospitalJobsApi.reducerPath]: hospitalJobsApi.reducer,
    [userJobsApi.reducerPath]: userJobsApi.reducer,
    [localAuthorityJobsApi.reducerPath]: localAuthorityJobsApi.reducer,
    [supportApi.reducerPath]: supportApi.reducer,
    [dashboardSettingsApi.reducerPath]: dashboardSettingsApi.reducer,
    [adminJobRolesApi.reducerPath]: adminJobRolesApi.reducer,
    [adminUsersApi.reducerPath]: adminUsersApi.reducer,
    [adminAllegationsApi.reducerPath]: adminAllegationsApi.reducer,
    [gocardlessApi.reducerPath]: gocardlessApi.reducer,
    [adminDashboardApi.reducerPath]: adminDashboardApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [conversationsApi.reducerPath]: conversationsApi.reducer,
    [careHomeDashboardApi.reducerPath]: careHomeDashboardApi.reducer,
    [localAuthorityDashboardApi.reducerPath]: localAuthorityDashboardApi.reducer,
    [hospitalDashboardApi.reducerPath]: hospitalDashboardApi.reducer,
    [userDashboardApi.reducerPath]: userDashboardApi.reducer,
    [agencyDashboardApi.reducerPath]: agencyDashboardApi.reducer,
    [earningsApi.reducerPath]: earningsApi.reducer,
    [sidebarCountsApi.reducerPath]: sidebarCountsApi.reducer,
    [homeCareCompanyDashboardApi.reducerPath]: homeCareCompanyDashboardApi.reducer,
    [nurseDashboardApi.reducerPath]: nurseDashboardApi.reducer,
    [nurseStaffRequestsApi.reducerPath]: nurseStaffRequestsApi.reducer,
    [publicStaffApi.reducerPath]: publicStaffApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    user: persistedUserReducer,
    impersonation: impersonationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      walletsApi.middleware,
      categoriesApi.middleware,
      staffApi.middleware,
      favoritesApi.middleware,
      reviewsApi.middleware,
      agencyBranchesApi.middleware,
      careHomeBranchesApi.middleware,
      hospitalBranchesApi.middleware,
      localAuthorityBranchesApi.middleware,
      homeCareCompanyBranchesApi.middleware,
      userBranchesApi.middleware,
      agencyAvailabilityApi.middleware,
      homeCareCompanyAvailabilityApi.middleware,
      nurseAvailabilityApi.middleware,
      nurseBranchesApi.middleware,
      agencyStaffApi.middleware,
      homeCareCompanyStaffApi.middleware,
      usersApi.middleware,
      agencyJobsApi.middleware,
      agencyBidsApi.middleware,
      supplierRelationshipsApi.middleware,
      careTutorApi.middleware,
      homeCareCompanyJobsApi.middleware,
      homeCareCompanyBidsApi.middleware,
      nurseJobsApi.middleware,
      nurseBidsApi.middleware,
      nurseBookingsApi.middleware,
      jobAttendanceApi.middleware,
      supplierJobRolesApi.middleware,
      faqsApi.middleware,
      careHomeJobsApi.middleware,
      hospitalJobsApi.middleware,
      userJobsApi.middleware,
      localAuthorityJobsApi.middleware,
      supportApi.middleware,
      dashboardSettingsApi.middleware,
      adminJobRolesApi.middleware,
      adminUsersApi.middleware,
      adminAllegationsApi.middleware,
      gocardlessApi.middleware,
      adminDashboardApi.middleware,
      notificationsApi.middleware,
      conversationsApi.middleware,
      careHomeDashboardApi.middleware,
      localAuthorityDashboardApi.middleware,
      hospitalDashboardApi.middleware,
      userDashboardApi.middleware,
      agencyDashboardApi.middleware,
      earningsApi.middleware,
      sidebarCountsApi.middleware,
      homeCareCompanyDashboardApi.middleware,
      nurseDashboardApi.middleware,
      nurseStaffRequestsApi.middleware,
      publicStaffApi.middleware,
      uploadApi.middleware
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);


