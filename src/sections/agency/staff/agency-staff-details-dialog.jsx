import { useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';


import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { isDeletedStatus } from 'src/utils/status-counts';

import {
  useDeleteAgencyStaffMutation,
  useGetAgencyStaffByIdQuery,
} from 'src/store/Reducer/agency-staff-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { AgencyStaffDetailsContent } from './agency-staff-details-content';

// ----------------------------------------------------------------------

function hasDocuments(documents) {
  return Boolean(
    documents?.governmentId?.length ||
    documents?.nursingDegree?.length ||
    documents?.certifications?.length
  );
}

function pickPreferred(detailValue, listValue) {
  if (detailValue == null || detailValue === '') return listValue ?? '';
  return detailValue;
}

export function AgencyStaffDetailsDialog({ open, onClose, staff, onDeleted }) {
  // Admin viewing the account cannot delete staff.
  const viewOnly = useViewOnly();
  const confirm = useBoolean();
  const [deleteAgencyStaff, { isLoading: deleting }] = useDeleteAgencyStaffMutation();

  // Detail GET expects linked nurse/staff user id (not always the membership _id).
  const detailLookupId = useMemo(() => {
    if (!open || !staff) return '';
    return String(staff.staffId || staff.membershipId || staff.id || '').trim();
  }, [open, staff]);

  const membershipId = open && staff?.id ? String(staff.id) : '';

  const {
    data: detailByStaffId,
    isLoading: loadingByStaffId,
    isFetching: fetchingByStaffId,
    isSuccess: successByStaffId,
    isError: errorByStaffId,
  } = useGetAgencyStaffByIdQuery(detailLookupId, {
    skip: !detailLookupId,
  });

  // If nurse id failed / same as membership, don't double-call; otherwise retry membership id.
  const membershipFallbackId =
    membershipId && membershipId !== detailLookupId && errorByStaffId ? membershipId : '';

  const {
    data: detailByMembershipId,
    isLoading: loadingByMembershipId,
    isFetching: fetchingByMembershipId,
    isSuccess: successByMembershipId,
  } = useGetAgencyStaffByIdQuery(membershipFallbackId, {
    skip: !membershipFallbackId,
  });

  const detailStaff = successByStaffId
    ? detailByStaffId
    : successByMembershipId
      ? detailByMembershipId
      : undefined;
  const detailSuccess = successByStaffId || successByMembershipId;
  const detailBusy =
    loadingByStaffId || fetchingByStaffId || loadingByMembershipId || fetchingByMembershipId;

  const currentStaff = useMemo(() => {
    if (!staff) return null;

    if (!detailSuccess || !detailStaff) return staff;

    return {
      ...staff,
      ...detailStaff,
      // Keep list membership id for DELETE
      id: staff.id || detailStaff.id,
      membershipId: staff.membershipId || staff.id || detailStaff.membershipId,
      staffId: staff.staffId || detailStaff.staffId || '',
      taxNumber: pickPreferred(detailStaff.taxNumber, staff.taxNumber),
      gender: pickPreferred(detailStaff.gender, staff.gender),
      branch: pickPreferred(detailStaff.branch, staff.branch),
      branchName: pickPreferred(detailStaff.branchName, staff.branchName),
      documents: hasDocuments(detailStaff.documents) ? detailStaff.documents : staff.documents,
      reviews: detailStaff.reviews?.length ? detailStaff.reviews : staff.reviews || [],
      jobs: detailStaff.jobs || staff.jobs,
      metrics: detailStaff.metrics || staff.metrics,
    };
  }, [detailStaff, detailSuccess, staff]);

  const busy = deleting;
  const isDeleted = isDeletedStatus(currentStaff?.status);

  const handleDelete = useCallback(async () => {
    if (!currentStaff?.id || busy) return;

    try {
      await deleteAgencyStaff(currentStaff.id).unwrap();
      toast.success('Staff deleted successfully!');
      confirm.onFalse();
      onDeleted?.(currentStaff.id);
      onClose?.();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || 'Failed to delete staff');
    }
  }, [busy, confirm, currentStaff, deleteAgencyStaff, onClose, onDeleted]);

  if (!currentStaff) return null;

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={open}
        onClose={busy ? undefined : onClose}
        scroll="paper"
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3, py: 2, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={onClose} disabled={busy}>
              <Iconify icon="eva:arrow-ios-back-fill" />
            </IconButton>
            <Typography variant="h6">Staff details</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {isDeleted || viewOnly ? null : (
              <IconButton color="error" onClick={confirm.onTrue} disabled={busy} aria-label="Delete">
                {deleting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Iconify icon="solar:trash-bin-trash-bold" />
                )}
              </IconButton>
            )}

            <IconButton aria-label="Close staff details" onClick={onClose} disabled={busy}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </Stack>

        <DialogContent sx={{ p: 3 }}>
          {detailBusy && !detailSuccess ? (
            <ModuleLoading sx={{ py: 6 }} />
          ) : (
            <AgencyStaffDetailsContent staff={currentStaff} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={busy ? undefined : confirm.onFalse}
        title="Delete Staff"
        content={
          <>
            Are you sure you want to delete <strong>{currentStaff.name}</strong>? This action cannot
            be undone.
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={busy}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
