import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useGetAgencyBranchesQuery } from 'src/store/Reducer/agency-branches-api';
import { useGetCareHomeBranchesQuery } from 'src/store/Reducer/care-home-branches-api';
import { useGetHospitalBranchesQuery } from 'src/store/Reducer/hospital-branches-api';
import { useGetLocalAuthorityBranchesQuery } from 'src/store/Reducer/local-authority-branches-api';
import { useGetHomeCareCompanyBranchesQuery } from 'src/store/Reducer/home-care-company-branches-api';
import { useUserAddressesQuery } from 'src/store/Reducer/user-branches-api';

import { BRANCH_LIST_ARGS } from 'src/store/rtk-query-defaults';

import {
  ALL_SITES_ID,
  getBranchDisplayName,
  getBranchesManagePath,
  getSiteNoun,
  isActiveSiteBranch,
  isListedBranch,
  loadActiveBranchId,
  resolveBranchRole,
  saveActiveBranchId,
} from './active-branch';

const ActiveBranchContext = createContext(null);

const LIST_ARGS = BRANCH_LIST_ARGS;

export function ActiveBranchProvider({ children }) {
  const { user } = useSelector((state) => state.user);
  const role = resolveBranchRole(user);
  const userId = String(user?.basicInfo?._id || user?.basicInfo?.id || user?._id || user?.id || '');

  const careHomeQuery = useGetCareHomeBranchesQuery(LIST_ARGS, { skip: role !== 'careHome' });
  const hospitalQuery = useGetHospitalBranchesQuery(LIST_ARGS, { skip: role !== 'hospital' });
  const localAuthorityQuery = useGetLocalAuthorityBranchesQuery(LIST_ARGS, {
    skip: role !== 'localAuthority',
  });
  const homeCareCompanyQuery = useGetHomeCareCompanyBranchesQuery(LIST_ARGS, {
    skip: role !== 'homeCareCompany',
  });
  const agencyQuery = useGetAgencyBranchesQuery(LIST_ARGS, { skip: role !== 'agency' });
  const userQuery = useUserAddressesQuery({ page: 0, limit: 100 }, { skip: role !== 'user' });

  const query =
    role === 'hospital'
      ? hospitalQuery
      : role === 'localAuthority'
        ? localAuthorityQuery
        : role === 'homeCareCompany'
          ? homeCareCompanyQuery
          : role === 'agency'
            ? agencyQuery
            : role === 'user'
              ? userQuery
              : careHomeQuery;

  const allBranches = useMemo(
    () => (query.data?.data || []).filter(isListedBranch),
    [query.data?.data]
  );

  const branches = useMemo(() => allBranches.filter(isActiveSiteBranch), [allBranches]);

  const [activeBranchId, setActiveBranchIdState] = useState(ALL_SITES_ID);

  useEffect(() => {
    setActiveBranchIdState(loadActiveBranchId(userId));
  }, [userId]);

  useEffect(() => {
    if (!role || query.isLoading) return;
    if (activeBranchId === ALL_SITES_ID) return;
    const exists = allBranches.some((branch) => String(branch.id) === String(activeBranchId));
    if (!exists) setActiveBranchIdState(ALL_SITES_ID);
  }, [activeBranchId, allBranches, query.isLoading, role]);

  const setActiveBranchId = useCallback(
    (nextId) => {
      const value = nextId || ALL_SITES_ID;
      setActiveBranchIdState(value);
      saveActiveBranchId(userId, value);
    },
    [userId]
  );

  const activeBranch = useMemo(
    () => allBranches.find((branch) => String(branch.id) === String(activeBranchId)) || null,
    [activeBranchId, allBranches]
  );

  const value = useMemo(
    () => ({
      enabled: Boolean(role),
      role,
      branches,
      allBranches,
      loading: Boolean(role && query.isLoading),
      activeBranchId: role ? activeBranchId : ALL_SITES_ID,
      activeBranch,
      activeBranchName: getBranchDisplayName(activeBranch),
      isAllSites: !role || activeBranchId === ALL_SITES_ID,
      setActiveBranchId,
      managePath: getBranchesManagePath(role),
      siteNoun: getSiteNoun(role),
      siteNounPlural: getSiteNoun(role, { plural: true }),
    }),
    [
      activeBranch,
      activeBranchId,
      allBranches,
      branches,
      query.isLoading,
      role,
      setActiveBranchId,
    ]
  );

  return <ActiveBranchContext.Provider value={value}>{children}</ActiveBranchContext.Provider>;
}

const INACTIVE = {
  enabled: false,
  role: null,
  branches: [],
  allBranches: [],
  loading: false,
  activeBranchId: ALL_SITES_ID,
  activeBranch: null,
  activeBranchName: '',
  isAllSites: true,
  setActiveBranchId: () => {},
  managePath: '',
  siteNoun: 'site',
  siteNounPlural: 'sites',
};

export function useActiveBranch() {
  return useContext(ActiveBranchContext) || INACTIVE;
}
