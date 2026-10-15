import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { useViewOnly } from 'src/hooks/use-view-only';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';
import { usePathname, useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';

import {
  useCreateAgencyBranchMutation,
  useDeleteAgencyBranchMutation,
  useGetAgencyBranchesQuery,
  useUpdateAgencyBranchMutation,
} from 'src/store/Reducer/agency-branches-api';
import {
  useCreateCareHomeBranchMutation,
  useDeleteCareHomeBranchMutation,
  useGetCareHomeBranchesQuery,
  useUpdateCareHomeBranchMutation,
} from 'src/store/Reducer/care-home-branches-api';
import {
  useCreateHospitalBranchMutation,
  useDeleteHospitalBranchMutation,
  useGetHospitalBranchesQuery,
  useUpdateHospitalBranchMutation,
} from 'src/store/Reducer/hospital-branches-api';
import {
  useCreateLocalAuthorityBranchMutation,
  useDeleteLocalAuthorityBranchMutation,
  useGetLocalAuthorityBranchesQuery,
  useUpdateLocalAuthorityBranchMutation,
} from 'src/store/Reducer/local-authority-branches-api';
import {
  useCreateHomeCareCompanyBranchMutation,
  useDeleteHomeCareCompanyBranchMutation,
  useGetHomeCareCompanyBranchesQuery,
  useUpdateHomeCareCompanyBranchMutation,
} from 'src/store/Reducer/home-care-company-branches-api';
import {
  useCreateUserBranchMutation,
  useDeleteUserBranchMutation,
  useUserAddressesQuery,
  useUpdateUserBranchMutation,
} from 'src/store/Reducer/user-branches-api';

import { BRANCH_STATUS, CQC_RATING_OPTIONS } from '../branches-constants';
import { BranchFormDialog, buildAgencyBranchPayload, buildAgencyBranchUpdatePayload } from '../branch-form-dialog';
import { BranchTableToolbar } from '../branch-table-toolbar';
import {
  getAgencyBranchLocationLabel,
  getAgencyBranchMongoId,
} from '../agency-branch-utils';
import { buildUserAddressPayload, buildUserAddressUpdatePayload } from '../user-address-utils';
import { useActiveBranch } from '../active-branch-context';
import { getBranchesNav } from '../branch-paths';

const API_BRANCH_ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const API_TABLE_HEAD = [
  { id: 'profile', label: 'Profile', width: 72 },
  { id: 'name', label: 'Location name', width: 160 },
  { id: 'fullAddress', label: 'Full address' },
  { id: 'city', label: 'City', width: 120 },
  { id: 'country', label: 'Country', width: 120 },
  { id: 'status', label: 'Status', width: 110 },
  { id: 'action', label: 'Action', width: 100, align: 'right' },
];

const HCC_TABLE_HEAD = [
  { id: 'profile', label: 'Profile', width: 72 },
  { id: 'name', label: 'Location name', width: 150 },
  { id: 'fullAddress', label: 'Full address' },
  { id: 'cqc', label: 'CQC', width: 130 },
  { id: 'city', label: 'City', width: 110 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'action', label: 'Action', width: 100, align: 'right' },
];

function statusChipColor(status) {
  if (status === BRANCH_STATUS.ACTIVE || status === 'active') return 'success';
  if (status === BRANCH_STATUS.PENDING || status === 'pending') return 'warning';
  if (status === BRANCH_STATUS.INACTIVE || status === 'inactive') return 'error';
  if (status === BRANCH_STATUS.DELETED || status === 'deleted' || status === 'delete') return 'default';
  return 'default';
}

function isAgencyUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return permission === 3 || accountType === 'agency';
}

function isCareHomeUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 2 ||
    accountType === 'care_home' ||
    accountType === 'careHome'
  );
}

function isHospitalUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 4 ||
    accountType === 'hospital_nhs' ||
    accountType === 'hospital'
  );
}

function isLocalAuthorityUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 5 ||
    accountType === 'local_authority' ||
    accountType === 'localAuthority'
  );
}

function isHomeCareCompanyUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 7 ||
    accountType === 'home_care_company' ||
    accountType === 'homeCareCompany'
  );
}

function isIndividualHomeCareUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 6 ||
    accountType === 'individual_home_care' ||
    accountType === 'individualHomeCare' ||
    accountType === 'user'
  );
}

function getCqcRatingLabel(value) {
  return CQC_RATING_OPTIONS.find((option) => option.value === value)?.label || value || '—';
}

