import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  buildDirectChatUrl,
  getBidderMessagesPath,
  getPosterParticipantFromAgencyBid,
} from 'src/sections/messaging/open-direct-chat';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';
import { useSetState } from 'src/hooks/use-set-state';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { AGENCY_BID_TABS } from 'src/_mock/_agency-bids';
import { useGetAgencyBidsQuery, useUpdateAgencyBidMutation } from 'src/store/Reducer/agency-bids-api';
import {
  useGetHomeCareCompanyBidsQuery,
  useUpdateHomeCareCompanyBidMutation,
} from 'src/store/Reducer/home-care-company-bids-api';
import { useGetNurseBidsQuery, useUpdateNurseBidMutation } from 'src/store/Reducer/nurse-bids-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TableHeadCustom, TablePaginationCustom, useTable } from 'src/components/table';
import { JobMediaThumb } from 'src/components/jobs/job-image';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { getUserIdentityIds } from 'src/components/shifts/self-only-rota';

import { AgencyBidDetailDialog } from '../agency-bid-detail-dialog';
import { AgencyBidEditDialog } from '../agency-bid-edit-dialog';
import { AgencyBidTableToolbar } from '../agency-bid-table-toolbar';
import { canReofferBid, formatBidDeadlineLabel } from '../bids-actions';
import {
  canEditAgencyBid,
  canWithdrawAgencyBid,
  filterBidsOwnedByUser,
  normalizeAgencyBidStatus,
} from '../agency-bid-api-utils';
import { selectUser } from 'src/store/slices/userSlice';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'job', label: 'Job' },
  { id: 'schedule', label: 'Date & Time' },
  { id: 'location', label: 'Location' },
  { id: 'customer', label: 'Customer' },
  { id: 'amount', label: 'Bid amount', align: 'center' },
  { id: 'status', label: 'Status' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'actions', label: '', align: 'right' },
];

const STATUS_COLOR = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  deleted: 'default',
  withdraw: 'warning',
  cancelledByWorker: 'error',
  cancelledByEmployer: 'error',
  cancelledByUser: 'error',
};

const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  deleted: 'Deleted',
  withdraw: 'Withdraw',
  cancelledByWorker: 'Cancelled by worker',
  cancelledByEmployer: 'Cancelled by employer',
  cancelledByUser: 'Cancelled by user',
};

function compareBidsByNewest(a, b) {
  const tsA = a.createdAt || a.submittedDate || a.updatedDate || '';
  const tsB = b.createdAt || b.submittedDate || b.updatedDate || '';
  const byTime = String(tsB).localeCompare(String(tsA));
  if (byTime !== 0) return byTime;
  return String(b.id || '').localeCompare(String(a.id || ''));
}

function applyFilter({ inputData, filters }) {
  const { name, status } = filters;

  let data = inputData;

  if (status && status !== 'all') {
    data = data.filter((bid) => normalizeAgencyBidStatus(bid.status) === status);
  }

  if (!name?.trim()) {
    return [...data].sort(compareBidsByNewest);
  }

  const query = name.trim().toLowerCase();

  return data
    .filter(
      (bid) =>
        (bid.jobTitle || '').toLowerCase().includes(query) ||
        (bid.careHome || '').toLowerCase().includes(query) ||
        (bid.jobRef || '').toLowerCase().includes(query) ||
        (bid.address || '').toLowerCase().includes(query)
    )
    .sort(compareBidsByNewest);
}

// ----------------------------------------------------------------------

