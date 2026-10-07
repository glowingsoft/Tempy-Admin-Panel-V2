import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import {
  formatCertificateDate,
  getTrafficLightMeta,
  getVerifiedCertificates,
} from './care-tutor-api-utils';
import { getCareTutorSettings, getCareTutorStaffRecord, verifyStaffCourse } from './care-tutor-store';

// ----------------------------------------------------------------------

function CertificateRow({ certificate }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.neutral',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Iconify icon="solar:diploma-verified-bold" width={22} sx={{ color: 'success.main', mt: 0.25 }} />
        <Box>
          <Typography variant="subtitle2">{certificate.courseTitle}</Typography>
          <Typography variant="caption" color="text.secondary">
            Verified {formatCertificateDate(certificate.verifiedAt)}
            {certificate.expiresAt ? ` · Expires ${formatCertificateDate(certificate.expiresAt)}` : ''}
          </Typography>
          {certificate.certificateId ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Ref: {certificate.certificateId}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      <Chip size="small" color="success" variant="soft" label="Care Tutor verified" />
    </Stack>
  );
}

export function CareTutorStaffPanel({
  orgId,
  staffId,
  staffName,
  compact = false,
  showDemoActions = false,
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  const record = useMemo(() => {
    void refreshKey;
    return getCareTutorStaffRecord(orgId, staffId);
  }, [orgId, refreshKey, staffId]);

  const settings = useMemo(() => getCareTutorSettings(orgId), [orgId]);
  const verified = getVerifiedCertificates(record);
  const overallMeta = getTrafficLightMeta(record?.overall || 'grey');

  const inProgressCourses = Object.entries(record?.courses || {}).filter(([, status]) => status === 'amber');

  const handleDemoVerify = (courseTitle) => {
    verifyStaffCourse(orgId, staffId, courseTitle);
    setRefreshKey((value) => value + 1);
  };

  if (!record && compact) {
    return (
      <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:diploma-bold" width={20} />
          <Typography variant="body2" color="text.secondary">
            No Care Tutor training linked yet.
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Card sx={{ p: compact ? 2 : 3, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:diploma-verified-bold" width={22} sx={{ color: 'success.main' }} />
          <Typography variant={compact ? 'subtitle1' : 'h6'}>Care Tutor training</Typography>
        </Stack>
        {record ? (
          <Label variant="soft" color={overallMeta.color}>
            {overallMeta.label}
          </Label>
        ) : null}
      </Stack>

      {record ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {record.completed ?? 0}/{record.total ?? 0} courses complete
          {record.overdue ? ` · ${record.overdue} overdue` : ''}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enrol {staffName || 'this worker'} in mandatory training via Care Tutor. Verified certificates
          sync here automatically.
        </Typography>
      )}

      {verified.length ? (
        <Stack spacing={1.25}>
          {verified.map((certificate) => (
            <CertificateRow key={certificate.id || certificate.courseTitle} certificate={certificate} />
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            py: 2.5,
            px: 2,
            borderRadius: 1.5,
            textAlign: 'center',
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No verified Care Tutor certificates yet.
          </Typography>
        </Box>
      )}

      {showDemoActions && inProgressCourses.length ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Demo: simulate Care Tutor webhook verification
          </Typography>
          {inProgressCourses.map(([courseTitle]) => (
            <Button
              key={courseTitle}
              size="small"
              variant="outlined"
              color="success"
              onClick={() => handleDemoVerify(courseTitle)}
            >
              Mark &quot;{courseTitle}&quot; verified
            </Button>
          ))}
        </Stack>
      ) : null}

      {!compact ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Tempy commission on training: {settings.commissionPercent}% · Last sync {settings.lastSync}
        </Typography>
      ) : null}
    </Card>
  );
}