function BranchProfileCell({ branch }) {
  const images = Array.isArray(branch?.images) ? branch.images : [];
  const iconUrl = resolveProfileAssetUrl(branch?.profileIcon || images[0]);
  const name = branch?.name || branch?.branchName || '';

  return (
    <Avatar src={iconUrl} alt={name} sx={{ width: 36, height: 36, fontSize: 14 }}>
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}

function getLocationLabel(branch) {
  return getAgencyBranchLocationLabel(branch);
}

function isDeletedBranchStatus(status) {
  const raw = String(status || '').toLowerCase();
  return raw === 'deleted' || raw === 'delete';
}

function applyBranchFilter({ inputData, filters }) {
  const { name, status } = filters;
  let data = inputData || [];

  if (status === BRANCH_STATUS.DELETED || status === 'deleted') {
    data = data.filter((branch) => isDeletedBranchStatus(branch.status));
  } else if (status === BRANCH_STATUS.INACTIVE || status === 'inactive') {
    data = data.filter(
      (branch) => String(branch.status || '').toLowerCase() === 'inactive'
    );
  } else if (status === BRANCH_STATUS.PENDING || status === 'pending') {
    data = data.filter((branch) => String(branch.status || '').toLowerCase() === 'pending');
  } else if (status === BRANCH_STATUS.ACTIVE || status === 'active') {
    data = data.filter(
      (branch) => String(branch.status || 'active').toLowerCase() === 'active'
    );
  }
  // "All" = exact API list (including soft-deleted).

  if (name?.trim()) {
    const query = name.trim().toLowerCase();
    data = data.filter((branch) => {
      const label = getLocationLabel(branch);
      return (
        String(branch.name || branch.branchName || '')
          .toLowerCase()
          .includes(query) ||
        String(branch.location?.fullAddress || label || '')
          .toLowerCase()
          .includes(query) ||
        String(branch.location?.city || '')
          .toLowerCase()
          .includes(query) ||
        String(branch.location?.country || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }

  return data;
}

export function BranchesView() {
  // Admin viewing this account: branches can be viewed, not added, edited or deleted.
  const viewOnly = useViewOnly();
  const table = useTable({ defaultRowsPerPage: 10 });
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.user);
  const { enabled: siteSwitcherEnabled, setActiveBranchId } = useActiveBranch();
  const accountType = user?.accountState?.accountType;
  const permission = user?.permission;
  const dashboardHref = getDashboardRootPath(permission, accountType);
  const branchesNav = useMemo(() => getBranchesNav(pathname), [pathname]);
  const agencyMode = isAgencyUser(user);
  const careHomeMode = isCareHomeUser(user);
  const hospitalMode = isHospitalUser(user);
  const localAuthorityMode = isLocalAuthorityUser(user);
  const homeCareCompanyMode = isHomeCareCompanyUser(user);
  const userMode = isIndividualHomeCareUser(user);
  const entityLabel = 'Location';
  const entityLabelPlural = 'Locations';
  const apiMode =
    agencyMode ||
    careHomeMode ||
    hospitalMode ||
    localAuthorityMode ||
    homeCareCompanyMode ||
    userMode;

  const handleOpenSite = useCallback(
    (branch) => {
      const id = String(branch?.id || branch?._id || '');
      if (!id) return;
      setActiveBranchId(id);
      router.push(branchesNav.details(id), { state: { branch } });
    },
    [branchesNav, router, setActiveBranchId]
  );

  const formDialog = useBoolean();
  const deleteDialog = useBoolean();
  const filters = useSetState({ name: '', status: 'all' });

  const [editingBranch, setEditingBranch] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [statusCountCache, setStatusCountCache] = useState({});

  const listQueryArgs = useMemo(
    () => ({
      page: 0,
      limit: 100,
      // Always fetch full API list; tabs filter client-side (active / pending / inactive / deleted).
      status: '',
    }),
    []
  );

  const {
    data: agencyBranchesData,
    isLoading: loadingAgencyBranches,
    error: agencyBranchesError,
    refetch: refetchAgencyBranches,
  } = useGetAgencyBranchesQuery(listQueryArgs, { skip: !agencyMode });

  const {
    data: careHomeBranchesData,
    isLoading: loadingCareHomeBranches,
    error: careHomeBranchesError,
    refetch: refetchCareHomeBranches,
  } = useGetCareHomeBranchesQuery(listQueryArgs, { skip: !careHomeMode });

  const {
    data: hospitalBranchesData,
    isLoading: loadingHospitalBranches,
    error: hospitalBranchesError,
    refetch: refetchHospitalBranches,
  } = useGetHospitalBranchesQuery(listQueryArgs, { skip: !hospitalMode });

  const {
    data: localAuthorityBranchesData,
    isLoading: loadingLocalAuthorityBranches,
    error: localAuthorityBranchesError,
    refetch: refetchLocalAuthorityBranches,
  } = useGetLocalAuthorityBranchesQuery(listQueryArgs, { skip: !localAuthorityMode });

  const {
    data: homeCareCompanyBranchesData,
    isLoading: loadingHomeCareCompanyBranches,
    error: homeCareCompanyBranchesError,
    refetch: refetchHomeCareCompanyBranches,
  } = useGetHomeCareCompanyBranchesQuery(listQueryArgs, { skip: !homeCareCompanyMode });

  const {
    data: userBranchesData,
    isLoading: loadingUserBranches,
    error: userBranchesError,
    refetch: refetchUserBranches,
  } = useUserAddressesQuery(listQueryArgs, { skip: !userMode });

  const [createAgencyBranch, { isLoading: creatingAgencyBranch }] = useCreateAgencyBranchMutation();
  const [updateAgencyBranch, { isLoading: updatingAgencyBranch }] = useUpdateAgencyBranchMutation();
  const [deleteAgencyBranch, { isLoading: deletingAgencyBranch }] = useDeleteAgencyBranchMutation();

  const [createCareHomeBranch, { isLoading: creatingCareHomeBranch }] =
    useCreateCareHomeBranchMutation();
  const [updateCareHomeBranch, { isLoading: updatingCareHomeBranch }] =
    useUpdateCareHomeBranchMutation();
  const [deleteCareHomeBranch, { isLoading: deletingCareHomeBranch }] =
    useDeleteCareHomeBranchMutation();

  const [createHospitalBranch, { isLoading: creatingHospitalBranch }] =
    useCreateHospitalBranchMutation();
  const [updateHospitalBranch, { isLoading: updatingHospitalBranch }] =
    useUpdateHospitalBranchMutation();
  const [deleteHospitalBranch, { isLoading: deletingHospitalBranch }] =
    useDeleteHospitalBranchMutation();

  const [createLocalAuthorityBranch, { isLoading: creatingLocalAuthorityBranch }] =
    useCreateLocalAuthorityBranchMutation();
  const [updateLocalAuthorityBranch, { isLoading: updatingLocalAuthorityBranch }] =
    useUpdateLocalAuthorityBranchMutation();
  const [deleteLocalAuthorityBranch, { isLoading: deletingLocalAuthorityBranch }] =
    useDeleteLocalAuthorityBranchMutation();

  const [createHomeCareCompanyBranch, { isLoading: creatingHomeCareCompanyBranch }] =
    useCreateHomeCareCompanyBranchMutation();
  const [updateHomeCareCompanyBranch, { isLoading: updatingHomeCareCompanyBranch }] =
    useUpdateHomeCareCompanyBranchMutation();
  const [deleteHomeCareCompanyBranch, { isLoading: deletingHomeCareCompanyBranch }] =
    useDeleteHomeCareCompanyBranchMutation();

  const [createUserBranch, { isLoading: creatingUserBranch }] = useCreateUserBranchMutation();
  const [updateUserBranch, { isLoading: updatingUserBranch }] = useUpdateUserBranchMutation();
  const [deleteUserBranch, { isLoading: deletingUserBranch }] = useDeleteUserBranchMutation();

  const apiBranchesData = agencyMode
    ? agencyBranchesData
    : userMode
      ? userBranchesData
      : hospitalMode
        ? hospitalBranchesData
        : localAuthorityMode
          ? localAuthorityBranchesData
          : homeCareCompanyMode
            ? homeCareCompanyBranchesData
            : careHomeBranchesData;
  const apiBranches = apiBranchesData?.data || [];
  const apiBranchesError = agencyMode
    ? agencyBranchesError
    : userMode
      ? userBranchesError
      : hospitalMode
        ? hospitalBranchesError
        : localAuthorityMode
          ? localAuthorityBranchesError
          : homeCareCompanyMode
            ? homeCareCompanyBranchesError
            : careHomeBranchesError;
  const refetchApiBranches = agencyMode
    ? refetchAgencyBranches
    : userMode
      ? refetchUserBranches
      : hospitalMode
        ? refetchHospitalBranches
        : localAuthorityMode
          ? refetchLocalAuthorityBranches
          : homeCareCompanyMode
            ? refetchHomeCareCompanyBranches
            : refetchCareHomeBranches;

  // API only — no localStorage / demo branch list.
  const countSourceList = useMemo(() => apiBranches, [apiBranches]);

  const branchTabCounts = useMemo(() => {
    const counts = { all: 0, active: 0, pending: 0, inactive: 0, deleted: 0 };
    countSourceList.forEach((branch) => {
      const raw = String(branch.status || 'active').toLowerCase();
      counts.all += 1;
      if (isDeletedBranchStatus(raw)) {
        counts.deleted += 1;
      } else if (raw === 'inactive') {
        counts.inactive += 1;
      } else if (raw === 'pending') {
        counts.pending += 1;
      } else {
        counts.active += 1;
      }
    });
    return counts;
  }, [countSourceList]);

  const filteredBranches = useMemo(
    () => applyBranchFilter({ inputData: apiBranches, filters: filters.state }),
    [apiBranches, filters.state]
  );

  const visibleBranches = useMemo(() => {
    const start = table.page * table.rowsPerPage;
    return filteredBranches.slice(start, start + table.rowsPerPage);
  }, [filteredBranches, table.page, table.rowsPerPage]);

  const apiTotalCount = filteredBranches.length;

  const tableHead = apiMode
    ? userMode
      ? [
        { id: 'profile', label: 'Profile', width: 72 },
        { id: 'name', label: 'Title', width: 160 },
        { id: 'fullAddress', label: 'Full address' },
        { id: 'city', label: 'City', width: 120 },
        { id: 'country', label: 'Country', width: 120 },
        { id: 'status', label: 'Status', width: 110 },
        { id: 'action', label: 'Action', width: 100, align: 'right' },
      ]
      : homeCareCompanyMode
        ? HCC_TABLE_HEAD
        : API_TABLE_HEAD
    : API_TABLE_HEAD;
  const listLoading =
    (agencyMode && loadingAgencyBranches) ||
    (careHomeMode && loadingCareHomeBranches) ||
    (hospitalMode && loadingHospitalBranches) ||
    (localAuthorityMode && loadingLocalAuthorityBranches) ||
    (homeCareCompanyMode && loadingHomeCareCompanyBranches) ||
    (userMode && loadingUserBranches);

  useEffect(() => {
    if (listLoading) return;
    setStatusCountCache((prev) => ({
      ...prev,
      ...branchTabCounts,
    }));
  }, [branchTabCounts, listLoading]);

  const statusCounts = statusCountCache;
  const apiBusy =
    creatingAgencyBranch ||
    updatingAgencyBranch ||
    creatingCareHomeBranch ||
    updatingCareHomeBranch ||
    creatingHospitalBranch ||
    updatingHospitalBranch ||
    creatingLocalAuthorityBranch ||
    updatingLocalAuthorityBranch ||
    creatingHomeCareCompanyBranch ||
    updatingHomeCareCompanyBranch ||
    creatingUserBranch ||
    updatingUserBranch;
  const deleteBusy =
    deletingAgencyBranch ||
    deletingCareHomeBranch ||
    deletingHospitalBranch ||
    deletingLocalAuthorityBranch ||
    deletingHomeCareCompanyBranch ||
    deletingUserBranch;

  const handleOpenAdd = useCallback(() => {
    setEditingBranch(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (branch) => {
      setEditingBranch(branch);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleFormSubmit = useCallback(
    async (data) => {
      if (!apiMode) {
        toast.error('Locations are not available for this account.');
        throw new Error('Locations unavailable');
      }

      const payload = userMode ? buildUserAddressPayload(data) : buildAgencyBranchPayload(data);

      if (!editingBranch) {
        try {
          if (agencyMode) {
            await createAgencyBranch(payload).unwrap();
          } else if (userMode) {
            await createUserBranch(payload).unwrap();
          } else if (hospitalMode) {
            await createHospitalBranch(payload).unwrap();
          } else if (localAuthorityMode) {
            await createLocalAuthorityBranch(payload).unwrap();
          } else if (homeCareCompanyMode) {
            await createHomeCareCompanyBranch(payload).unwrap();
          } else {
            await createCareHomeBranch(payload).unwrap();
          }
          await refetchApiBranches();
          toast.success('Location added');
        } catch (error) {
          toast.error(
            error?.data?.message ||
            error?.error ||
            'Failed to add location'
          );
          throw error;
        }
        return;
      }

      const branchId = getAgencyBranchMongoId(editingBranch);
      if (!branchId) {
        toast.error('Invalid location id. Cannot update on API.');
        throw new Error('Invalid location id');
      }

      const updatePayload = userMode
        ? buildUserAddressUpdatePayload(data)
        : buildAgencyBranchUpdatePayload(data);

      try {
        if (agencyMode) {
          await updateAgencyBranch({ id: branchId, ...updatePayload }).unwrap();
        } else if (userMode) {
          await updateUserBranch({ id: branchId, ...updatePayload }).unwrap();
        } else if (hospitalMode) {
          await updateHospitalBranch({ id: branchId, ...updatePayload }).unwrap();
        } else if (localAuthorityMode) {
          await updateLocalAuthorityBranch({ id: branchId, ...updatePayload }).unwrap();
        } else if (homeCareCompanyMode) {
          await updateHomeCareCompanyBranch({ id: branchId, ...updatePayload }).unwrap();
        } else {
          await updateCareHomeBranch({ id: branchId, ...updatePayload }).unwrap();
        }
        await refetchApiBranches();
        toast.success('Location updated');
      } catch (error) {
        toast.error(
          error?.data?.message ||
          error?.error ||
          'Failed to update location'
        );
        throw error;
      }
    },
    [
      agencyMode,
      apiMode,
      createAgencyBranch,
      createCareHomeBranch,
      createHomeCareCompanyBranch,
      createHospitalBranch,
      createLocalAuthorityBranch,
      createUserBranch,
      editingBranch,
      homeCareCompanyMode,
      hospitalMode,
      localAuthorityMode,
      refetchApiBranches,
      updateAgencyBranch,
      updateCareHomeBranch,
      updateHomeCareCompanyBranch,
      updateHospitalBranch,
      updateLocalAuthorityBranch,
      updateUserBranch,
      userMode,
    ]
  );

  const handleDeleteClick = useCallback(
    (branch) => {
      setBranchToDelete(branch);
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!branchToDelete) return;

    if (!apiMode) {
      toast.error('Locations are not available for this account.');
      return;
    }

    const branchId = getAgencyBranchMongoId(branchToDelete);

    if (!branchId) {
      toast.error('Invalid location id. This row is not linked to the API.');
      return;
    }

    try {
      if (agencyMode) {
        await deleteAgencyBranch(branchId).unwrap();
      } else if (userMode) {
        await deleteUserBranch(branchId).unwrap();
      } else if (hospitalMode) {
        await deleteHospitalBranch(branchId).unwrap();
      } else if (localAuthorityMode) {
        await deleteLocalAuthorityBranch(branchId).unwrap();
      } else if (homeCareCompanyMode) {
        await deleteHomeCareCompanyBranch(branchId).unwrap();
      } else {
        await deleteCareHomeBranch(branchId).unwrap();
      }
      await refetchApiBranches();
      table.onUpdatePageDeleteRow(visibleBranches.length);
      toast.success('Location deleted');
      setBranchToDelete(null);
      deleteDialog.onFalse();
    } catch (error) {
      toast.error(
        error?.data?.message ||
        error?.error ||
        'Failed to delete location'
      );
    }
  }, [
    agencyMode,
    apiMode,
    branchToDelete,
    deleteAgencyBranch,
    deleteCareHomeBranch,
    deleteHomeCareCompanyBranch,
    deleteHospitalBranch,
    deleteLocalAuthorityBranch,
    deleteUserBranch,
    deleteDialog,
    homeCareCompanyMode,
    hospitalMode,
    localAuthorityMode,
    refetchApiBranches,
    table,
    userMode,
    visibleBranches.length,
  ]);

  const notFound = useMemo(
    () => !listLoading && !visibleBranches.length,
    [listLoading, visibleBranches.length]
  );

  return (
    <>
      <DashboardContent maxWidth={false}>
        <CustomBreadcrumbs
          heading={entityLabelPlural}
          links={[{ name: 'Dashboard', href: dashboardHref }, { name: entityLabelPlural }]}
          action={
            viewOnly ? null : (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenAdd}
              >
                Add {entityLabel}
              </Button>
            )
          }
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        <Card sx={{ width: 1 }}>
          {listLoading && !visibleBranches.length ? <ModuleLoading /> : null}

          <BranchTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            branchList={countSourceList}
            statusCounts={statusCounts}
            searchPlaceholder="Search locations..."
          />

          {apiMode && apiBranchesError ? (
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Typography color="error" variant="body2">
                {apiBranchesError?.data?.message ||
                  apiBranchesError?.error ||
                  'Could not load locations. Please try again.'}
              </Typography>
            </Box>
          ) : null}

          <Scrollbar>
            <Table
              size="small"
              sx={{
                width: 1,
                minWidth: apiMode ? 960 : 720,
                tableLayout: 'auto',
                '& .MuiTableCell-root': {
                  py: 1,
                  px: 2,
                  verticalAlign: 'middle',
                },
                '& .MuiTableCell-head': {
                  py: 1.25,
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableHeadCustom headLabel={tableHead} />

              <TableBody>
                {!listLoading &&
                  visibleBranches.map((branch) => (
                    <TableRow key={branch.id || branch._id} hover>
                      {apiMode ? (
                        <>
                          <TableCell sx={{ width: 72 }}>
                            <BranchProfileCell branch={branch} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography
                              variant="subtitle2"
                              onClick={
                                siteSwitcherEnabled ? () => handleOpenSite(branch) : undefined
                              }
                              sx={{
                                fontSize: 13,
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                                ...(siteSwitcherEnabled
                                  ? { cursor: 'pointer', '&:hover': { color: 'primary.main' } }
                                  : null),
                              }}
                            >
                              {branch.name || branch.branchName || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}
                            >
                              {branch.location?.fullAddress || getLocationLabel(branch)}
                            </Typography>
                          </TableCell>
                          {homeCareCompanyMode ? (
                            <TableCell>
                              {branch.cqcRegistered ? (
                                <Stack spacing={0.25}>
                                  <Chip
                                    size="small"
                                    color="success"
                                    label="CQC registered"
                                    sx={{ height: 22, fontSize: 11, fontWeight: 600, width: 'fit-content' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {getCqcRatingLabel(branch.cqcRating)}
                                  </Typography>
                                </Stack>
                              ) : (
                                <Chip
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  label="Not verified"
                                  sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                                />
                              )}
                            </TableCell>
                          ) : null}
                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                            {branch.location?.city || '—'}
                          </TableCell>
                          {!homeCareCompanyMode ? (
                            <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                              {branch.location?.country || '—'}
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Chip
                              size="small"
                              label={branch.status}
                              color={statusChipColor(branch.status)}
                              sx={{
                                height: 22,
                                fontSize: 11,
                                textTransform: 'capitalize',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}
                            >
                              {branch.branchName || branch.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}
                            >
                              {getLocationLabel(branch)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={branch.status}
                              color={statusChipColor(branch.status)}
                              sx={{
                                height: 22,
                                fontSize: 11,
                                textTransform: 'capitalize',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="soft"
                              color={branch.isActive ? 'success' : 'default'}
                              label={branch.isActive ? 'Yes' : 'No'}
                              sx={{ height: 22, fontSize: 11 }}
                            />
                          </TableCell>
                        </>
                      )}

                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: 148 }}>
                        {siteSwitcherEnabled ? (
                          <Tooltip title={`Go to this ${entityLabel.toLowerCase()}`} arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenSite(branch)}
                            >
                              <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        {viewOnly ? null : (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(branch)}>
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {viewOnly || isDeletedBranchStatus(branch.status) ? null : (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(branch)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>

          {apiMode ? (
            <TablePaginationCustom
              page={table.page}
              count={apiTotalCount}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              rowsPerPageOptions={API_BRANCH_ROWS_PER_PAGE_OPTIONS}
            />
          ) : null}
        </Card>
      </DashboardContent>

      <BranchFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        currentBranch={editingBranch}
        onSubmit={handleFormSubmit}
        submitting={apiBusy}
        entityLabel={entityLabel}
        addressOnly={userMode}
        showComplianceFields={homeCareCompanyMode}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteBusy ? undefined : deleteDialog.onFalse}
        title="Delete location"
        content={
          <>
            Are you sure you want to delete{' '}
            <strong>
              {branchToDelete?.name ||
                branchToDelete?.branchName ||
                'this location'}
            </strong>
            ?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteBusy}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}