export function AgencyBidsView({ mode = 'agency' }) {
  // Admin viewing this account: bids can be looked at, not edited or withdrawn.
  const viewOnly = useViewOnly();
  const router = useRouter();
  const isHomeCareCompany = mode === 'homeCareCompany';
  const isStaffMember = mode === 'staffMember';
  const dashboardRoot = isStaffMember
    ? paths.dashboard.staffMember.root
    : isHomeCareCompany
      ? paths.dashboard.homeCareCompany.root
      : paths.dashboard.agency.root;

  const currentUserId = useSelector((state) => {
    const impersonation = state?.impersonation;
    if (impersonation?.isActive && impersonation?.targetId) {
      return String(impersonation.targetId).trim();
    }
    return getProfileUserId(state?.user?.user);
  });
  const sessionUser = useSelector(selectUser);
  const isImpersonating = useSelector((state) => Boolean(state?.impersonation?.isActive));

  // Admin impersonation may resolve list id ≠ bid.user id — allow every known identity.
  const ownerUserIds = useMemo(() => {
    const ids = new Set(getUserIdentityIds(sessionUser));
    if (currentUserId) ids.add(String(currentUserId));
    return Array.from(ids);
  }, [currentUserId, sessionUser]);

  const detailDialog = useBoolean();
  const editDialog = useBoolean();
  const withdrawDialog = useBoolean();

  const filters = useSetState({ name: '', status: 'all' });
  const table = useTable({ defaultRowsPerPage: 10 });

  const [selectedBid, setSelectedBid] = useState(null);
  const [editingBid, setEditingBid] = useState(null);
  const [bidToWithdraw, setBidToWithdraw] = useState(null);

  const bidsQueryArgs = useMemo(
    () => ({
      page: 0,
      limit: 100,
      // Always load all statuses — filter client-side so dropdown counts stay stable.
      status: '',
      ...(currentUserId
        ? {
          userId: currentUserId,
          // Staff/agency under admin JWT often returns every account's bids.
          requireOwner: isImpersonating || isStaffMember,
        }
        : {}),
    }),
    [currentUserId, isImpersonating, isStaffMember]
  );

  const agencyBidsQuery = useGetAgencyBidsQuery(bidsQueryArgs, {
    skip: isHomeCareCompany || isStaffMember || !currentUserId,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: 60,
  });
  const hccBidsQuery = useGetHomeCareCompanyBidsQuery(bidsQueryArgs, {
    skip: !isHomeCareCompany || !currentUserId,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: 60,
  });
  const nurseBidsQuery = useGetNurseBidsQuery(bidsQueryArgs, {
    skip: !isStaffMember || !currentUserId,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: 60,
  });

  const {
    data: bidsResponse,
    isLoading,
    isError,
    error: bidsError,
    refetch,
  } = isStaffMember ? nurseBidsQuery : isHomeCareCompany ? hccBidsQuery : agencyBidsQuery;

  // Edit and withdraw are both PUT /bids/:id ({ bid, note } or { status: 'withdraw' }).
  const [updateAgencyBidMutation, agencyUpdateState] = useUpdateAgencyBidMutation();
  const [updateHccBidMutation, hccUpdateState] = useUpdateHomeCareCompanyBidMutation();
  const [updateNurseBidMutation, nurseUpdateState] = useUpdateNurseBidMutation();

  const updateAgencyBid = isStaffMember
    ? updateNurseBidMutation
    : isHomeCareCompany
      ? updateHccBidMutation
      : updateAgencyBidMutation;
  const isUpdatingBid = isStaffMember
    ? nurseUpdateState.isLoading
    : isHomeCareCompany
      ? hccUpdateState.isLoading
      : agencyUpdateState.isLoading;

  const bids = useMemo(
    () =>
      filterBidsOwnedByUser(bidsResponse?.data || [], ownerUserIds, {
        // Impersonation OR staff-member: never show another nurse's bids.
        requireOwner: isImpersonating || isStaffMember,
      }),
    [bidsResponse?.data, ownerUserIds, isImpersonating, isStaffMember]
  );
  const bidCountMeta = {};
  const listLoading = isLoading;

  const statusCounts = useMemo(() => {
    const fromList = (status) =>
      bids.filter((bid) => normalizeAgencyBidStatus(bid.status) === status).length;

    return AGENCY_BID_TABS.reduce((acc, tab) => {
      if (tab.value === 'all') {
        acc.all = bids.length;
      } else {
        acc[tab.value] = fromList(tab.value);
      }
      return acc;
    }, {});
  }, [bids]);

  const dataFiltered = useMemo(
    () => applyFilter({ inputData: bids, filters: filters.state }),
    [bids, filters.state]
  );

  useEffect(() => {
    table.onResetPage();
  }, [filters.state.name, filters.state.status, table.onResetPage]);

  const pageCount = Math.max(1, Math.ceil(dataFiltered.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(dataFiltered, safePage, table.rowsPerPage);

  const bidderMessagesPath = useMemo(() => getBidderMessagesPath(mode), [mode]);

  const handleChatWithPoster = useCallback(
    (bid) => {
      const participant = getPosterParticipantFromAgencyBid(bid);
      if (!participant.id) {
        toast.error('Cannot start chat — job poster profile is missing');
        return;
      }
      router.push(buildDirectChatUrl(bidderMessagesPath, participant));
    },
    [bidderMessagesPath, router]
  );

  const handleViewBid = useCallback(
    (bid) => {
      setSelectedBid(bid);
      detailDialog.onTrue();
    },
    [detailDialog]
  );

  const handleCloseDetail = useCallback(() => {
    detailDialog.onFalse();
    setSelectedBid(null);
  }, [detailDialog]);

  const handleWithdrawRequest = useCallback(
    (bid) => {
      if (!canWithdrawAgencyBid(bid)) return;
      setBidToWithdraw(bid);
      withdrawDialog.onTrue();
      detailDialog.onFalse();
      editDialog.onFalse();
    },
    [detailDialog, editDialog, withdrawDialog]
  );

  const handleEditRequest = useCallback(
    (bid) => {
      if (!canEditAgencyBid(bid)) {
        toast.warning('Only pending bids can be edited');
        return;
      }
      setEditingBid(bid);
      editDialog.onTrue();
      detailDialog.onFalse();
    },
    [detailDialog, editDialog]
  );

  const handleCloseEdit = useCallback(() => {
    if (isUpdatingBid) return;
    editDialog.onFalse();
    setEditingBid(null);
  }, [editDialog, isUpdatingBid]);

  const handleSaveEdit = useCallback(
    async (updates) => {
      // Amount / note can change (up or down) while the bid is pending; the backend
      // answers Bid_not_editable otherwise.
      if (!editingBid || !canEditAgencyBid(editingBid)) {
        toast.error('Only pending bids can be edited');
        handleCloseEdit();
        return;
      }

      const bidId = editingBid.id || editingBid._id;

      if (!bidId) {
        toast.error('Missing bid id — cannot update.');
        return;
      }

      try {
        await updateAgencyBid({
          id: bidId,
          bid: Number(updates.bidAmount),
          note: updates.notes ?? editingBid.notes ?? editingBid.note ?? '',
        }).unwrap();

        toast.success(`Bid updated to £${Number(updates.bidAmount).toFixed(2)}`);
        handleCloseEdit();
      } catch (error) {
        const message =
          error?.data?.message ||
          error?.error ||
          (typeof error?.data === 'string' ? error.data : null) ||
          'Failed to update bid. Please try again.';
        toast.error(message);
      }
    },
    [editingBid, handleCloseEdit, updateAgencyBid]
  );

  const handleConfirmWithdraw = useCallback(async () => {
    if (!canWithdrawAgencyBid(bidToWithdraw)) return;

    const bidId = bidToWithdraw.id || bidToWithdraw._id;
    if (!bidId) {
      toast.error('Missing bid id — cannot withdraw.');
      return;
    }

    try {
      await updateAgencyBid({ id: String(bidId), status: 'withdraw' }).unwrap();
      toast.success(`Bid withdrawn for ${bidToWithdraw.jobTitle}`);
      withdrawDialog.onFalse();
      setBidToWithdraw(null);
      setSelectedBid(null);
      setEditingBid(null);
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Failed to withdraw bid. Please try again.';
      toast.error(message);
    }
  }, [bidToWithdraw, updateAgencyBid, withdrawDialog]);

  const handleRowAction = useCallback(
    (bid, action) => {
      if (action === 'view') {
        handleViewBid(bid);
        return;
      }
      if (action === 'edit') {
        handleEditRequest(bid);
      }
      if (action === 'withdraw') {
        handleWithdrawRequest(bid);
      }
    },
    [handleViewBid, handleEditRequest, handleWithdrawRequest]
  );

  return (
    <>
      <DashboardContent maxWidth={false}>
        <CustomBreadcrumbs
          heading="Bids"
          links={[
            { name: 'Dashboard', href: dashboardRoot },
            { name: 'Bids' },
          ]}
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        <Card>
          {listLoading && !bids.length ? <ModuleLoading /> : null}

          <AgencyBidTableToolbar
            filters={filters}
            statusTabs={AGENCY_BID_TABS}
            statusCounts={statusCounts}
          />

          {isError && (
            <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                }
              >
                {bidsError?.data?.message || 'Failed to load bids.'}
              </Alert>
            </Stack>
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 960 }}>
                <TableHeadCustom headLabel={TABLE_HEAD} />

                <TableBody>
                  {dataFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length} sx={{ py: 8 }}>
                        {/* Keep the row height for the loading overlay, but no "empty" copy under it. */}
                        {listLoading ? null : (
                          <Stack alignItems="center" spacing={1}>
                            <Iconify
                              icon="solar:inbox-bold-duotone"
                              width={48}
                              sx={{ color: 'text.disabled' }}
                            />
                            <Typography variant="subtitle1">No bids found</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {filters.state.name
                                ? 'Try a different search term.'
                                : 'No bids in this category yet.'}
                            </Typography>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((bid) => (
                      <TableRow
                        key={bid.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewBid(bid)}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="flex-start" spacing={1}>
                            <JobMediaThumb
                              image={bid.image}
                              alt={bid.jobTitle}
                              width={42}
                              height={42}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2">{bid.jobTitle}</Typography>
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                              >
                                {bid.jobRef}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ mt: 0.5 }}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {bid.hasAgreedRate && (
                                  <Chip
                                    size="small"
                                    color="success"
                                    label="Agreed rate"
                                    sx={{ height: 20, fontSize: 10 }}
                                  />
                                )}
                                {(bid.reofferCount || 0) > 0 && (
                                  <Chip
                                    size="small"
                                    color="warning"
                                    label="Lowered quote"
                                    sx={{ height: 20, fontSize: 10 }}
                                  />
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>
                            {bid.schedule || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                            {bid.address || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{bid.careHome}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="subtitle2">{fCurrency(bid.bidAmount)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fCurrency(bid.hourlyRate)}/hr
                          </Typography>
                          {bid.originalBidAmount != null &&
                            Number(bid.originalBidAmount) > Number(bid.bidAmount) && (
                              <Typography variant="caption" color="success.main" display="block">
                                ↓ from {fCurrency(bid.originalBidAmount)}
                              </Typography>
                            )}
                        </TableCell>
                        <TableCell>
                          <Label
                            color={STATUS_COLOR[normalizeAgencyBidStatus(bid.status)] || 'default'}
                            variant="soft"
                          >
                            {STATUS_LABEL[normalizeAgencyBidStatus(bid.status)] || bid.status}
                          </Label>
                          {bid.status === 'pending' && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 0.35 }}
                              color={canReofferBid(bid) ? 'warning.main' : 'text.disabled'}
                            >
                              {formatBidDeadlineLabel(bid)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{bid.submittedAt}</Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => handleRowAction(bid, 'view')}>
                                <Iconify icon="solar:eye-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                            {normalizeAgencyBidStatus(bid.status) === 'accepted' && (
                              <Tooltip title="Chat with job poster">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleChatWithPoster(bid)}
                                >
                                  <Iconify icon="solar:chat-round-dots-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!viewOnly && canEditAgencyBid(bid) && (
                              <Tooltip title="Edit bid">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleRowAction(bid, 'edit')}
                                >
                                  <Iconify icon="solar:pen-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!viewOnly && canWithdrawAgencyBid(bid) && (
                              <Tooltip title="Withdraw bid">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRowAction(bid, 'withdraw')}
                                >
                                  <Iconify icon="solar:undo-left-round-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>
          <TablePaginationCustom
            page={safePage}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <AgencyBidDetailDialog
        open={detailDialog.value}
        bid={selectedBid}
        onClose={handleCloseDetail}
        onEdit={viewOnly ? undefined : handleEditRequest}
        onWithdraw={viewOnly ? undefined : handleWithdrawRequest}
        onChat={handleChatWithPoster}
      />

      <AgencyBidEditDialog
        open={editDialog.value}
        bid={editingBid}
        mode="edit"
        rateApiBase={isStaffMember ? '/web/nurse' : isHomeCareCompany ? '/web/home-care-company' : '/web/agency'}
        submitting={isUpdatingBid}
        onClose={handleCloseEdit}
        onSubmit={handleSaveEdit}
      />

      <ConfirmDialog
        open={withdrawDialog.value}
        onClose={() => {
          if (isUpdatingBid) return;
          withdrawDialog.onFalse();
        }}
        title="Withdraw bid"
        content={
          <>
            Are you sure you want to withdraw your bid for <strong>{bidToWithdraw?.jobTitle}</strong>{' '}
            at <strong>{bidToWithdraw?.careHome}</strong>?
          </>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={isUpdatingBid}
            onClick={handleConfirmWithdraw}
          >
            Withdraw
          </LoadingButton>
        }
      />
    </>
  );
}
