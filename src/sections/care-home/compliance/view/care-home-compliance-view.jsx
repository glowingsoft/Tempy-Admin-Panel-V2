import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomTabs } from 'src/components/custom-tabs';
import { ModuleLoading } from 'src/components/loading-screen';

import { useGetDashboardStaffQuery } from 'src/store/Reducer/staff-api';
import { canFetchDashboardStaff, resolveStaffAccountKey } from 'src/sections/staff/staff-api-utils';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { CareTutorTrainingSection } from 'src/sections/care-tutor/care-tutor-training-section';

import {
  EMPLOYER_COMPLIANCE_FILTERS,
  WORKER_COMPLIANCE_STATUS,
  mapToEmployerComplianceWorker,
} from '../care-home-compliance-data';

function workerInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'W';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SummaryTile({ label, value, color, icon }) {
  return (
    <Card
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        minWidth: 148,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.lighter`,
          color: `${color}.dark`,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={20} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Card>
  );
}

function WorkerComplianceCard({ row }) {
  const statusMeta = WORKER_COMPLIANCE_STATUS[row.status] || WORKER_COMPLIANCE_STATUS.pending;
  const hasQuals = Boolean(row.qualifications?.length);
  const isCompleted = row.status === 'completed';

  return (
    <Card
      sx={{
        p: 2.25,
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(99, 115, 129, 0.08)',
        borderLeft: (theme) =>
          `4px solid ${theme.vars.palette[isCompleted ? 'success' : 'warning'].main}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          src={row.avatarUrl || undefined}
          alt={row.name}
          sx={{ width: 48, height: 48, fontWeight: 700 }}
        >
          {workerInitials(row.name)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {row.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {[row.role, row.email].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <Label variant="soft" color={statusMeta.color} sx={{ flexShrink: 0 }}>
              {statusMeta.label}
            </Label>
          </Stack>
        </Box>
      </Stack>

      <Box
        sx={{
          mt: 2,
          px: 1.5,
          py: 1.25,
          borderRadius: 1.5,
          bgcolor: hasQuals ? 'primary.lighter' : 'background.neutral',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {hasQuals ? (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {row.qualifications.map((title) => (
              <Chip
                key={title}
                size="small"
                color="primary"
                variant="soft"
                label={title}
                icon={<Iconify icon="solar:diploma-verified-bold" width={14} />}
              />
            ))}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:diploma-bold" width={18} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              Awaiting certificates
            </Typography>
          </Stack>
        )}
      </Box>
    </Card>
  );
}

export function CareHomeComplianceView() {
  const { user } = useSelector((state) => state.user);
  const accountKey = useMemo(() => resolveStaffAccountKey(user), [user]);
  const canLoadWorkers = useMemo(() => canFetchDashboardStaff(user), [user]);
  const orgId = useMemo(() => getProfileUserId(user), [user]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('workers');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDashboardStaffQuery(
    {
      accountKey,
      page: 0,
      limit: 100,
    },
    { skip: !canLoadWorkers }
  );

  useEffect(() => {
    if (!isError || !canLoadWorkers) return;
    toast.error(error?.data?.message || error?.error || 'Could not load workers.');
  }, [canLoadWorkers, error, isError]);

  const workers = useMemo(
    () => (data?.data || []).map(mapToEmployerComplianceWorker),
    [data?.data]
  );

  const counts = useMemo(
    () => ({
      all: workers.length,
      completed: workers.filter((row) => row.status === 'completed').length,
      pending: workers.filter((row) => row.status === 'pending').length,
    }),
    [workers]
  );

  const filteredWorkers = useMemo(() => {
    if (statusFilter === 'all') return workers;
    return workers.filter((row) => row.status === statusFilter);
  }, [statusFilter, workers]);

  const listLoading = canLoadWorkers && (isLoading || isFetching);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Box>
            <Typography variant="h4">Compliance</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Workers, qualifications, and Care Tutor mandatory training.
            </Typography>
          </Box>

          {activeTab === 'workers' ? (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <SummaryTile
                label="Completed"
                value={counts.completed}
                color="success"
                icon="solar:check-circle-bold"
              />
              <SummaryTile
                label="Pending"
                value={counts.pending}
                color="warning"
                icon="solar:clock-circle-bold"
              />
            </Stack>
          ) : null}
        </Stack>

        <CustomTabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
          <Tab value="workers" label="Workers" />
          <Tab value="caretutor" label="Care Tutor" icon={<Iconify icon="solar:diploma-verified-bold" width={18} />} iconPosition="start" />
        </CustomTabs>

        {activeTab === 'caretutor' ? (
          <CareTutorTrainingSection orgId={orgId} workers={workers} />
        ) : (
          <>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          {EMPLOYER_COMPLIANCE_FILTERS.map((option) => {
            const selected = statusFilter === option.value;
            const count = counts[option.value] || 0;

            return (
              <Button
                key={option.value}
                size="small"
                variant={selected ? 'contained' : 'outlined'}
                color={
                  selected
                    ? option.value === 'pending'
                      ? 'warning'
                      : option.value === 'completed'
                        ? 'success'
                        : 'primary'
                    : 'inherit'
                }
                onClick={() => setStatusFilter(option.value)}
                sx={{
                  borderRadius: 5,
                  px: 1.75,
                  py: 0.85,
                  minHeight: 38,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: 'divider',
                  ...(!selected && {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                  }),
                }}
              >
                {option.label}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ ml: 0.75, fontWeight: 700, opacity: 0.8 }}
                >
                  {count}
                </Typography>
              </Button>
            );
          })}
        </Stack>

        {listLoading && !filteredWorkers.length ? <ModuleLoading /> : listLoading ? <LinearProgress sx={{ borderRadius: 0, height: 2 }} /> : null}

        {!canLoadWorkers ? (
          <EmptyContent
            filled
            title="Workers list not available for this account"
            description="Care Tutor training works below without this API. Backend can add GET /web/user/staff for Individual Home Care."
            action={
              <Button variant="outlined" onClick={() => setActiveTab('caretutor')}>
                Open Care Tutor
              </Button>
            }
          />
        ) : listLoading && !filteredWorkers.length ? null : !filteredWorkers.length ? (
          <EmptyContent
            filled
            title={isError ? 'Could not load workers' : 'No workers yet'}
            description={
              isError
                ? 'Check your connection and try again.'
                : statusFilter === 'completed'
                  ? 'No workers with completed qualifications yet.'
                  : statusFilter === 'pending'
                    ? 'No workers pending qualifications.'
                    : 'Workers will show here with completed or pending status and their qualifications.'
            }
            action={
              isError ? (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:refresh-fill" />}
                  onClick={() => refetch()}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              ) : null
            }
          />
        ) : (
          <Grid container spacing={2.5}>
            {filteredWorkers.map((row) => (
              <Grid key={row.id || row.name} item xs={12} md={6}>
                <WorkerComplianceCard row={row} />
              </Grid>
            ))}
          </Grid>
        )}
          </>
        )}
      </Stack>
    </DashboardContent>
  );
}
