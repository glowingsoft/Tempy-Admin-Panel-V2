import { paths } from 'src/routes/paths';

import { setSession } from 'src/auth/context/jwt/utils';
import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

import { toast } from 'src/components/snackbar';

import { setUser } from 'src/store/slices/userSlice';
import { startImpersonation, clearImpersonation } from 'src/store/slices/impersonationSlice';
import { adminUsersApi } from 'src/store/Reducer/admin-users-api';
import { usersApi } from 'src/store/Reducer/users-api';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { extractLatLng } from 'src/sections/agency/jobs/agency-job-api-utils';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { resolveAdminUserRecordId } from './shared/admin-users-api-utils';
import { isAccountInactive } from './shared/admin-account-status';
import { resetAccountScopedState } from 'src/store/reset-role-api-caches';

const IMPERSONATION_ADMIN_PATHS = {
  agency: paths.adminDashboard.agencies,
  care_home: paths.adminDashboard.careHomes,
  hospital_nhs: paths.adminDashboard.hospitals,
  local_authority: paths.adminDashboard.localAuthority,
  individual_home_care: paths.adminDashboard.individualHomeCare,
  home_care_company: paths.adminDashboard.homeCareCompanies,
  staff_member: paths.adminDashboard.staffMembers,
};

const IMPERSONATION_CONFIG = {
  agency: { userType: 'agency', accountType: 'agency', permission: 3 },
  care_home: { userType: 'careHome', accountType: 'care_home', permission: 2 },
  hospital_nhs: { userType: 'hospital', accountType: 'hospital_nhs', permission: 4 },
  local_authority: { userType: 'localAuthority', accountType: 'local_authority', permission: 5 },
  individual_home_care: { userType: 'user', accountType: 'individual_home_care', permission: 6 },
  home_care_company: { userType: 'homeCareCompany', accountType: 'home_care_company', permission: 7 },
  staff_member: { userType: 'nurse', accountType: 'staff_member', permission: 8 },
};

// ----------------------------------------------------------------------

/** Build a location object calendar APIs can read via getAgencyUserLatLng / extractLatLng. */
function toUserLocation(point) {
  if (!point) return null;
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return {
    latitude,
    longitude,
    coordinates: [longitude, latitude],
  };
}

function attachUserLocation(user, ...sources) {
  for (const source of sources) {
    const location = toUserLocation(extractLatLng(source, { allowZero: false }));
    if (!location) continue;
    return {
      ...user,
      location,
      basicInfo: {
        ...user.basicInfo,
        location,
      },
    };
  }
  return user;
}

function buildUserFromRecord(record, targetType, token) {
  const config = IMPERSONATION_CONFIG[targetType];
  const profileId = resolveAdminUserRecordId(record);

  const base = {
    _id: profileId,
    id: profileId,
    basicInfo: {
      _id: profileId,
      profileIcon: record.avatarUrl || '',
      name: record.name,
      email: record.email,
      phoneNumber: record.phone || null,
      language: 'en',
    },
    accountState: {
      userType: config.userType,
      accountType: config.accountType,
      status: record.status || 'active',
      verificationStatus: {
        email: 'verified',
        phoneNumber: 'verified',
      },
    },
    metadata: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: record.registeredAt,
      updatedAt: new Date().toISOString(),
    },
    // Keep a real (admin) JWT — mock tokens cause API 401 → full page refresh
    token,
    permission: config.permission,
  };

  // Prefer geo from admin list `raw` so shifts calendar uses same origin as direct login
  return attachUserLocation(base, record.raw, record.raw?.basicInfo, record);
}

async function enrichUserLocationFromProfile(user, userId, dispatch) {
  if (!userId || extractLatLng(user, { allowZero: false })) return user;

  try {
    const result = await dispatch(
      usersApi.endpoints.getUserById.initiate(userId, { forceRefetch: true })
    );
    if (result?.data) {
      return attachUserLocation(user, result.data, result.data.location);
    }
  } catch {
    // Profile optional — calendar may still fall back to branch coords
  }

  return user;
}

async function resolveImpersonationTargetUserId(record, dispatch) {
  const listId = resolveAdminUserRecordId(record);
  if (!listId) return '';

  let resolvedId = listId;

  try {
    const adminDetail = await dispatch(
      adminUsersApi.endpoints.getAdminUserById.initiate(listId, { forceRefetch: true })
    );
    const fromAdmin = resolveAdminUserRecordId(adminDetail?.data || {});
    if (fromAdmin) resolvedId = fromAdmin;
  } catch {
    // optional
  }

  try {
    const profileResult = await dispatch(
      usersApi.endpoints.getUserById.initiate(resolvedId, { forceRefetch: true })
    );
    const fromProfile = getProfileUserId(profileResult?.data);
    if (fromProfile) resolvedId = fromProfile;
  } catch {
    // optional
  }

  return String(resolvedId).trim();
}

