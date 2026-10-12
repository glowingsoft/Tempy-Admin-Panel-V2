import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fDate, fToNow } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { ModuleLoading } from 'src/components/loading-screen';

import { DashboardStatCard } from 'src/sections/dashboard/dashboard-stat-card';

import { useGetAdminAllegationByIdQuery } from 'src/store/Reducer/admin-allegations-api';

import {
  ALLEGATION_FEED,
  ALLEGATION_SCREEN_CARDS,
  SHIFT_ACTION_STATUS,
  getAllegationStatusOption,
  getAllegationTypeLabel,
  getAllowedAllegationStatuses,
  getShiftActionStatusOption,
} from '../admin-allegations-constants';
import { useAdminAllegations } from '../use-admin-allegations';
import { ReallocateShiftDialog } from '../reallocate-shift-dialog';

// ----------------------------------------------------------------------

const ALLEGATION_TABLE_HEAD = [
  { id: 'worker', label: 'Worker' },
  { id: 'employer', label: 'Employer' },
  { id: 'type', label: 'Type', width: 160 },
  { id: 'status', label: 'Status', width: 160 },
  { id: 'shifts', label: 'Shifts to action', width: 120, align: 'center' },
  { id: 'raised', label: 'Raised', width: 120 },
];

const FEED_TABLE_HEAD = [
  { id: 'person', label: 'Person' },
  { id: 'account', label: 'Account', width: 180 },
  { id: 'detail', label: 'Detail' },
  { id: 'when', label: 'When', width: 140 },
];

const SHIFT_TABLE_HEAD = [
  { id: 'ref', label: 'Shift', width: 100 },
  { id: 'when', label: 'Date & time', width: 160 },
  { id: 'location', label: 'Location' },
  { id: 'role', label: 'Role', width: 140 },
  { id: 'status', label: 'Status', width: 140 },
  { id: 'replacement', label: 'Replacement', width: 160 },
  { id: 'action', label: 'Action', width: 260, align: 'right' },
];

function apiMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

// ----------------------------------------------------------------------

