import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { MANDATORY_TRAINING_COURSES } from 'src/sections/care-home/compliance/care-home-compliance-data';

import { CareTutorEnrolDialog } from './care-tutor-enrol-dialog';
import { CareTutorMatrixTable, CareTutorSummaryChips } from './care-tutor-matrix-table';
import { CareTutorProviderCard } from './care-tutor-provider-card';
import {
  getCareTutorSettings,
  getCareTutorStaffList,
  saveCareTutorSettings,
} from './care-tutor-store';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

function mergeTrainingRows(orgId, workers = []) {
  const storeList = getCareTutorStaffList(orgId);
  const byId = new Map(storeList.map((row) => [String(row.staffId), row]));
  const byName = new Map(storeList.map((row) => [String(row.staffName || '').toLowerCase(), row]));

  if (!workers.length) return storeList;

  return workers.map((worker) => {
    const id = String(worker.id || worker._id || '');
    const stored = byId.get(id) || byName.get(String(worker.name || '').toLowerCase());

    if (stored) {
      return {
        ...stored,
        staffId: id || stored.staffId,
        staffName: worker.name || stored.staffName,
      };
    }

    const emptyCourses = MANDATORY_TRAINING_COURSES.reduce((acc, title) => {
      acc[title] = 'grey';
      return acc;
    }, {});

    return {
      staffId: id,
      staffName: worker.name || 'Staff',
      overall: 'grey',
      completed: 0,
      total: MANDATORY_TRAINING_COURSES.length,
      overdue: 0,
      courses: emptyCourses,
      certificates: [],
    };
  });
}

export function CareTutorTrainingSection({ orgId, workers = [] }) {
  const viewOnly = useViewOnly();
  const [refreshKey, setRefreshKey] = useState(0);
  const [enrolOpen, setEnrolOpen] = useState(false);

  const settings = useMemo(() => {
    void refreshKey;
    return getCareTutorSettings(orgId);
  }, [orgId, refreshKey]);

  const rows = useMemo(() => {
    void refreshKey;
    return mergeTrainingRows(orgId, workers);
  }, [orgId, refreshKey, workers]);

  const staffOptions = useMemo(
    () =>
      workers.map((worker) => ({
        id: String(worker.id || worker._id || ''),
        name: worker.name || 'Staff',
      })),
    [workers]
  );

  const handleSync = () => {
    saveCareTutorSettings(orgId, { lastSync: 'Just now' });
    setRefreshKey((value) => value + 1);
  };

  return (
    <Stack spacing={3}>
      <CareTutorProviderCard settings={settings} onSync={handleSync} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h6">Training matrix</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Mandatory CQC training status per worker. Green = verified on Care Tutor.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <CareTutorSummaryChips rows={rows} />
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setEnrolOpen(true)}
            disabled={!staffOptions.length}
            // Admin viewing the account cannot enrol its staff.
            sx={{ display: viewOnly ? 'none' : 'inline-flex' }}
          >
            Enrol staff
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CareTutorMatrixTable rows={rows} />
      </Card>

      <CareTutorEnrolDialog
        open={enrolOpen}
        onClose={() => setEnrolOpen(false)}
        orgId={orgId}
        staffOptions={staffOptions}
        commissionPercent={settings.commissionPercent}
        onEnrolled={() => setRefreshKey((value) => value + 1)}
      />
    </Stack>
  );
}