async function impersonateEntity({ record, targetType, adminUser, dispatch, router }) {
  const adminToken = sessionStorage.getItem(STORAGE_KEY) || adminUser?.token || null;

  if (!adminToken) {
    toast.error('Admin session missing — please sign in again');
    return;
  }

  const targetUserId = await resolveImpersonationTargetUserId(record, dispatch);

  if (!targetUserId) {
    toast.error('Cannot open dashboard — user id is missing for this account');
    return;
  }

  if (isAccountInactive(record?.status)) {
    toast.info(
      `${record.name} is inactive (cannot log in). Opening view for previously assigned work / dashboard access.`
    );
  }

  // Prepare everything first — do NOT flip impersonation/UI until navigate is ready,
  // otherwise the warning banner appears on the admin list before the role dashboard.
  let impersonatedUser = buildUserFromRecord(record, targetType, adminToken);
  // Keep session user id identical to impersonation targetId (list id ≠ profile id breaks filters).
  impersonatedUser = {
    ...impersonatedUser,
    _id: targetUserId,
    id: targetUserId,
    basicInfo: {
      ...impersonatedUser.basicInfo,
      _id: targetUserId,
      id: targetUserId,
    },
  };
  impersonatedUser = await enrichUserLocationFromProfile(
    impersonatedUser,
    targetUserId,
    dispatch
  );

  await setSession(adminToken);

  const homePath = getDashboardRootPath(
    impersonatedUser.permission,
    IMPERSONATION_CONFIG[targetType]?.accountType || targetType
  );

  // One sync switch: banner + role user + leave admin list together
  dispatch(
    startImpersonation({
      adminUser: { ...adminUser, token: adminToken },
      adminToken,
      targetType,
      targetId: targetUserId,
      targetName: record.name,
    })
  );
  dispatch(setUser(impersonatedUser));
  resetAccountScopedState(dispatch);
  router.replace(homePath);
}

export function buildAgencyUserFromRecord(agency) {
  return buildUserFromRecord(agency, 'agency');
}

export function buildCareHomeUserFromRecord(careHome) {
  return buildUserFromRecord(careHome, 'care_home');
}

export function buildHospitalUserFromRecord(hospital) {
  return buildUserFromRecord(hospital, 'hospital_nhs');
}

export function buildLocalAuthorityUserFromRecord(record) {
  return buildUserFromRecord(record, 'local_authority');
}

export function buildIndividualHomeCareUserFromRecord(record) {
  return buildUserFromRecord(record, 'individual_home_care');
}

export function buildHomeCareCompanyUserFromRecord(record) {
  return buildUserFromRecord(record, 'home_care_company');
}

export function buildStaffMemberUserFromRecord(record) {
  return buildUserFromRecord(record, 'staff_member');
}

export async function impersonateAgency({ agency, adminUser, dispatch, router }) {
  await impersonateEntity({ record: agency, targetType: 'agency', adminUser, dispatch, router });
}

export async function impersonateCareHome({ careHome, adminUser, dispatch, router }) {
  await impersonateEntity({ record: careHome, targetType: 'care_home', adminUser, dispatch, router });
}

export async function impersonateHospital({ hospital, adminUser, dispatch, router }) {
  await impersonateEntity({ record: hospital, targetType: 'hospital_nhs', adminUser, dispatch, router });
}

export async function impersonateLocalAuthority({ record, adminUser, dispatch, router }) {
  await impersonateEntity({ record, targetType: 'local_authority', adminUser, dispatch, router });
}

export async function impersonateIndividualHomeCare({ record, adminUser, dispatch, router }) {
  await impersonateEntity({ record, targetType: 'individual_home_care', adminUser, dispatch, router });
}

export async function impersonateHomeCareCompany({ record, adminUser, dispatch, router }) {
  await impersonateEntity({ record, targetType: 'home_care_company', adminUser, dispatch, router });
}

export async function impersonateStaffMember({ record, adminUser, dispatch, router }) {
  await impersonateEntity({ record, targetType: 'staff_member', adminUser, dispatch, router });
}

export async function exitImpersonation({ impersonationState, dispatch, router }) {
  if (!impersonationState?.isActive) return;

  const adminToken =
    impersonationState.adminToken || impersonationState.adminUser?.token || null;

  if (adminToken) {
    await setSession(adminToken);
  }
  const returnPath =
    IMPERSONATION_ADMIN_PATHS[impersonationState.targetType] || paths.adminDashboard.root;

  if (impersonationState.adminUser) {
    dispatch(
      setUser({
        ...impersonationState.adminUser,
        token: adminToken || impersonationState.adminUser.token,
        permission: impersonationState.adminUser.permission ?? 1,
      })
    );
  }
  dispatch(clearImpersonation());
  resetAccountScopedState(dispatch);
  router.replace(returnPath);
}

export function getImpersonationDashboardLabel(targetType) {
  const labels = {
    care_home: 'care home dashboard',
    agency: 'agency dashboard',
    hospital_nhs: 'hospital dashboard',
    local_authority: 'local authority dashboard',
    individual_home_care: 'individual home care dashboard',
    home_care_company: 'home care company dashboard',
    staff_member: 'staff member dashboard',
  };

  return labels[targetType] || 'dashboard';
}