export function AdminAllegationsView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [screen, setScreen] = useState(ALLEGATION_FEED.RAISED);
  const [selectedAllegationId, setSelectedAllegationId] = useState('');
  const [reallocateState, setReallocateState] = useState({
    open: false,
    shift: null,
    workers: [],
    error: '',
  });

  useEffect(() => {
    const next = search.trim();
    if (next === keyword) return undefined;
    const timer = setTimeout(() => {
      setKeyword(next);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, search]);

  const {
    allegations,
    hasTotal,
    serverTotal,
    isLoading,
    isError,
    error,
    summary,
    setAllegationStatus,
    reallocate,
    republish,
    fetchReplacements,
    updatingStatus,
    reallocating,
    republishing,
    loadingReplacements,
  } = useAdminAllegations({
    page,
    limit: rowsPerPage,
    status: statusFilter,
    keyword,
    type: screen,
  });

  const clientPaged = allegations.length > rowsPerPage;
  const visibleAllegations = clientPaged
    ? allegations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : allegations;
  const count = clientPaged
    ? allegations.length
    : hasTotal
      ? serverTotal
      : allegations.length < rowsPerPage
        ? page * rowsPerPage + allegations.length
        : page * rowsPerPage + allegations.length + 1;
  const pagerCount = Math.max(count, page * rowsPerPage + (visibleAllegations.length || (page > 0 ? 1 : 0)));

  const isRaisedScreen = screen === ALLEGATION_FEED.RAISED;
  const screenCard = ALLEGATION_SCREEN_CARDS.find((card) => card.value === screen) || ALLEGATION_SCREEN_CARDS[0];

  const { data: allegationDetail } = useGetAdminAllegationByIdQuery(selectedAllegationId, {
    skip: !isRaisedScreen || !selectedAllegationId,
  });

  const selectedAllegation = useMemo(() => {
    const fromList = allegations.find((row) => row.id === selectedAllegationId) || null;
    if (!allegationDetail?.id) return fromList;
    return {
      ...fromList,
      ...allegationDetail,
      affectedShifts: allegationDetail.affectedShifts?.length
        ? allegationDetail.affectedShifts
        : fromList?.affectedShifts || [],
    };
  }, [allegationDetail, allegations, selectedAllegationId]);

  const pendingShifts = useMemo(
    () =>
      (selectedAllegation?.affectedShifts || []).filter(
        (shift) => shift.status === SHIFT_ACTION_STATUS.NEEDS_REALLOCATION
      ),
    [selectedAllegation]
  );

  const handleStatusChange = async (row, nextStatus) => {
    if (nextStatus === row.status) return;
    try {
      await setAllegationStatus(row.id, nextStatus);
      toast.success('Allegation status updated');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update the allegation status'));
    }
  };

  const handleOpenReallocate = async (shift) => {
    const allegationId = selectedAllegation?.id || selectedAllegationId;
    if (!allegationId || !shift?.id) return;

    if (shift.needsRepublish) {
      setReallocateState({
        open: true,
        shift,
        workers: [],
        error: 'This shift was won by the worker directly, so it can only be republished.',
      });
      return;
    }

    setReallocateState({ open: true, shift, workers: [], error: '' });
    try {
      const workers = await fetchReplacements(allegationId, shift.id);
      setReallocateState((current) => {
        if (!current.open || current.shift?.id !== shift.id) return current;
        return { open: true, shift, workers: workers || [], error: '' };
      });
    } catch (err) {
      setReallocateState((current) => {
        if (!current.open || current.shift?.id !== shift.id) return current;
        return {
          open: true,
          shift,
          workers: [],
          error: apiMessage(err, 'Could not load replacement workers.'),
        };
      });
    }
  };

  const handleConfirmReallocate = async (worker) => {
    if (!selectedAllegation?.id || !reallocateState.shift?.id || !worker?.id) return;
    try {
      await reallocate(selectedAllegation.id, reallocateState.shift.id, worker.id);
      toast.success(`${worker.name} gets a pending booking and must accept it.`);
      setReallocateState({ open: false, shift: null, workers: [], error: '' });
    } catch (err) {
      toast.error(apiMessage(err, 'Could not re-allocate this shift.'));
    }
  };

  const handleRepublish = async (shift) => {
    if (!selectedAllegation) return;
    try {
      await republish(selectedAllegation.id, shift.id);
      toast.success('Shift re-published so other suppliers can bid');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not re-publish this shift'));
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Allegations & suspensions"
        links={[
          { name: 'Dashboard', href: paths.adminDashboard.root },
          { name: 'Allegations' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        {ALLEGATION_SCREEN_CARDS.map((card) => {
          const selected = screen === card.value;
          return (
            <Box key={card.value} sx={{ flex: 1, minWidth: { sm: 180 } }}>
              <DashboardStatCard
                title={card.title}
                total={summary[card.value] || 0}
                icon={card.icon}
                color={card.color}
                onClick={() => {
                  setScreen(card.value);
                  setPage(0);
                  setStatusFilter('all');
                  setSelectedAllegationId('');
                }}
                sx={{
                  cursor: 'pointer',
                  outline: selected ? '2px solid' : 'none',
                  outlineColor: selected ? `${card.color}.main` : 'transparent',
                }}
              />
            </Box>
          );
        })}
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        {screenCard.note}
      </Alert>

      <Card sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search worker, employer, details..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {isRaisedScreen ? (
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { md: 200 } }}
            >
              <MenuItem value="all">All</MenuItem>
              {['open', 'under_review', 'resolved', 'withdrawn'].map((value) => {
                const option = getAllegationStatusOption(value);
                return (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </TextField>
          ) : null}
        </Stack>

        {isLoading ? (
          <ModuleLoading />
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {apiMessage(error, 'Could not load allegations')}
          </Alert>
        ) : (
          <Scrollbar>
            <Table size="small" sx={{ minWidth: isRaisedScreen ? 900 : 720 }}>
              <TableHeadCustom headLabel={isRaisedScreen ? ALLEGATION_TABLE_HEAD : FEED_TABLE_HEAD} />

              <TableBody>
                {isRaisedScreen
                  ? null
                  : visibleAllegations.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{row.workerName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.workerEmail || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.accountLabel || '—'}</TableCell>
                        <TableCell>
                          {row.description ||
                            (row.reportCount ? `Report count ${row.reportCount}` : '—')}
                        </TableCell>
                        <TableCell>{row.createdAt ? fToNow(row.createdAt) : '—'}</TableCell>
                      </TableRow>
                    ))}
                {isRaisedScreen
                  ? visibleAllegations.map((row) => {
                  const shiftsToAction = (row.affectedShifts || []).filter(
                    (shift) => shift.status === SHIFT_ACTION_STATUS.NEEDS_REALLOCATION
                  ).length;
                  const selected = selectedAllegationId === row.id;
                  const statusOptions = getAllowedAllegationStatuses(row.status);
                  const statusLocked = statusOptions.length <= 1;
                  const statusValue = statusOptions.some((option) => option.value === row.status)
                    ? row.status
                    : statusOptions[0]?.value || '';

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selected}
                      onClick={() => setSelectedAllegationId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{row.workerName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.workerEmail || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.employerName || '—'}</TableCell>
                      <TableCell>{getAllegationTypeLabel(row.allegationType)}</TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={statusValue}
                          disabled={statusLocked || updatingStatus}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleStatusChange(row, event.target.value);
                          }}
                          sx={{ minWidth: 150 }}
                        >
                          {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="center">
                        <Label color={shiftsToAction ? 'warning' : 'default'} variant="soft">
                          {shiftsToAction}
                        </Label>
                      </TableCell>
                      <TableCell>{row.createdAt ? fToNow(row.createdAt) : '—'}</TableCell>
                    </TableRow>
                  );
                })
                  : null}

                <TableNoData notFound={!visibleAllegations.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        )}

        <TablePaginationCustom
          count={pagerCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => {
            setPage(nextPage);
            setSelectedAllegationId('');
          }}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
            setSelectedAllegationId('');
          }}
        />
      </Card>

      {isRaisedScreen && selectedAllegation ? (
        <Card>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Affected shifts — {selectedAllegation.workerName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedAllegation.description || '—'}
            </Typography>

            {pendingShifts.length ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {pendingShifts.length} shift{pendingShifts.length === 1 ? '' : 's'} still need
                re-allocation or re-publishing.
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                No shifts are waiting on this allegation.
              </Alert>
            )}
          </Box>

          <Scrollbar>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHeadCustom headLabel={SHIFT_TABLE_HEAD} />

              <TableBody>
                {(selectedAllegation.affectedShifts || []).map((shift) => {
                  const status = getShiftActionStatusOption(shift.status);
                  const canAction = shift.status === SHIFT_ACTION_STATUS.NEEDS_REALLOCATION;

                  return (
                    <TableRow key={shift.id} hover>
                      <TableCell>{shift.ref}</TableCell>
                      <TableCell>
                        {shift.date ? fDate(shift.date) : '—'}
                        {shift.startTime || shift.endTime ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {shift.startTime}–{shift.endTime}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{shift.location || '—'}</TableCell>
                      <TableCell>{shift.role || '—'}</TableCell>
                      <TableCell>
                        <Label color={status.color} variant="soft">
                          {status.label}
                        </Label>
                      </TableCell>
                      <TableCell>{shift.replacementWorkerName || '—'}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 260, width: 260 }}>
                        {canAction ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ minWidth: 240 }}>
                            <Tooltip title="Choose a replacement worker, then assign this shift" arrow>
                              <Button
                                type="button"
                                size="small"
                                variant="outlined"
                                disabled={reallocating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenReallocate(shift);
                                }}
                                sx={{ whiteSpace: 'nowrap', minWidth: 108 }}
                              >
                                Re-allocate
                              </Button>
                            </Tooltip>
                            <Tooltip title="Put the shift back so other suppliers can bid" arrow>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={republishing}
                                onClick={() => handleRepublish(shift)}
                                sx={{ whiteSpace: 'nowrap', minWidth: 108 }}
                              >
                                Re-publish
                              </Button>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {shift.status === SHIFT_ACTION_STATUS.REPUBLISHED ? 'Open for bids' : 'Completed'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableNoData notFound={!(selectedAllegation.affectedShifts || []).length} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Card>
      ) : null}

      <ReallocateShiftDialog
        open={reallocateState.open}
        shift={reallocateState.shift}
        workers={reallocateState.workers}
        loading={loadingReplacements}
        error={reallocateState.error}
        submitting={reallocating}
        onClose={() => setReallocateState({ open: false, shift: null, workers: [], error: '' })}
        onConfirm={handleConfirmReallocate}
      />
    </DashboardContent>
  );
}
