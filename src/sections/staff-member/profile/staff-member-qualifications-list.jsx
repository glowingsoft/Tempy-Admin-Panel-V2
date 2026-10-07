import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { StaffMemberCertificateUploadRow } from './staff-member-certificate-upload-row';
import {
  createQualification,
  getVisibleQualifications,
  qualificationHasCertificate,
} from './staff-member-profile-store';

// ----------------------------------------------------------------------

export function StaffMemberQualificationsList({ qualifications = [], onChange }) {
  // No `onChange` → read-only (admin viewing the account): no add or remove.
  const readOnly = typeof onChange !== 'function';
  const visible = getVisibleQualifications({ qualifications });

  const updateItem = (id, patch) => {
    onChange(qualifications.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id) => {
    onChange(qualifications.filter((item) => item.id !== id));
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="solar:diploma-verified-bold" width={22} />
        <Typography variant="h6">Qualifications</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        List each qualification, then upload its certificate. It only shows on your profile after
        the file is uploaded. Originals are kept for checks — they are not shown on the public
        profile.
      </Typography>

      {visible.length ? (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
          {visible.map((item) => (
            <Chip
              key={item.id}
              color="success"
              variant="soft"
              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
              label={item.title}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Nothing listed yet. Add a name and upload the certificate to make it visible.
        </Typography>
      )}

      <Stack spacing={2}>
        {qualifications.map((item) => {
          const verified = qualificationHasCertificate(item) && String(item.title || '').trim();
          return (
            <Box
              key={item.id}
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'flex-start' }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Qualification"
                  placeholder="e.g. BLS, NVQ Level 3, NMC PIN"
                  value={item.title}
                  onChange={(event) => updateItem(item.id, { title: event.target.value })}
                />
                <Chip
                  size="small"
                  color={verified ? 'success' : 'default'}
                  variant={verified ? 'soft' : 'outlined'}
                  label={verified ? 'Visible on profile' : 'Hidden until uploaded'}
                  sx={{ flexShrink: 0, mt: { sm: 0.5 } }}
                />
                <IconButton
                  aria-label="Remove qualification"
                  onClick={() => removeItem(item.id)}
                  sx={{ flexShrink: 0, display: readOnly ? 'none' : 'inline-flex' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Stack>

              <Box sx={{ mt: 1.5 }}>
                <StaffMemberCertificateUploadRow
                  label="Certificate file"
                  icon="solar:file-check-bold-duotone"
                  helperText="Upload the certificate. Original stays on file — not shown publicly."
                  files={item.files || []}
                  onChange={(files) => updateItem(item.id, { files })}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Button
        sx={{ mt: 2, display: readOnly ? 'none' : 'inline-flex' }}
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => onChange([...qualifications, createQualification()])}
      >
        Add qualification
      </Button>
    </Card>
  );
}
