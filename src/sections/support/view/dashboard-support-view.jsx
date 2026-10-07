import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';
import {
  getSupportTypeLabel,
  resolveSupportAccountKey,
} from 'src/sections/support/support-api-utils';
import { SupportRequestDialog } from 'src/sections/support/support-request-dialog';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TablePaginationCustom, useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { ModuleLoading } from 'src/components/loading-screen';
import { fDateTime } from 'src/utils/format-time';

import {
  useCreateSupportTicketMutation,
  useGetSupportTicketsQuery,
} from 'src/store/Reducer/support-api';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

function statusColor(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'open' || value === 'pending') return 'warning';
  if (value === 'resolved' || value === 'closed' || value === 'done') return 'success';
  return 'default';
}

export function DashboardSupportView() {
  // Admin viewing this account cannot raise support requests for it.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const accountType = user?.accountState?.accountType;
  const permission = user?.permission;
  const accountKey = useMemo(() => resolveSupportAccountKey(user), [user]);

  const [openForm, setOpenForm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    data: supportData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetSupportTicketsQuery(
    { accountKey },
    { skip: !accountKey, refetchOnMountOrArgChange: true }
  );

  const [createSupportTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();

  const items = supportData?.data || [];
  const table = useTable({ defaultRowsPerPage: 10 });
  const pageCount = Math.max(1, Math.ceil(items.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageItems = rowInPage(items, safePage, table.rowsPerPage);
  const firstItemId = pageItems[0]?.id || false;

  useEffect(() => {
    setExpanded(firstItemId);
  }, [firstItemId]);

  const dashboardRoot = getDashboardRootPath(permission, accountType);

  const handleAccordionChange = useCallback(
    (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const handleOpenForm = useCallback(() => {
    if (!accountKey) {
      toast.error('Unable to resolve support route for this account');
      return;
    }
    setOpenForm(true);
  }, [accountKey]);

  const handleCloseForm = useCallback(() => {
    setOpenForm(false);
  }, []);

  const handleSubmit = useCallback(
    async ({ subject, message }) => {
      if (!accountKey) {
        toast.error('Unable to resolve support route for this account');
        return;
      }

      try {
        await createSupportTicket({ accountKey, subject, message }).unwrap();
        toast.success('Support request submitted');
        setOpenForm(false);
      } catch (err) {
        toast.error(err?.data?.message || err?.error || 'Failed to submit support request');
      }
    },
    [accountKey, createSupportTicket]
  );

  const listErrorMessage =
    error?.data?.message || error?.error || 'Failed to load support requests';

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3 }}>
      <CustomBreadcrumbs
        heading="Support"
        links={[
          { name: 'Dashboard', href: dashboardRoot || paths.dashboard.root },
          { name: 'Support' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenForm}
            disabled={!accountKey}
            style={viewOnly ? { display: 'none' } : undefined}
          >
            Add request
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Review your support tickets for {getSupportTypeLabel(accountType) || 'your'} account, or
          add a new request.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            border: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          <Chip
            icon={<Iconify icon="solar:letter-bold" width={16} />}
            label="info@tempy.com"
            variant="soft"
            color="primary"
          />
          <Typography variant="caption" color="text.secondary">
            24/7 care-sector support
          </Typography>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="subtitle1">Your requests</Typography>
        {isLoading ? <ModuleLoading /> : isFetching ? <LinearProgress sx={{ borderRadius: 0, height: 2 }} /> : null}

        {isError ? (
          <Stack
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 6, borderRadius: 2, bgcolor: 'background.neutral' }}
          >
            <Iconify icon="solar:danger-triangle-bold" width={36} sx={{ color: 'error.main' }} />
            <Typography variant="subtitle1">Could not load support</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {listErrorMessage}
            </Typography>
          </Stack>
        ) : isLoading ? null : items.length ? (
          <Stack spacing={2}>
          {pageItems.map((item) => (
            <Accordion
              key={item.id}
              expanded={expanded === item.id}
              onChange={handleAccordionChange(item.id)}
              sx={{ overflow: 'hidden' }}
            >
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  sx={{ width: 1, pr: 1, minWidth: 0 }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {item.subject || 'Support request'}
                    </Typography>
                    {(item.updatedAt || item.createdAt) && (
                      <Typography variant="caption" color="text.disabled">
                        {item.updatedAt ? 'Updated' : 'Created'}{' '}
                        {fDateTime(item.updatedAt || item.createdAt)}
                      </Typography>
                    )}
                  </Box>
                  <Label
                    variant="soft"
                    color={statusColor(item.status)}
                    sx={{ textTransform: 'capitalize', flexShrink: 0 }}
                  >
                    {item.status || 'open'}
                  </Label>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.message}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          <TablePaginationCustom
            page={safePage}
            count={items.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
          </Stack>
        ) : (
          <Stack
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 8, borderRadius: 2, bgcolor: 'background.neutral' }}
          >
            <Iconify icon="solar:chat-round-dots-bold" width={40} sx={{ color: 'text.disabled' }} />
            <Typography variant="subtitle1">No support requests yet</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Click “Add request” to create your first ticket.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenForm}
              disabled={!accountKey}
              style={viewOnly ? { display: 'none' } : undefined}
              sx={{ mt: 1 }}
            >
              Add request
            </Button>
          </Stack>
        )}
      </Stack>

      <SupportRequestDialog
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
      />
    </Box>
  );
}
