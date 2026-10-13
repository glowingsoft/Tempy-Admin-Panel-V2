import { m } from 'framer-motion';
import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import { fCurrency } from 'src/utils/format-number';
import { fToNow } from 'src/utils/format-time';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetNurseStaffRequestsQuery,
  useRespondNurseStaffRequestMutation,
} from 'src/store/Reducer/nurse-staff-requests-api';

import { StaffRequestProfileDialog } from './staff-request-profile-dialog';

function requestMeta(request) {
  const parts = [];

  if (request.specialtyLabel || request.specialty) {
    parts.push(request.specialtyLabel || request.specialty);
  }

  if (request.ratePerHour != null && request.ratePerHour !== '') {
    const amount = fCurrency(request.ratePerHour);
    if (amount) parts.push(`${amount}/hr`);
  }

  if (request.platformPercent != null && request.platformPercent !== '') {
    parts.push(`${request.platformPercent}% platform`);
  }

  return parts.join(' · ');
}

const STATUS_COLOR = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
};

export function StaffRequestsDrawer({ sx, ...other }) {
  const drawer = useBoolean();
  const viewOnly = useViewOnly();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetNurseStaffRequestsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [respond, respondState] = useRespondNurseStaffRequestMutation();
  const [activeAction, setActiveAction] = useState(null);

  const requests = data?.data || [];
  const pendingCount = data?.pendingCount ?? requests.filter((item) => item.canRespond).length;

  const handleRespond = useCallback(
    async (request, action) => {
      if (!request?.id || !request.canRespond) return;

      setActiveAction({ id: request.id, action });
      try {
        const response = await respond({ id: request.id, action }).unwrap();
        toast.success(
          response?.message ||
          (action === 'reject' ? 'Staff request rejected' : 'Staff request accepted')
        );
        setSelectedRequest(null);
        refetch();
      } catch (err) {
        toast.error(
          handleApiError(err) ||
          (action === 'reject' ? 'Could not reject staff request' : 'Could not accept staff request')
        );
      } finally {
        setActiveAction(null);
      }
    },
    [refetch, respond]
  );

  const handleAccept = useCallback((request) => handleRespond(request, 'accept'), [handleRespond]);

  const handleReject = useCallback((request) => handleRespond(request, 'reject'), [handleRespond]);

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Staff requests
      </Typography>

      <IconButton onClick={() => refetch()} disabled={isFetching}>
        <Iconify icon="eva:refresh-fill" />
      </IconButton>

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderList = (
    <Scrollbar>
      {isLoading ? (
        <LinearProgress sx={{ borderRadius: 0, height: 2 }} />
      ) : isError ? (
        <EmptyContent
          filled
          title="Could not load staff requests"
          action={
            <Button onClick={() => refetch()} startIcon={<Iconify icon="eva:refresh-fill" />}>
              Retry
            </Button>
          }
          sx={{ py: 6 }}
        />
      ) : !requests.length ? (
        <EmptyContent filled title="No staff requests" sx={{ py: 6 }} />
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {requests.map((request) => (
            <Box
              component="li"
              key={request.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRequest(request)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedRequest(request);
                }
              }}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <Avatar
                    src={request.avatarUrl || undefined}
                    alt={request.agencyName}
                    sx={{ width: 44, height: 44, flexShrink: 0 }}
                  >
                    {request.agencyName?.[0]}
                  </Avatar>

                  <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {request.agencyName}
                      </Typography>
                      <Label
                        variant="soft"
                        color={STATUS_COLOR[request.status] || 'default'}
                        sx={{ textTransform: 'capitalize', flexShrink: 0 }}
                      >
                        {request.status}
                      </Label>
                    </Stack>

                    {request.email ? (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {request.email}
                      </Typography>
                    ) : null}

                    {request.message ? (
                      <Typography variant="body2" color="text.secondary">
                        {request.message}
                      </Typography>
                    ) : null}

                    {requestMeta(request) ? (
                      <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {requestMeta(request)}
                      </Typography>
                    ) : null}

                    {request.createdAt ? (
                      <Typography variant="caption" color="text.disabled">
                        {fToNow(request.createdAt)}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>

                {request.canRespond && !viewOnly ? (
                  <Stack direction="row" spacing={1}>
                    <LoadingButton
                      size="small"
                      variant="contained"
                      color="success"
                      loading={
                        respondState.isLoading &&
                        activeAction?.id === request.id &&
                        activeAction?.action === 'accept'
                      }
                      disabled={respondState.isLoading && activeAction?.id === request.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAccept(request);
                      }}
                      startIcon={<Iconify icon="solar:check-circle-bold" width={18} />}
                    >
                      Accept
                    </LoadingButton>

                    <LoadingButton
                      size="small"
                      variant="outlined"
                      color="error"
                      loading={
                        respondState.isLoading &&
                        activeAction?.id === request.id &&
                        activeAction?.action === 'reject'
                      }
                      disabled={respondState.isLoading && activeAction?.id === request.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleReject(request);
                      }}
                      startIcon={<Iconify icon="solar:close-circle-bold" width={18} />}
                    >
                      Reject
                    </LoadingButton>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <>
      <Tooltip title="Staff requests">
        <IconButton
          component={m.button}
          whileTap="tap"
          whileHover="hover"
          variants={varHover(1.05)}
          onClick={drawer.onTrue}
          sx={sx}
          {...other}
        >
          <Badge badgeContent={pendingCount} color="error">
            <Iconify icon="solar:user-plus-bold" width={24} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}
        {renderList}
      </Drawer>

      <StaffRequestProfileDialog
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        responding={Boolean(respondState.isLoading && selectedRequest && activeAction?.id === selectedRequest.id)}
        activeAction={
          selectedRequest && activeAction?.id === selectedRequest.id ? activeAction.action : ''
        }
        viewOnly={viewOnly}
      />
    </>
  );
}
