import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { resolveJobImageSrc } from 'src/components/jobs/job-image';
import { fCurrency } from 'src/utils/format-number';

import { getEmptyJobCareDetails } from './agency-job-care-details-store';

// ----------------------------------------------------------------------

function formatGender(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatRate(job) {
  if (job?.hourlyRate == null || job.hourlyRate === '') return '';
  return `${fCurrency(job.hourlyRate)} / hr`;
}

function shiftLine(row) {
  const people = Number(row?.allowedPersons) > 0 ? `${row.allowedPersons} staff` : '';
  const breakLabel = Number(row?.breakMin) > 0 ? `Break ${row.breakMin} min` : '';
  return [row?.label, breakLabel, people].filter(Boolean).join(' · ');
}

function seedFromJob(job) {
  return {
    ...getEmptyJobCareDetails(),
    notes: job?.careNotes || '',
    instructions: job?.instructions || '',
    contactName: job?.contactName || '',
    contactPhone: job?.contactPhone || '',
    contactEmail: job?.contactEmail || '',
    emergencyName: job?.emergencyName || '',
    emergencyPhone: job?.emergencyPhone || '',
    emergencyRelation: job?.emergencyRelation || '',
    documents: Array.isArray(job?.careDocuments)
      ? job.careDocuments.map((doc, index) => ({
          id: doc.id || doc._id || `api-doc-${index}`,
          name: doc.name || doc.fileName || doc.file || `Document ${index + 1}`,
          url: doc.url || doc.fileUrl || '',
          uploadedAt: doc.uploadedAt || '',
        }))
      : [],
  };
}

const emptyValue = '—';

function displayValue(value) {
  const text = String(value || '').trim();
  return text || emptyValue;
}

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function Fact({ label, value, sx }) {
  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {displayValue(value)}
      </Typography>
    </Box>
  );
}

export function AgencyJobCareDetailsDialog({ open, job, onClose }) {
  const form = useMemo(() => (job ? seedFromJob(job) : getEmptyJobCareDetails()), [job]);
  const imageSrc = resolveJobImageSrc(job?.image);
  const shifts = Array.isArray(job?.shiftRows) ? job.shiftRows : [];
  const jobType = job?.jobTypeTitle || job?.typeTitle || job?.role || '';
  const shiftLines = shifts.map(shiftLine).filter(Boolean);

  return (
    <Dialog open={open} onClose={() => onClose?.(false)} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ position: 'relative', pr: 6, pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {imageSrc ? (
            <Box
              component="img"
              src={imageSrc}
              alt=""
              sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
            />
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {job?.title || 'View details'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {displayValue(jobType)}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={() => onClose?.(false)}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={2.5} divider={<Divider flexItem />}>
          <Box>
            <SectionTitle>Job details</SectionTitle>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Fact label="Location" value={job?.address} sx={{ gridColumn: '1 / -1' }} />
              <Fact label="Rate per hour" value={formatRate(job)} />
              <Fact label="Gender" value={formatGender(job?.gender)} />
              <Fact label="Description" value={job?.description} sx={{ gridColumn: '1 / -1' }} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {shifts.length > 1 ? 'Shifts' : 'Shift'}
                </Typography>
                {shiftLines.length ? (
                  <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                    {shiftLines.map((line) => (
                      <Typography key={line} variant="body2">
                        {line}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ mt: 0.25 }}>
                    {emptyValue}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box>
            <SectionTitle>Care details</SectionTitle>
            <Stack spacing={2}>
              <Fact label="Notes (person / location)" value={form.notes} />
              <Fact label="Instructions" value={form.instructions} />
            </Stack>
          </Box>

          <Box>
            <SectionTitle>Contact details</SectionTitle>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Fact label="Contact name" value={form.contactName} />
              <Fact label="Contact phone" value={form.contactPhone} />
              <Fact label="Contact email" value={form.contactEmail} sx={{ gridColumn: '1 / -1' }} />
            </Box>
          </Box>

          <Box>
            <SectionTitle>Emergency contact</SectionTitle>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Fact label="Name" value={form.emergencyName} />
              <Fact label="Phone" value={form.emergencyPhone} />
              <Fact label="Relation" value={form.emergencyRelation} sx={{ gridColumn: '1 / -1' }} />
            </Box>
          </Box>

          <Box>
            <SectionTitle>Documents</SectionTitle>
            {!form.documents?.length ? (
              <Typography variant="body2" color="text.secondary">
                No documents provided
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {form.documents.map((doc) => (
                  <Stack
                    key={doc.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Iconify icon="solar:document-bold" width={18} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" noWrap sx={{ minWidth: 0, flex: 1 }}>
                      {doc.name}
                    </Typography>
                    {doc.url ? (
                      <IconButton
                        size="small"
                        component="a"
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Iconify icon="solar:eye-bold" width={16} />
                      </IconButton>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" onClick={() => onClose?.(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
